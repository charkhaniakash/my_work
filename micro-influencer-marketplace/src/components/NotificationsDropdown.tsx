'use client'

import { useState, useEffect, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useSupabase } from '@/lib/providers/supabase-provider'
import { Bell, Check, X, AlertCircle, MessageSquare, FileText, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getNotificationPreferences } from '@/lib/services/notification-preferences-service'

type Notification = {
  id: string
  title: string
  content: string
  type: string
  link: string | null
  is_read: boolean
  created_at: string
  related_id: string | null
  related_type: string | null
}

export default function NotificationsDropdown() {
  const { user } = useSupabase()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load user preferences
  useEffect(() => {
    if (!user) return
    
    const loadPreferences = async () => {
      try {
        const preferences = await getNotificationPreferences(user.id)
        setSoundEnabled(preferences.sound_enabled)
      } catch (error) {
        console.error('Error loading sound preferences:', error)
      }
    }
    
    loadPreferences()
    
    // Set up a listener for preference changes
    const prefChannel = supabase
      .channel('prefs-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notification_preferences',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          // Update sound preference if it changed
          if (payload.new && typeof payload.new.sound_enabled === 'boolean') {
            setSoundEnabled(payload.new.sound_enabled)
          }
        }
      )
      .subscribe()
      
    return () => {
      supabase.removeChannel(prefChannel)
    }
  }, [user])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Load notifications
  useEffect(() => {
    if (!user) return
    
    loadNotifications()
    
    // Set up real-time notifications
    const channel = supabase
      .channel('notification-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          const newNotification = payload.new as Notification
          setNotifications(prev => [newNotification, ...prev])
          setUnreadCount(prev => prev + 1)
          
          // Check current sound preference before playing sound
          try {
            // Get the latest sound preference just to be sure
            const prefs = await getNotificationPreferences(user.id)
            
            // Play notification sound if enabled
            if (prefs.sound_enabled) {
              const audio = new Audio('/sounds/notification.mp3')
              audio.volume = 0.5
              try {
                audio.play()
              } catch (error) {
                console.error('Failed to play notification sound:', error)
              }
            }
          } catch (error) {
            console.error('Failed to check sound preferences:', error)
          }
        }
      )
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const loadNotifications = async () => {
    if (!user) return
    
    setLoading(true)
    
    try {
      // Get notifications
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)
      
      if (error) throw error
      
      setNotifications(data || [])
      
      // Count unread notifications
      const unread = data?.filter(n => !n.is_read).length || 0
      setUnreadCount(unread)
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
      
      if (error) throw error
      
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      ))
      
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    if (!user || notifications.length === 0) return
    
    try {
      const { error } = await supabase.rpc('mark_all_notifications_read', {
        user_uuid: user.id
      })
      
      if (error) throw error
      
      setNotifications(notifications.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      markAsRead(notification.id)
    }
    
    // Navigate if there's a link
    if (notification.link) {
      console.log("Notification link:", notification)
      router.push(notification.link)
    }
    
    // Close dropdown
    setIsOpen(false)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-5 w-5 text-blue-500" />
      case 'application':
        return <FileText className="h-5 w-5 text-green-500" />
      case 'user':
        return <User className="h-5 w-5 text-purple-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      return `${Math.floor(diffInHours * 60)} min ago`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  console.log("Notifications" , notifications)

  if (!user) return null

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="relative p-2 text-gray-600 rounded-full hover:bg-gray-100 focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50">
          <div className="py-2 border-b flex justify-between items-center px-4">
            <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              </div>
            ) : notifications.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${!notification.is_read ? 'bg-blue-50' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex">
                      <div className="flex-shrink-0 mr-3">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {notification.content}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTime(notification.created_at)}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="ml-2 bg-gray-200 p-1 rounded-full hover:bg-gray-300"
                        >
                          <Check className="h-4 w-4 text-gray-600" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center">
                <p className="text-gray-500 text-sm">No notifications yet</p>
              </div>
            )}
          </div>
          
          <div className="py-2 border-t px-4">
            <button
              onClick={() => router.push('/dashboard/notifications')}
              className="block w-full text-left text-sm text-indigo-600 hover:text-indigo-800 font-medium p-2"
            >
              View All Notifications
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="block w-full text-center text-xs text-gray-500 hover:text-gray-700 p-1 mt-2"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 