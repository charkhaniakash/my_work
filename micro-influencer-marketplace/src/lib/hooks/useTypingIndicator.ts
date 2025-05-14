import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { TypingUser, User } from '../types/database'
import debounce from 'lodash/debounce'

export function useTypingIndicator(conversationId: string, currentUserId: string) {
  const [typingUsers, setTypingUsers] = useState<User[]>([])
  const supabase = createClientComponentClient()

  // Update typing status
  const updateTypingStatus = useCallback(
    debounce(async () => {
      if (!conversationId || !currentUserId) return

      try {
        const { error } = await supabase
          .from('typing_users')
          .upsert(
            {
              conversation_id: conversationId,
              user_id: currentUserId,
              last_typed: new Date().toISOString()
            },
            { onConflict: 'conversation_id,user_id' }
          )

        if (error) throw error
      } catch (error) {
        console.error('Error updating typing status:', error)
      }
    }, 500),
    [conversationId, currentUserId]
  )

  // Remove typing status
  const removeTypingStatus = useCallback(async () => {
    if (!conversationId || !currentUserId) return

    try {
      const { error } = await supabase
        .from('typing_users')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUserId)

      if (error) throw error
    } catch (error) {
      console.error('Error removing typing status:', error)
    }
  }, [conversationId, currentUserId])

  // Subscribe to typing status changes
  useEffect(() => {
    if (!conversationId) return

    const channel = supabase
      .channel(`typing:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_users',
          filter: `conversation_id=eq.${conversationId}`
        },
        async () => {
          // Fetch current typing users
          const { data: typingData, error: typingError } = await supabase
            .from('typing_users')
            .select('user_id')
            .eq('conversation_id', conversationId)
            .neq('user_id', currentUserId)

          if (typingError) {
            console.error('Error fetching typing users:', typingError)
            return
          }

          if (!typingData?.length) {
            setTypingUsers([])
            return
          }

          // Fetch user details for typing users
          const { data: users, error: usersError } = await supabase
            .from('users')
            .select('*')
            .in(
              'id',
              typingData.map((t) => t.user_id)
            )

          if (usersError) {
            console.error('Error fetching typing user details:', usersError)
            return
          }

          setTypingUsers(users || [])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      removeTypingStatus()
    }
  }, [conversationId, currentUserId])

  return {
    typingUsers,
    updateTypingStatus,
    removeTypingStatus
  }
} 