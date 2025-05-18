'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Search, X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useSupabase } from '@/lib/providers/supabase-provider'
import { User } from '@/lib/types/database'
import { supabase } from '@/lib/supabase'

interface NewConversationProps {
  onClose: () => void
  onConversationCreated: (contact: User) => void
  userSearchResults: User[]
  onSearch: (searchTerm: string) => void
  loading: boolean
}

export default function NewConversation({
  onClose,
  onConversationCreated,
  userSearchResults,
  onSearch,
  loading
}: NewConversationProps) {
  const { user, isLoading: userLoading } = useSupabase()
  const [searchTerm, setSearchTerm] = useState('')

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    onSearch(value)
  }

  const startConversation = async (otherUser: any) => {
    try {
      // Check if conversation already exists
      const { data: existingConversation, error: checkError } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(brand_id.eq.${user?.id},influencer_id.eq.${otherUser.id}),and(brand_id.eq.${otherUser.id},influencer_id.eq.${user?.id})`)
        .single()

      if (checkError && checkError.code !== 'PGRST116') throw checkError

      if (existingConversation) {
        onConversationCreated(otherUser)
        onClose()
        return
      }

      // Create new conversation
      const { error } = await supabase
        .from('conversations')
        .insert({
          brand_id: user?.user_metadata?.role === 'brand' ? user?.id : otherUser.id,
          influencer_id: user?.user_metadata?.role === 'brand' ? otherUser.id : user?.id
        })

      if (error) throw error

      toast.success('Conversation started')
      onConversationCreated(otherUser)
      onClose()
    } catch (error) {
      console.error('Error starting conversation:', error)
      toast.error('Failed to start conversation')
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">New Conversation</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name or email"
            value={searchTerm}
            onChange={handleSearch}
            className="block w-full rounded-md border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
          />
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
          ) : userSearchResults.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {userSearchResults.map((user) => (
                <li
                  key={user.id}
                  className="py-3 px-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => startConversation(user)}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {user.avatar_url ? (
                        <img
                          className="h-10 w-10 rounded-full"
                          src={user.avatar_url}
                          alt={user.full_name}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-500 text-sm">
                            {user.full_name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {user.full_name}
                      </p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-4 text-gray-500">
              {searchTerm ? (
                <p>No users found matching "{searchTerm}"</p>
              ) : (
                <p>Start typing to search for users</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 