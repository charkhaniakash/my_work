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
  BanknotesIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useConversations } from '@/lib/hooks/useConversations'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function Sidebar() {
  const { user } = useAuth()
  const pathname = usePathname()
  const { getUnreadCount } = useConversations()
  const [unreadCount, setUnreadCount] = useState(0)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const supabase = createClientComponentClient()

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

  const loadUnreadCount = async () => {
    try {
      const count = await getUnreadCount(user!.id)
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
    ...(user?.role === 'brand'
      ? [
          {
            name: 'My Campaigns',
            href: '/dashboard/campaigns',
            icon: BriefcaseIcon
          },
          {
            name: 'Create Campaign',
            href: '/dashboard/campaigns/create',
            icon: PlusCircleIcon
          },
          {
            name: 'Applications',
            href: '/dashboard/applications',
            icon: InboxIcon
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
            href: '/dashboard/my-applications',
            icon: ClipboardIcon
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
    // Payment related links
    {
      name: 'Payment Methods',
      href: '/dashboard/settings/payment-methods',
      icon: CreditCardIcon
    },
    {
      name: 'Transactions',
      href: '/dashboard/transactions',
      icon: BanknotesIcon
    }
  ]

  return (
    <nav className="flex flex-col h-full bg-white border-r border-gray-200">
      <div className="flex-1 px-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`${
                isActive
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              } group flex items-center px-2 py-2 text-sm font-medium rounded-md relative`}
            >
              <item.icon
                className={`${
                  isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'
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