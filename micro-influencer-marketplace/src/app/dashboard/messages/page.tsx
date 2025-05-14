'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Conversation, Message, User } from '@/lib/types/database'
import { toast } from 'react-hot-toast'
import { Send, Clock, Search, Check, CheckCheck, Paperclip, Download, X } from 'lucide-react'
import Image from 'next/image'
import { debounce } from 'lodash'
import { useTypingIndicator } from '@/lib/hooks/useTypingIndicator'
import { useMessageAttachments } from '@/lib/hooks/useMessageAttachments'
import { formatFileSize } from '@/lib/utils'

export default function Messages() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClientComponentClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { uploading, uploadAttachment, downloadAttachment, ALLOWED_FILE_TYPES, MAX_FILE_SIZE } =
    useMessageAttachments()
  const { typingUsers, updateTypingStatus, removeTypingStatus } = useTypingIndicator(
    selectedConversation?.id || '',
    user?.id || ''
  )

  useEffect(() => {
    loadConversations()
    // Subscribe to new messages
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user?.id}`
        },
        (payload) => {
          const newMessage = payload.new as Message
          if (newMessage.conversation_id === selectedConversation?.id) {
            setMessages((prev) => [...prev, newMessage])
          }
          loadConversations() // Refresh conversation list to update last message
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, selectedConversation?.id])

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id)
    }
  }, [selectedConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations)
      return
    }

    const searchConversations = async () => {
      setIsSearching(true)
      try {
        // Search in messages
        const { data: messageResults, error: messageError } = await supabase
          .from('messages')
          .select('conversation_id')
          .textSearch('content', searchQuery)
          .limit(20)

        if (messageError) throw messageError

        const conversationIds = new Set([
          ...messageResults.map((msg) => msg.conversation_id)
        ])

        // Filter conversations that match the search query
        const filtered = conversations.filter(
          (conv) =>
            conversationIds.has(conv.id) ||
            conv.brand?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            conv.influencer?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            conv.campaign?.title?.toLowerCase().includes(searchQuery.toLowerCase())
        )

        setFilteredConversations(filtered)
      } catch (error) {
        console.error('Error searching messages:', error)
        toast.error('Failed to search messages')
      } finally {
        setIsSearching(false)
      }
    }

    const debouncedSearch = debounce(searchConversations, 300)
    debouncedSearch()

    return () => {
      debouncedSearch.cancel()
    }
  }, [searchQuery, conversations])

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          brand:brand_id(*),
          influencer:influencer_id(*),
          campaign:campaign_id(*),
          last_message:messages(*)
        `)
        .or(`brand_id.eq.${user?.id},influencer_id.eq.${user?.id}`)
        .order('last_message_at', { ascending: false })

      if (error) throw error

      setConversations(data || [])

      // Load unread counts for each conversation
      const counts: Record<string, number> = {}
      for (const conv of data || []) {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .eq('receiver_id', user?.id)
          .eq('is_read', false)

        counts[conv.id] = count || 0
      }
      setUnreadCounts(counts)
    } catch (error) {
      toast.error('Failed to load conversations')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          attachments:message_attachments(*)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error

      setMessages(data || [])
      // Mark messages as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('receiver_id', user?.id)
    } catch (error) {
      toast.error('Failed to load messages')
      console.error('Error:', error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !selectedConversation || !newMessage.trim()) return

    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: selectedConversation.id,
        sender_id: user.id,
        receiver_id:
          selectedConversation.brand_id === user.id
            ? selectedConversation.influencer_id
            : selectedConversation.brand_id,
        content: newMessage.trim(),
        campaign_id: selectedConversation.campaign_id
      })

      if (error) throw error

      setNewMessage('')
    } catch (error) {
      toast.error('Failed to send message')
      console.error('Error:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString()
  }

  // Add typing indicator update on message input
  const handleMessageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)
    updateTypingStatus()
  }

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length || !selectedConversation) return

    try {
      // First create the message
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: user!.id,
          receiver_id:
            selectedConversation.brand_id === user!.id
              ? selectedConversation.influencer_id
              : selectedConversation.brand_id,
          content: `Shared ${files.length} file${files.length > 1 ? 's' : ''}`,
          campaign_id: selectedConversation.campaign_id
        })
        .select()
        .single()

      if (messageError) throw messageError

      // Upload each file
      for (const file of files) {
        await uploadAttachment(file, message.id)
      }

      toast.success('Files uploaded successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload files')
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const deleteMessage = async (messageId: string) => {
    try {
      setDeletingMessageId(messageId)
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', user?.id) // Ensure only sender can delete

      if (error) throw error

      // Update messages list
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId))
      toast.success('Message deleted')
    } catch (error) {
      console.error('Error deleting message:', error)
      toast.error('Failed to delete message')
    } finally {
      setDeletingMessageId(null)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Conversations List */}
      <div className="w-1/3 border-r border-gray-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Messages</h2>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
        </div>
        <div className="divide-y divide-gray-200 overflow-y-auto flex-1">
          {isSearching ? (
            <div className="p-4 text-center text-gray-500">Searching...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No conversations found</div>
          ) : (
            filteredConversations.map((conversation) => {
              const otherUser =
                conversation.brand_id === user?.id
                  ? conversation.influencer
                  : conversation.brand
              const unreadCount = unreadCounts[conversation.id] || 0
              return (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`w-full p-4 text-left hover:bg-gray-50 ${
                    selectedConversation?.id === conversation.id
                      ? 'bg-indigo-50'
                      : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {otherUser?.avatar_url ? (
                        <Image
                          src={otherUser.avatar_url}
                          alt={otherUser.full_name}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-indigo-800 font-medium">
                            {otherUser?.full_name?.[0]}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {otherUser?.full_name}
                        </p>
                        {unreadCount > 0 && (
                          <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-indigo-600 rounded-full">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {conversation.campaign?.title}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-xs text-gray-500">
                      <Clock className="inline-block w-3 h-3 mr-1" />
                      {formatDate(conversation.last_message_at)}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedConversation.brand_id === user?.id
                    ? selectedConversation.influencer?.full_name
                    : selectedConversation.brand?.full_name}
                </h2>
                {selectedConversation.campaign && (
                  <span className="text-sm text-gray-500">
                    • {selectedConversation.campaign.title}
                  </span>
                )}
              </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 group relative ${
                      message.sender_id === user?.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    
                    {/* Attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {message.attachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="flex items-center gap-2 p-2 rounded bg-opacity-10 bg-white"
                          >
                            <Paperclip className="h-4 w-4" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate">{attachment.file_name}</p>
                              <p className="text-xs opacity-75">
                                {formatFileSize(attachment.file_size)}
                              </p>
                            </div>
                            <button
                              onClick={() => downloadAttachment(attachment)}
                              className="p-1 hover:bg-white hover:bg-opacity-10 rounded"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Message Actions */}
                    {message.sender_id === user?.id && (
                      <div className="absolute right-0 top-0 -mt-2 -mr-2 hidden group-hover:flex">
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this message?')) {
                              deleteMessage(message.id)
                            }
                          }}
                          disabled={deletingMessageId === message.id}
                          className="p-1 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-lg"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span
                        className={`text-xs ${
                          message.sender_id === user?.id
                            ? 'text-indigo-200'
                            : 'text-gray-500'
                        }`}
                      >
                        {formatDate(message.created_at)}
                      </span>
                      {message.sender_id === user?.id && (
                        <span className="ml-1">
                          {message.is_read ? (
                            <CheckCheck className="h-4 w-4 text-indigo-200" />
                          ) : (
                            <Check className="h-4 w-4 text-indigo-200" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Typing Indicator */}
              {typingUsers.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    {typingUsers.map((typingUser) => (
                      <span key={typingUser.id} className="font-medium">
                        {typingUser.full_name}
                      </span>
                    ))}
                  </div>
                  <span>
                    {typingUsers.length === 1 ? 'is' : 'are'} typing
                    <span className="animate-pulse">...</span>
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              <form onSubmit={sendMessage} className="flex items-center gap-4">
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleMessageInput}
                  onBlur={removeTypingStatus}
                  placeholder="Type your message..."
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                
                {/* File Upload */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                  accept={ALLOWED_FILE_TYPES.join(',')}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                  disabled={uploading}
                >
                  <Paperclip className="h-5 w-5" />
                </button>

                <button
                  type="submit"
                  disabled={!newMessage.trim() || uploading}
                  className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  )
} 