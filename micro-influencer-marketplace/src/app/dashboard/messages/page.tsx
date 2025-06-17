'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'react-hot-toast'
import { 
  Send, 
  Users, 
  Building2, 
  UserPlus, 
  Plus, 
  Search, 
  Paperclip,
  Image,
  Smile,
  MoreVertical,
  Check,
  CheckCheck
} from 'lucide-react'
import NewConversation from '@/components/NewConversation'
import { useSupabase } from '@/lib/providers/supabase-provider'
import { User as DBUser } from '@/lib/types/database'
import { createMessageNotification } from '@/lib/services/notification-service'
import { MessageSkeleton, ButtonLoader } from '@/components/loaders'
import { RealtimeChannel } from '@supabase/supabase-js'
import { useConversations } from '@/lib/hooks/useConversations'
import { formatDistanceToNow } from 'date-fns'

type User = DBUser;

interface DBConversation {
  id: string
  brand_id: string
  influencer_id: string
}

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
  conversation_id: string
  is_read: boolean
  delivered: boolean
}

interface MessageUser {
  sender_id: string
  receiver_id: string
}

interface RealtimePayload<T> {
  new: T
  old: T
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
}

export default function Messages() {
  const { user: authUser, isLoading: userLoading } = useSupabase()
  const user = authUser as unknown as User | null
  const searchParams = useSearchParams()
  const router = useRouter()
  const contactId = searchParams?.get('contact')
  const supabase = createClientComponentClient()
  const { markAsRead } = useConversations()
  const [selectedContact, setSelectedContact] = useState<User | null>(null)
  const [contacts, setContacts] = useState<User[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [lastMessages, setLastMessages] = useState<Record<string, Message>>({})
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [showNewConversation, setShowNewConversation] = useState(false)
  const [modalUserSearchResults, setModalUserSearchResults] = useState<User[]>([])
  const [modalLoading, setModalLoading] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load last message for each contact
  const loadLastMessages = async (contacts: User[]) => {
    if (!user || contacts.length === 0) return
    try {
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id, brand_id, influencer_id')
        .or(
          contacts.map(contact => 
            `and(brand_id.eq.${user.id},influencer_id.eq.${contact.id}),and(brand_id.eq.${contact.id},influencer_id.eq.${user.id})`
          ).join(',')
        )

      if (conversations) {
        const conversationIds = conversations.map((c: DBConversation) => c.id)
        const { data: messages } = await supabase
          .from('messages')
          .select('*')
          .in('conversation_id', conversationIds)
          .order('created_at', { ascending: false })

        if (messages) {
          const lastMessageMap: Record<string, Message> = {}
          conversations.forEach((conv: DBConversation) => {
            const contactId = conv.brand_id === user.id ? conv.influencer_id : conv.brand_id
            const conversationMessages = messages.filter((m: Message) => m.conversation_id === conv.id)
            if (conversationMessages.length > 0) {
              lastMessageMap[contactId] = conversationMessages[0]
            }
          })
          setLastMessages(lastMessageMap)
        }
      }
    } catch (error) {
      console.error('Error loading last messages:', error)
    }
  }

  // Load contacts (users who have exchanged messages with current user)
  const loadContacts = async () => {
    if (!user) return
    try {
      const { data: messageUsers, error: messageError } = await supabase
        .from('messages')
        .select('sender_id, receiver_id')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      if (messageError) throw messageError
      const userIds = new Set<string>()
      messageUsers?.forEach((msg: MessageUser) => {
        if (msg.sender_id !== user.id) userIds.add(msg.sender_id)
        if (msg.receiver_id !== user.id) userIds.add(msg.receiver_id)
      })
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .in('id', Array.from(userIds))
      if (usersError) throw usersError
      setContacts(users || [])
      // Load last messages for all contacts
      await loadLastMessages(users || [])
    } catch {
      toast.error('Failed to load contacts')
    } finally {
      setLoading(false)
    }
  }

  // Find or create a conversation between user and contact
  const getOrCreateConversation = async (contact: User) => {
    if (!user) return null
    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('*')
      .or(`and(brand_id.eq.${user.id},influencer_id.eq.${contact.id}),and(brand_id.eq.${contact.id},influencer_id.eq.${user.id})`)
      .maybeSingle()
    if (existingConversation) return existingConversation
    const isBrand = user.role === 'brand'
    const { data: newConversation, error: createError } = await supabase
      .from('conversations')
      .insert({
        brand_id: isBrand ? user.id : contact.id,
        influencer_id: isBrand ? contact.id : user.id,
        campaign_id: null
      })
      .select('*')
      .maybeSingle()
    if (createError) throw createError
    return newConversation
  }

  // Load messages for the selected conversation
  const loadMessages = async () => {
    if (!selectedContact || !user) return
    try {
      setLoading(true)
      const { data: conversation } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(brand_id.eq.${user.id},influencer_id.eq.${selectedContact.id}),and(brand_id.eq.${selectedContact.id},influencer_id.eq.${user.id})`)
        .single()
      if (conversation) {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: true })
        if (error) throw error
        setMessages(data || [])

        // Mark messages as read when viewing
        const unreadMessages = data?.filter(
          (msg: Message) => msg.receiver_id === user.id && !msg.is_read
        ) || []
        
        if (unreadMessages.length > 0) {
          try {
            await markAsRead(conversation.id, user.id)
          } catch (markError) {
            console.error('Error marking messages as read:', markError)
          }
        }
      } else {
        setMessages([])
      }
    } catch (error) {
      console.error('Error loading messages:', error)
      toast.error('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  // Send a message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedContact || !newMessage.trim() || !user) return
    try {
      setSendingMessage(true)
      // Find or create conversation
      let conversationId = null
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(brand_id.eq.${user.id},influencer_id.eq.${selectedContact.id}),and(brand_id.eq.${selectedContact.id},influencer_id.eq.${user.id})`)
        .maybeSingle()
      if (existingConversation) {
        conversationId = existingConversation.id
      } else {
        const isBrand = user.role === 'brand'
        const { data: newConversation, error: createError } = await supabase
          .from('conversations')
          .insert({
            brand_id: isBrand ? user.id : selectedContact.id,
            influencer_id: isBrand ? selectedContact.id : user.id,
            campaign_id: null
          })
          .select('id')
          .maybeSingle()
        if (createError) throw createError
        conversationId = newConversation?.id
      }
      // Insert message
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          receiver_id: selectedContact.id,
          content: newMessage.trim(),
          campaign_id: null
        })
        .select()
        .single()
      if (error) throw error
      // Optimistically add message to UI
      setMessages(prev => prev.some(msg => msg.id === data.id) ? prev : [...prev, data])
      await createMessageNotification(
        selectedContact.id,
        user.user_metadata?.full_name || user.email,
        newMessage.trim(),
        user.id,
        selectedContact.id
      )
      setNewMessage('')
    } catch {
      toast.error('Failed to send message')
    } finally {
      setSendingMessage(false)
    }
  }

  // Real-time subscription for current conversation
  useEffect(() => {
    if (!selectedContact || !user) return
    let channel: RealtimeChannel | null = null
    let isMounted = true
    const setup = async () => {
      const { data: conversation } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(brand_id.eq.${user.id},influencer_id.eq.${selectedContact.id}),and(brand_id.eq.${selectedContact.id},influencer_id.eq.${user.id})`)
        .single()
      if (!conversation) return
      channel = supabase
        .channel('messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversation.id}`
          },
          (payload: RealtimePayload<Message>) => {
            const newMessage = payload.new
            setMessages(prev => prev.some(msg => msg.id === newMessage.id) ? prev : [...prev, newMessage])
          }
        )
        .subscribe()
    }
    setup()
    return () => {
      if (channel) supabase.removeChannel(channel)
      isMounted = false
    }
  }, [selectedContact, user])

  // Global real-time subscription for notifications and new contacts
  useEffect(() => {
    if (!user) return
    let globalChannel: RealtimeChannel | null = null
    const setupGlobalMessageListener = () => {
      globalChannel = supabase
        .channel(`user-messages-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id=eq.${user.id}`
          },
          async (payload: RealtimePayload<Message>) => {
            const newMessage = payload.new
            if (newMessage.sender_id !== user.id) {
              loadContacts()
              if (selectedContact?.id === newMessage.sender_id) {
                setMessages(prev => prev.some(msg => msg.id === newMessage.id) ? prev : [...prev, newMessage])
                
                // Immediately mark message as read if it's from the selected contact
                try {
                  const { data: conversation } = await supabase
                    .from('conversations')
                    .select('id')
                    .eq('id', newMessage.conversation_id)
                    .single()
                  
                  if (conversation) {
                    await markAsRead(conversation.id, user.id)
                  }
                } catch (error) {
                  console.error('Error marking new message as read:', error)
                }
              }
              if (!selectedContact || selectedContact.id !== newMessage.sender_id) {
                supabase
                  .from('users')
                  .select('full_name')
                  .eq('id', newMessage.sender_id)
                  .single()
                  .then(({ data: sender }: { data: { full_name: string } | null }) => {
                    if (sender) {
                      toast.success(`New message from ${sender.full_name}: ${newMessage.content.substring(0, 50)}...`)
                    }
                  })
              }
            }
          }
        )
        .subscribe()
    }
    setupGlobalMessageListener()
    return () => {
      if (globalChannel) supabase.removeChannel(globalChannel)
    }
  }, [user?.id, selectedContact?.id])

  // Load contacts on mount and when user changes
  useEffect(() => {
    if (!userLoading && user) loadContacts()
  }, [userLoading, user])

  // Load contact from URL param
  useEffect(() => {
    if (contactId && user) loadContact(contactId)
  }, [contactId, user])

  // Load messages when selectedContact changes
  useEffect(() => {
    if (selectedContact) loadMessages()
  }, [selectedContact])

  // Load a single contact by ID
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
    } catch {
      toast.error('Failed to load contact')
    }
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
      const filteredUsers = (users || []).filter((u: User) => !contacts.some(c => c.id === u.id))
      setModalUserSearchResults(filteredUsers)
    } catch {
      toast.error('Failed to search users')
    } finally {
      setModalLoading(false)
    }
  }

  // Filtered contacts based on search term
  const filteredContacts = contacts.filter(contact =>
    contact.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Handle contact selection
  const handleSelectContact = async (contact: User) => {
    setSelectedContact(contact)
    router.push(`/dashboard/messages?contact=${contact.id}`)
    await getOrCreateConversation(contact)
  }

  if (userLoading || loading || !user) {
    return (
      <div className="h-[calc(100vh-4rem)] flex bg-white">
        {/* Conversations List Loading */}
        <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50">
          <div className="p-4 border-b border-gray-200 bg-white">
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
        <div className="flex flex-1 items-center justify-center bg-gray-50">
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
    <div className="h-[calc(100vh-4rem)] flex bg-white">
      {/* Conversations List */}
      <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50">
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
            <button
              onClick={() => setShowNewConversation(true)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
              title="New conversation"
            >
              <Plus className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-lg border-0 py-2.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 transition-shadow duration-200"
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto">
          {filteredContacts.length > 0 ? (
            <ul role="list" className="divide-y divide-gray-200">
              {filteredContacts.map((contact) => {
                const lastMessage = lastMessages[contact.id];
                const unreadCount = messages.filter(
                  m => m.sender_id === contact.id && !m.is_read
                ).length;

                return (
                  <li
                    key={contact.id}
                    className={`cursor-pointer hover:bg-gray-100 transition-colors duration-200 ${
                      selectedContact?.id === contact.id ? 'bg-white shadow-sm' : ''
                    }`}
                    onClick={() => handleSelectContact(contact)}
                  >
                    <div className="flex items-center px-4 py-3">
                      <div className="flex min-w-0 flex-1 items-center">
                        <div className="relative flex-shrink-0">
                          {contact.avatar_url ? (
                            <img
                              className="h-12 w-12 rounded-full object-cover"
                              src={contact.avatar_url}
                              alt={contact.full_name}
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500">
                              <span className="text-lg font-medium text-white">
                                {contact.full_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1 px-4">
                          <div className="flex items-center justify-between">
                            <p className="truncate text-sm font-medium text-gray-900">
                              {contact.full_name}
                            </p>
                            {lastMessage && (
                              <p className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(lastMessage.created_at), { addSuffix: true })}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="truncate text-sm text-gray-500">
                              {lastMessage ? lastMessage.content : 'No messages yet'}
                            </p>
                            {unreadCount > 0 && (
                              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-indigo-600 text-xs font-medium text-white">
                                {unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">No conversations yet</h3>
              <p className="text-sm text-gray-500 mb-4">
                {searchTerm ? (
                  `No results for "${searchTerm}"`
                ) : (
                  "Start chatting with brands and influencers"
                )}
              </p>
              <button
                onClick={() => setShowNewConversation(true)}
                className="inline-flex items-center cursor-pointer px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                New Conversation
              </button>
            </div>
          )}
        </nav>
      </div>

      {/* Chat Area */}
      <div className="flex flex-1 flex-col bg-gradient-to-b from-gray-50 to-white">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center">
                  <div className="relative flex-shrink-0">
                    {selectedContact.avatar_url ? (
                      <img
                        className="h-10 w-10 rounded-full object-cover"
                        src={selectedContact.avatar_url}
                        alt={selectedContact.full_name}
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500">
                        <span className="text-lg font-medium text-white">
                          {selectedContact.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="ml-3">
                    <h2 className="text-base font-medium text-gray-900">
                      {selectedContact.full_name}
                    </h2>
             
                  </div>
                </div>
                {/* <div className="flex items-center space-x-2">
                  <button className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200">
                    <Search className="h-5 w-5 text-gray-500" />
                  </button>
                  <button className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200">
                    <MoreVertical className="h-5 w-5 text-gray-500" />
                  </button>
                </div> */}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 overflow-x-hidden mb-4">
              {messages.length > 0 ? (
                messages.map((message, index) => {
                  const isCurrentUser = message.sender_id === user?.id;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex items-end space-x-2 mr-4 ${
                        isCurrentUser ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {!isCurrentUser && (
                        <div className="flex-shrink-0">
                          {selectedContact.avatar_url ? (
                            <img
                              className="h-8 w-8 rounded-full object-cover"
                              src={selectedContact.avatar_url}
                              alt={selectedContact.full_name}
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500">
                              <span className="text-sm font-medium text-white">
                                {selectedContact.full_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      <div
                        className={`group relative max-w-md rounded-2xl px-4 py-2 ${
                          isCurrentUser
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <span className={`absolute bottom-1 ${isCurrentUser ? 'right-2' : 'left-2'} text-xs opacity-0 group-hover:opacity-75 transition-opacity duration-200`}>
                          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isCurrentUser && (
                          <span className="absolute -right-6 bottom-1">
                            {message.is_read ? (
                              <CheckCheck className="h-4 w-4 text-indigo-600" />
                            ) : message.delivered ? (
                              <Check className="h-4 w-4 text-indigo-600" />
                            ) : (
                              <Check className="h-4 w-4 text-gray-400" />
                            )}
                          </span>
                        )}
                      </div>
                      {/* {isCurrentUser && (
                        <div className="flex-shrink-0">
                          {user.avatar_url ? (
                            <img
                              className="h-8 w-8 rounded-full object-cover"
                              src={user.avatar_url}
                              alt={user.email}
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500">
                              <span className="text-sm font-medium text-white">
                                {user?.email?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                      )} */}
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 py-12">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
                    <Send className="h-8 w-8 text-gray-400" />
                  </div>
                  {/* <h3 className="text-lg font-medium text-gray-900 mb-1">No messages yet</h3> */}
                  <p className="text-sm text-gray-500">
                    Send a message to start the conversation
                  </p>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-200 bg-white p-4">
              <form onSubmit={sendMessage} className="flex items-center space-x-4">
                <button
                  type="button"
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                >
                  <Paperclip className="h-5 w-5 text-gray-500" />
                </button>
                <button
                  type="button"
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                >
                  <Image className="h-5 w-5 text-gray-500" />
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="block w-full rounded-full border-0 py-3 pl-4 pr-12 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
                  >
                    <Smile className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sendingMessage}
                  className="inline-flex items-center rounded-full bg-indigo-600 p-3 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {sendingMessage ? (
                    <ButtonLoader />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center px-6 py-10">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 mx-auto mb-6">
                <Send className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Your Messages</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-sm">
                Connect with brands and influencers. Select a conversation to start messaging.
              </p>
              <button
                onClick={() => setShowNewConversation(true)}
                className="inline-flex items-center px-4 py-2 border cursor-pointer border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
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