'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useUser } from '@clerk/nextjs'
import { User } from '@/lib/types/database'
import { toast } from 'react-hot-toast'
import { Send, Users, Building2 } from 'lucide-react'

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
}

export default function Messages() {
  const { user, isLoaded } = useUser()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()
  
  const [contacts, setContacts] = useState<User[]>([])
  const [selectedContact, setSelectedContact] = useState<User | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isLoaded && user) {
      loadContacts()
      const contactId = searchParams.get('contact')
      if (contactId) {
        loadContact(contactId)
      }
    }
  }, [isLoaded, user, searchParams])

  useEffect(() => {
    if (selectedContact) {
      loadMessages()
      const cleanup = subscribeToMessages()
      return () => {
        cleanup()
      }
    }
  }, [selectedContact])

  const loadContacts = async () => {
    try {
      // Get all users who have exchanged messages with the current user
      const { data: messageUsers, error: messageError } = await supabase
        .from('messages')
        .select('sender_id, receiver_id')
        .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)

      if (messageError) throw messageError

      // Get unique user IDs from messages
      const userIds = new Set<string>()
      messageUsers?.forEach(msg => {
        if (msg.sender_id !== user?.id) userIds.add(msg.sender_id)
        if (msg.receiver_id !== user?.id) userIds.add(msg.receiver_id)
      })

      // Fetch user details for all contacts
      if (userIds.size > 0) {
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('*')
          .in('id', Array.from(userIds))

        if (usersError) throw usersError
        setContacts(users || [])
      }
    } catch (error) {
      console.error('Error loading contacts:', error)
      toast.error('Failed to load contacts')
    }
  }

  const loadContact = async (contactId: string) => {
    try {
      const { data: contact, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', contactId)
        .single()

      if (error) throw error
      if (contact) {
        setSelectedContact(contact)
        if (!contacts.find(c => c.id === contact.id)) {
          setContacts(prev => [...prev, contact])
        }
      }
    } catch (error) {
      console.error('Error loading contact:', error)
      toast.error('Failed to load contact')
    }
  }

  const loadMessages = async () => {
    if (!selectedContact) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${selectedContact.id}),and(sender_id.eq.${selectedContact.id},receiver_id.eq.${user?.id})`)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error loading messages:', error)
      toast.error('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedContact || !newMessage.trim()) return

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user?.id,
          receiver_id: selectedContact.id,
          content: newMessage.trim()
        })

      if (error) throw error
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    }
  }

  const subscribeToMessages = () => {
    if (!selectedContact) return () => {}

    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${selectedContact.id},receiver_id=eq.${user?.id}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  if (!isLoaded || loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col space-y-4">
      <div className="flex flex-1 overflow-hidden rounded-lg bg-white shadow">
        {/* Contacts Sidebar */}
        <div className="w-64 border-r border-gray-200">
          <div className="p-4">
            <h2 className="text-lg font-medium text-gray-900">Messages</h2>
          </div>
          <nav className="flex-1 overflow-y-auto">
            <ul role="list" className="divide-y divide-gray-200">
              {contacts.map((contact) => (
                <li
                  key={contact.id}
                  className={`cursor-pointer hover:bg-gray-50 ${
                    selectedContact?.id === contact.id ? 'bg-gray-50' : ''
                  }`}
                  onClick={() => setSelectedContact(contact)}
                >
                  <div className="flex items-center px-4 py-4 sm:px-6">
                    <div className="flex min-w-0 flex-1 items-center">
                      <div className="flex-shrink-0">
                        {contact.avatar_url ? (
                          <img
                            className="h-12 w-12 rounded-full"
                            src={contact.avatar_url}
                            alt={contact.full_name}
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                            {contact.role === 'brand' ? (
                              <Building2 className="h-6 w-6 text-gray-400" />
                            ) : (
                              <Users className="h-6 w-6 text-gray-400" />
                            )}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 px-4">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {contact.full_name}
                        </p>
                        <p className="truncate text-sm text-gray-500">
                          {contact.role}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Chat Area */}
        <div className="flex flex-1 flex-col">
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div className="border-b border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {selectedContact.avatar_url ? (
                      <img
                        className="h-12 w-12 rounded-full"
                        src={selectedContact.avatar_url}
                        alt={selectedContact.full_name}
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                        {selectedContact.role === 'brand' ? (
                          <Building2 className="h-6 w-6 text-gray-400" />
                        ) : (
                          <Users className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <h2 className="text-lg font-medium text-gray-900">
                      {selectedContact.full_name}
                    </h2>
                    <p className="text-sm text-gray-500 capitalize">
                      {selectedContact.role}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`rounded-lg px-4 py-2 ${
                          message.sender_id === user?.id
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="mt-1 text-xs opacity-75">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Message Input */}
              <div className="border-t border-gray-200 p-4">
                <form onSubmit={sendMessage} className="flex space-x-4">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-gray-500">Select a contact to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 