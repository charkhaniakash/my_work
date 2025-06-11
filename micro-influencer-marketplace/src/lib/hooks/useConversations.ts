import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Conversation, Message } from '../types/database'
import { toast } from 'react-hot-toast'

export function useConversations() {
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)

  const getOrCreateConversation = async (
    brandId: string,
    influencerId: string,
    campaignId?: string
  ) => {
    try {
      // First, try to find an existing conversation
      const { data: existingConversation, error: findError } = await supabase
        .from('conversations')
        .select('*')
        .eq('brand_id', brandId)
        .eq('influencer_id', influencerId)
        .eq('campaign_id', campaignId || null)
        .single()

      if (findError && findError.code !== 'PGRST116') {
        throw findError
      }

      if (existingConversation) {
        return existingConversation
      }

      // If no conversation exists, create a new one
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          brand_id: brandId,
          influencer_id: influencerId,
          campaign_id: campaignId || null
        })
        .select()
        .single()

      if (createError) throw createError

      return newConversation
    } catch (error) {
      console.error('Error in getOrCreateConversation:', error)
      throw error
    }
  }

  const sendMessage = async (
    conversationId: string,
    senderId: string,
    receiverId: string,
    content: string,
    campaignId?: string
  ) => {
    try {
      setLoading(true)
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: senderId,
        receiver_id: receiverId,
        content: content.trim(),
        campaign_id: campaignId || null
      })

      if (error) throw error
    } catch (error) {
      console.error('Error in sendMessage:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (conversationId: string, userId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('receiver_id', userId)
        .eq('is_read', false)
        .select()

      if (error) throw error
      
      return data
    } catch (error) {
      console.error('Error in markAsRead:', error)
      throw error
    }
  }

  const getUnreadCount = async (userId: string) => {
    try {
      const { data, error, count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .eq('is_read', false)

      if (error) throw error

      return count || 0
    } catch (error) {
      console.error('Error in getUnreadCount:', error)
      return 0 // Return 0 on error instead of throwing
    }
  }

  return {
    loading,
    getOrCreateConversation,
    sendMessage,
    markAsRead,
    getUnreadCount
  }
} 