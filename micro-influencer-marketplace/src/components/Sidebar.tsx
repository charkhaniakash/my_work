import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import {
  HomeIcon,
  BriefcaseIcon,
  UserIcon,
  ClipboardIcon,
  PlusCircleIcon,
  InboxIcon,
  ChatBubbleLeftRightIcon,
  BellIcon,
  CreditCardIcon,
  BanknotesIcon,
  ChartBarIcon,
  EnvelopeIcon,
  CogIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useConversations } from '@/lib/hooks/useConversations'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useSupabase } from '@/lib/providers/supabase-provider'

export default function Sidebar() {
  const pathname = usePathname()
  const { getUnreadCount } = useConversations()
  const [unreadCount, setUnreadCount] = useState(0)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const supabase = createClientComponentClient()
  const { user } = useSupabase()

  // Helper function to check user role safely
  const hasRole = (roleToCheck: string): boolean => {
    if (!user) return false;
    return user?.role === roleToCheck || user?.user_metadata?.role === roleToCheck;
  };

  // Subscribe to notifications and load counts when user changes
  useEffect(() => {
    if (user?.id) {
      loadUnreadCount()
      loadUnreadNotifications()

      // Subscribe to new notifications
      const channel = supabase
        .channel('sidebar-notification-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id} AND is_read=eq.false`
          },
          () => {
            loadUnreadNotifications()
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            loadUnreadNotifications()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [user?.id])

  // Subscribe to message changes
  useEffect(() => {
    if (!user?.id) return
    
    // Subscribe to message updates (when messages are marked as read)
    const channel = supabase
      .channel('sidebar-message-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        () => {
          loadUnreadCount()
        }
      )
      // Also listen for new messages
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        () => {
          console.log('New message detected, refreshing unread count')
          loadUnreadCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  // Refresh counts at regular intervals
  useEffect(() => {
    if (!user?.id) return
    
    // Initial load
    loadUnreadCount()
    
    // Set up refresh interval (every 30 seconds)
    const interval = setInterval(() => {
      loadUnreadCount()
    }, 30000)
    
    return () => {
      clearInterval(interval)
    }
  }, [user?.id])

  // Refresh counts when on messages page
  useEffect(() => {
    if (pathname && pathname.startsWith('/dashboard/messages') && user?.id) {
      loadUnreadCount()
    }
  }, [pathname, user?.id])

  const loadUnreadCount = async () => {
    if (!user?.id) return
    try {
      const count = await getUnreadCount(user.id)
      setUnreadCount(count)
    } catch (error) {
      console.error('Error loading unread count:', error)
    }
  }

  const loadUnreadNotifications = async () => {
    if (!user?.id) return

    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) throw error

      setUnreadNotifications(count || 0)
    } catch (error) {
      console.error('Error loading unread notifications count:', error)
    }
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    ...(hasRole('brand')
      ? [
        {
          name: 'My Campaigns',
          href: '/dashboard/campaigns',
          icon: BriefcaseIcon
        },
        {
          name: 'Invitations',
          href: '/dashboard/invitations',
          icon: BriefcaseIcon
        },
        {
          name: 'Analytics',
          href: '/dashboard/analytics',
          icon: ChartBarIcon
        }
      ]
      : [
        {
          name: 'Available Campaigns',
          href: '/dashboard/available-campaigns',
          icon: BriefcaseIcon
        },
        {
          name: 'My Applications',
          href: '/dashboard/applications',
          icon: ClipboardIcon
        },
        {
          name: 'View Invitations',
          href: '/dashboard/influencer/invitations',
          icon: EnvelopeIcon
        }
      ]),
    {
      name: 'Messages',
      href: '/dashboard/messages',
      icon: ChatBubbleLeftRightIcon,
      badge: unreadCount > 0 ? unreadCount : undefined
    },
    {
      name: 'Notifications',
      href: '/dashboard/notifications',
      icon: BellIcon,
      badge: unreadNotifications > 0 ? unreadNotifications : undefined
    },
    { name: 'Profile', href: '/dashboard/profile', icon: UserIcon },
    // Role-specific payment features
    ...(hasRole('influencer')
      ? [{
        name: 'My Earnings',
        href: '/dashboard/earnings',
        icon: ChartBarIcon
      }]
      : [{
        name: 'Transactions',
        href: '/dashboard/transactions',
        icon: BanknotesIcon
      }]),
    { name: 'Settings', href: '/dashboard/settings', icon: CogIcon },
  ]

  return (
    <nav className="flex flex-col h-full">
      <div className="flex-1 px-4 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`${isActive
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } group flex items-center px-2 py-2 text-sm font-medium rounded-md relative`}
            >
              <item.icon
                className={`${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'
                  } mr-3 flex-shrink-0 h-6 w-6`}
                aria-hidden="true"
              />
              {item.name}
              {item.badge && (
                <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
} 