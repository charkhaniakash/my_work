'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'react-hot-toast'
import { Send, Users, Building2, UserPlus, Plus, Search } from 'lucide-react'
import NewConversation from '@/components/NewConversation'
import { useSupabase } from '@/lib/providers/supabase-provider'
import { User as DBUser } from '@/lib/types/database'
import { createMessageNotification } from '@/lib/services/notification-service'
import { MessageSkeleton, ButtonLoader } from '@/components/loaders'

type User = DBUser;

interface Conversation {
  id: string
  created_at: string
  updated_at: string
  participants: string[]
}

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
}

export default function Messages() {
  const { user, isLoading: userLoading } = useSupabase()
  const searchParams = useSearchParams()
  const contactId = searchParams?.get('contact')
  const supabase = createClientComponentClient()
  const [selectedContact, setSelectedContact] = useState<User | null>(null)
  const [contacts, setContacts] = useState<User[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [showNewMessageForm, setShowNewMessageForm] = useState(false)
  const [email, setEmail] = useState('')
  const [userSearchResults, setUserSearchResults] = useState<User[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewConversation, setShowNewConversation] = useState(false)
  const [modalUserSearchResults, setModalUserSearchResults] = useState<User[]>([])
  const [modalLoading, setModalLoading] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)

  // Add effect to handle contact parameter from URL
  useEffect(() => {
    if (contactId && user) {
      loadContact(contactId)
    }
  }, [contactId, user])

  console.log("contacts" , contacts)
  useEffect(() => {
    if (!userLoading && user) {
      loadContacts()
    }
  }, [userLoading, user])

  useEffect(() => {
    if (selectedContact) {
      loadMessages()
      const cleanup = subscribeToMessages()
      return () => {
        cleanup()
      }
    }
  }, [selectedContact])

  useEffect(() => {
    if (showNewMessageForm) {
      loadAllUsers()
    }
  }, [showNewMessageForm])

  const loadContacts = async () => {
    if (!user) return
    try {
      // Get all users who have exchanged messages with the current user
      const { data: messageUsers, error: messageError } = await supabase
        .from('messages')
        .select('sender_id, receiver_id')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)

        if (messageError) throw messageError

      // Get unique user IDs from messages
      const userIds = new Set<string>()
      messageUsers?.forEach(msg => {
        if (msg.sender_id !== user.id) userIds.add(msg.sender_id)
        if (msg.receiver_id !== user.id) userIds.add(msg.receiver_id)
      })

      // Fetch user details for all contacts
      // if (userIds.size > 0) {
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('*')
          .in('id', Array.from(userIds))

          console.log("users" , users)

        if (usersError) throw usersError
        setContacts(users || [])
      // }
    } catch (error) {
      console.error('Error loading contacts:', error)
      toast.error('Failed to load contacts')
    } finally {
      setLoading(false)
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
    if (!selectedContact || !user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedContact.id}),and(sender_id.eq.${selectedContact.id},receiver_id.eq.${user.id})`)
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
    if (!selectedContact || !newMessage.trim() || !user) return

    try {
      setSendingMessage(true)
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: selectedContact.id,
          content: newMessage.trim()
        })
        .select()
        .single()

      if (error) throw error
      
      // Create notification for message recipient
      await createMessageNotification(
        selectedContact.id,
        user.user_metadata?.full_name || user.email,
        newMessage.trim(),
        data.id
      )
      
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setSendingMessage(false)
    }
  }

  const subscribeToMessages = () => {
    if (!selectedContact || !user) return () => {}

    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${selectedContact.id},receiver_id=eq.${user.id}`
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

  const loadAllUsers = async () => {
    if (!user) return
    try {
      setLoading(true)
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .neq('id', user.id)
        .neq('role', user.role) // Only show users with different roles
        .limit(20)

      if (error) throw error

      // Filter out existing contacts
      const filteredUsers = (users || []).filter(u => 
        !contacts.some(c => c.id === u.id)
      )
      
      setUserSearchResults(filteredUsers)
    } catch (error) {
      console.error('Error loading users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const searchUsers = async (searchTerm: string) => {
    if (!user) return
    try {
      setLoading(true)
      
      let query = supabase
        .from('users')
        .select('*')
        .neq('id', user.id)
        .neq('role', user.role) // Only show users with different roles
      
      if (searchTerm.trim()) {
        query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      }
      
      query = query.limit(10)
      
      const { data: users, error } = await query

      if (error) throw error

      // Filter out existing contacts
      const filteredUsers = (users || []).filter(u => 
        !contacts.some(c => c.id === u.id)
      )
      
      setUserSearchResults(filteredUsers)
    } catch (error) {
      console.error('Error searching users:', error)
      toast.error('Failed to search users')
    } finally {
      setLoading(false)
    }
  }

  const startConversation = (contact: User) => {
    setSelectedContact(contact)
    setContacts(prev => [...prev, contact])
    setShowNewMessageForm(false)
    setEmail('')
    setUserSearchResults([])
  }

  const loadConversations = async () => {
    try {
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select('*')

      if (conversationsError) throw conversationsError

      setConversations(conversationsData || [])
    } catch (error) {
      console.error('Error loading conversations:', error)
      toast.error('Failed to load conversations')
    }
  }

  // Add filtered contacts based on search term
  const filteredContacts = contacts.filter(contact => 
    contact.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Update the search input handler
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  // Modal-specific user search for NewConversation
  const modalSearchUsers = async (searchTerm: string) => {
    if (!user) return
    try {
      setModalLoading(true)
      let query = supabase
        .from('users')
        .select('*')
        .neq('id', user.id)
        .neq('role', user.role)
      if (searchTerm.trim()) {
        query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      }
      query = query.limit(10)
      const { data: users, error } = await query
      if (error) throw error
      const filteredUsers = (users || []).filter(u => !contacts.some(c => c.id === u.id))
      setModalUserSearchResults(filteredUsers)
    } catch (error) {
      console.error('Error searching users:', error)
      toast.error('Failed to search users')
    } finally {
      setModalLoading(false)
    }
  }

  // When opening the modal, load initial users for modal only
  const openNewConversation = () => {
    setShowNewConversation(true)
    modalSearchUsers('')
  }

  if (userLoading || loading || !user) {
    return (
      <div className="h-[calc(100vh-4rem)] flex">
        {/* Conversations List Loading */}
        <div className="w-80 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations"
                disabled
                className="block w-full rounded-md border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
              />
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto">
            <div className="space-y-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <MessageSkeleton key={i} />
              ))}
            </div>
          </nav>
        </div>

        {/* Chat Area Loading */}
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center px-6 py-10">
            <div className="animate-pulse">
              <div className="h-12 w-12 bg-gray-200 rounded-full mx-auto mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-32 mx-auto mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-48 mx-auto"></div>
            </div>
          </div>
        </div>
    </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Conversations List */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
            <button
              onClick={openNewConversation}
              className="p-1 rounded-full hover:bg-gray-100"
              title="New conversation"
            >
              <Plus className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations"
              value={searchTerm}
              onChange={handleSearchChange}
              className="block w-full rounded-md border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto">
          {filteredContacts.length > 0 ? (
            <ul role="list" className="divide-y divide-gray-200">
              {filteredContacts.map((contact) => (
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
          ) : (
            <div className="p-4 text-center text-sm text-gray-500">
              {searchTerm ? (
                <p>No conversations found matching "{searchTerm}"</p>
              ) : (
                <>
                  <p>No conversations yet</p>
                  <p className="mt-1">Click the "+" icon above to start a new conversation</p>
                  <p className="mt-2">Or apply to campaigns to get in touch with brands</p>
                </>
              )}
            </div>
          )}
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
                {messages.length > 0 ? (
                  messages.map((message) => (
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
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-6">
                    <p>No messages yet.</p>
                    <p className="mt-1">Be the first to send a message!</p>
                  </div>
                )}
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
                  disabled={!newMessage.trim() || sendingMessage}
                  className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingMessage ? (
                    <ButtonLoader />
                  ) : (
                  <Send className="h-4 w-4" />
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center px-6 py-10">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Your Messages</h3>
              <p className="mt-1 text-sm text-gray-500">
                Select a contact to start messaging or create a new conversation.
              </p>
              <button
                onClick={() => setShowNewMessageForm(true)}
                className="mt-4 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                New Conversation
              </button>
            </div>
          </div>
        )}
      </div>

      {showNewConversation && (
        <NewConversation
          onClose={() => setShowNewConversation(false)}
          onConversationCreated={(contact) => {
            setSelectedContact(contact)
            if (!contacts.find(c => c.id === contact.id)) {
              setContacts(prev => [...prev, contact])
            }
            setShowNewConversation(false)
          }}
          userSearchResults={modalUserSearchResults}
          onSearch={modalSearchUsers}
          loading={modalLoading}
        />
      )}
    </div>
  )
} 