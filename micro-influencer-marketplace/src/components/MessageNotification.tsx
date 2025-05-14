'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'react-hot-toast'
import { Message, User } from '@/lib/types/database'
import { useRouter } from 'next/navigation'

export default function MessageNotification() {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Create audio element for notification sound
    audioRef.current = new Audio('/sounds/notification.mp3')
    audioRef.current.volume = 0.5
  }, [])

  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel('message-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        async (payload) => {
          const newMessage = payload.new as Message
          
          // Play notification sound
          if (audioRef.current) {
            try {
              await audioRef.current.play()
            } catch (error) {
              console.error('Failed to play notification sound:', error)
            }
          }

          // Fetch sender details
          const { data: sender } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', newMessage.sender_id)
            .single()

          if (sender) {
            toast(
              (t) => (
                <div
                  className="cursor-pointer"
                  onClick={() => {
                    router.push('/dashboard/messages')
                    toast.dismiss(t.id)
                  }}
                >
                  <p className="font-medium">{sender.full_name}</p>
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {newMessage.content}
                  </p>
                </div>
              ),
              {
                duration: 5000,
                icon: '💬'
              }
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  return null
} 