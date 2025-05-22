'use client'

import React, { useEffect } from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  FileText, 
  BarChart, 
  Settings,
  Menu,
  X,
  LogOut
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import NotificationsDropdown from '@/components/NotificationsDropdown'
import { AuthProvider } from '@/lib/auth-context'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
  { name: 'Campaigns', href: '/dashboard/campaigns', icon: FileText },
  { name: 'Discover', href: '/dashboard/discover', icon: Users },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch (error) {
        console.error('Error getting user:', error)
      } finally {
        setIsLoading(false)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/auth/sign-in')
      toast.success('Logged out successfully')
    } catch (error) {
      console.error('Error logging out:', error)
      toast.error('Failed to log out')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar */}
      <div className="lg:hidden">
        <button
          className="fixed top-4 left-4 p-2 bg-white rounded-md shadow-md"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)}>
            <div className="fixed inset-y-0 left-0 w-64 bg-white" onClick={e => e.stopPropagation()}>
              <SidebarContent 
                pathname={pathname} 
                onLogout={handleLogout} 
                user={user}
                isLoading={isLoading}
              />
            </div>
          </div>
        )}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
          <SidebarContent 
            pathname={pathname} 
            onLogout={handleLogout}
            user={user}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Header with notifications */}
        <header className="sticky top-0 z-10 flex h-16 flex-shrink-0 items-center bg-white shadow-sm">
          <div className="flex flex-1 justify-between px-4 sm:px-6 lg:px-8">
            <div></div> {/* Empty div for layout balance */}
            <div className="flex items-center space-x-4">
              <NotificationsDropdown />
              <div className="lg:hidden flex items-center">
                <span className="text-sm font-medium text-gray-700">
                  {user?.full_name || user?.email || 'User'}
                </span>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8">
          <AuthProvider>
            {children}
          </AuthProvider>
        </main>
      </div>
    </div>
  )
}

function SidebarContent({ 
  pathname, 
  onLogout,
  user,
  isLoading
}: { 
  pathname: string
  onLogout: () => Promise<void>
  user: any
  isLoading: boolean
}) {
  return (
    <>
      <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
        <div className="flex flex-shrink-0 items-center px-4">
          <h1 className="text-xl font-bold">Micro-Influencer</h1>
        </div>
        <nav className="mt-5 flex-1 space-y-1 px-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon
                  className={`mr-3 h-6 w-6 flex-shrink-0 ${
                    isActive ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="flex flex-shrink-0 border-t border-gray-200 p-4">
        {isLoading ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-indigo-600"></div>
          </div>
        ) : user ? (
          <div className="group block w-full flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div>
                  <img
                    className="inline-block h-9 w-9 rounded-full"
                    src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                    alt={user.full_name || user.email}
                  />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    {user.full_name || user.email}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user.user_metadata?.role || 'User'}
                  </p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-2 text-gray-400 hover:text-gray-500"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        ) : (
          <Link
            href="/auth/sign-in"
            className="group block w-full flex-shrink-0"
          >
            <div className="flex items-center">
              <div>
                <img
                  className="inline-block h-9 w-9 rounded-full"
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Guest"
                  alt="Guest"
                />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                  Sign In
                </p>
              </div>
            </div>
          </Link>
        )}
      </div>
    </>
  )
} 