'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useUser } from '@clerk/nextjs'
import { User } from '@/lib/types/database'
import { toast } from 'react-hot-toast'
import { Send, Users, Building2, UserPlus } from 'lucide-react'

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
  const [showNewMessageForm, setShowNewMessageForm] = useState(false)
  const [email, setEmail] = useState('')
  const [userSearchResults, setUserSearchResults] = useState<User[]>([])


  console.log("contacts" , contacts)
  useEffect(() => {
    if (isLoaded && user) {
      loadContacts()
      // const contactId = searchParams.get('contact')
      // if (contactId) {
      //   loadContact(contactId)
      // }
    }
  }, [isLoaded, user])

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
    if (showNewMessageForm && user) {
      loadAllUsers()
    }
  }, [showNewMessageForm])

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

  const loadAllUsers = async () => {
    try {
      console.log('Loading all users...')
      setLoading(true)
      // Load all users except the current user
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .neq('id', user?.id || '')
        .limit(20)

      if (error) throw error
      
      console.log('Found users:', users?.length || 0)
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

  const searchUsers = async (email: string) => {
    try {
      console.log('Searching for users with email containing:', email)
      setLoading(true)
      
      let query = supabase.from('users').select('*')
      
      // If email is provided, filter by it
      if (email.trim()) {
        query = query.ilike('email', `%${email}%`)
      }
      
      // Don't include the current user
      query = query.neq('id', user?.id || '')
        
      // Limit to reasonable number
      query = query.limit(10)
      
      const { data: users, error } = await query
      
      if (error) throw error
      
      console.log('Search results:', users?.length || 0, 'users')
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

  if (!isLoaded || loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col space-y-4">
      <div className="flex flex-1 overflow-hidden rounded-lg bg-white shadow">
        {/* Contacts Sidebar */}
        <div className="w-64 border-r border-gray-200">
          <div className="p-4 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Messages</h2>
            <button 
              onClick={() => setShowNewMessageForm(true)}
              className="p-1 rounded-full hover:bg-gray-100"
              title="New message"
            >
              <UserPlus className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          
          {/* New Message Form */}
          {showNewMessageForm && (
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">New Message</h3>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Search by email or name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (e.target.value.trim()) {
                      searchUsers(e.target.value)
                    } else {
                      loadAllUsers()
                    }
                  }}
                  onKeyUp={(e) => e.key === 'Enter' && searchUsers(email)}
                />
                <button
                  onClick={() => searchUsers(email)}
                  className="w-full py-1 bg-indigo-600 text-white rounded text-sm"
                >
                  Search
                </button>
              </div>
              
              <div className="mt-3 border-t border-gray-200 pt-2">
                <h4 className="text-xs font-medium text-gray-500 mb-1">
                  {userSearchResults.length > 0 ? 'Available Users' : 'No users found'}
                </h4>
                <ul className="space-y-1 max-h-48 overflow-y-auto">
                  {userSearchResults.map(user => (
                    <li 
                      key={user.id}
                      className="p-2 hover:bg-gray-50 rounded cursor-pointer text-sm"
                      onClick={() => startConversation(user)}
                    >
                      <div className="flex items-center">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} className="h-6 w-6 rounded-full mr-2" alt={user.full_name} />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-gray-100 mr-2 flex items-center justify-center">
                            <span className="text-xs">{user.full_name ? user.full_name[0] : '?'}</span>
                          </div>
                        )}
                        <div>
                          <span className="font-medium">{user.full_name || 'Unknown User'}</span>
                          <span className="text-xs text-gray-500 ml-2">({user.role || 'user'})</span>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          <nav className="flex-1 overflow-y-auto">
            {contacts.length > 0 ? (
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
            ) : (
              <div className="p-4 text-center text-sm text-gray-500">
                <p>No conversations yet</p>
                <p className="mt-1">Click the "+" icon above to start a new conversation</p>
                <p className="mt-2">Or apply to campaigns to get in touch with brands</p>
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
                    disabled={!newMessage.trim()}
                    className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-4 w-4" />
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
      </div>
    </div>
  )
} 