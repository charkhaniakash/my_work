'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Search, X } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface NewConversationProps {
  onClose: () => void
  onConversationCreated: () => void
}

export default function NewConversation({ onClose, onConversationCreated }: NewConversationProps) {
  const { user } = useUser()
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClientComponentClient()

  const searchUsers = async () => {
    if (!searchTerm.trim()) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`full_name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`)
        .neq('id', user?.id)
        .limit(10)

      if (error) throw error
      setSearchResults(data || [])
    } catch (error) {
      console.error('Error searching users:', error)
      toast.error('Failed to search users')
    } finally {
      setLoading(false)
    }
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
        onConversationCreated()
        onClose()
        return
      }

      // Create new conversation
      const { error } = await supabase
        .from('conversations')
        .insert({
          brand_id: user?.publicMetadata.role === 'brand' ? user?.id : otherUser.id,
          influencer_id: user?.publicMetadata.role === 'brand' ? otherUser.id : user?.id
        })

      if (error) throw error

      toast.success('Conversation started')
      onConversationCreated()
      onClose()
    } catch (error) {
      console.error('Error starting conversation:', error)
      toast.error('Failed to start conversation')
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">New Conversation</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or username"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
              className="block w-full rounded-md border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
            />
          </div>

          <div className="mt-4">
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
              </div>
            ) : searchResults.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {searchResults.map((result) => (
                  <li
                    key={result.id}
                    className="py-3 cursor-pointer hover:bg-gray-50"
                    onClick={() => startConversation(result)}
                  >
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        {result.profile_image ? (
                          <img
                            src={result.profile_image}
                            alt={result.full_name || ''}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200" />
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {result.full_name || result.username}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {result.role}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : searchTerm ? (
              <p className="text-center text-gray-500 py-4">No users found</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
} 