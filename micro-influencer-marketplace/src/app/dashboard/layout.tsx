'use client'

import React, { useEffect } from 'react'
import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { 
  Menu,
  X,
  LogOut
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import NotificationsDropdown from '@/components/NotificationsDropdown'
import { AuthProvider } from '@/lib/auth-context'
import Sidebar from '@/components/Sidebar'
import { NavigationLoader } from '@/components/loaders'
import { useSessionExpiry } from '@/lib/use-session-expiry'

// Function to trigger campaign activation
async function triggerCampaignActivation() {
  try {
    const response = await fetch('/api/campaigns/activate', {
      method: 'POST'
    });
    
    if (!response.ok) {
      console.error('Failed to activate campaigns:', await response.text());
      return;
    }
    
    const result = await response.json();
    if (result.activatedCount > 0) {
      console.log(`Activated ${result.activatedCount} scheduled campaigns`);
    }
  } catch (error) {
    console.error('Error activating scheduled campaigns:', error);
  }
}

// Function to trigger campaign expiration
async function triggerCampaignExpiration() {
  try {
    const response = await fetch('/api/campaigns/expire', {
      method: 'POST'
    });
    
    if (!response.ok) {
      console.error('Failed to expire campaigns:', await response.text());
      return;
    }
    
    const result = await response.json();
    if (result.expiredCount > 0) {
      console.log(`Expired ${result.expiredCount} campaigns`);
    }
  } catch (error) {
    console.error('Error expiring campaigns:', error);
  }
}

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

  // Add session expiry check
  useSessionExpiry();

  // Effect to run campaign management jobs
  useEffect(() => {
    // Run campaign activation and expiration jobs
    triggerCampaignActivation();
    triggerCampaignExpiration();
    
    // Set up interval to run jobs periodically (every hour)
    const jobInterval = setInterval(() => {
      triggerCampaignActivation();
      triggerCampaignExpiration();
    }, 60 * 60 * 1000); // 1 hour
    
    return () => clearInterval(jobInterval);
  }, []);

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
      <NavigationLoader />
      {/* Mobile sidebar */}
      <div className="lg:hidden">
        <button
          className="fixed top-4 left-4 p-2 bg-white rounded-md shadow-md z-50"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)}>
            <div className="fixed inset-y-0 left-0 w-64 bg-white" onClick={e => e.stopPropagation()}>
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex flex-shrink-0 items-center px-4 py-5 border-b border-gray-200">
                  <h1 className="text-xl font-bold">Micro-Influencer</h1>
                </div>
                
                {/* Sidebar Content */}
                <div className="flex-1 overflow-y-auto">
                  <Sidebar />
                </div>
                
                {/* User Profile Section */}
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
                          onClick={handleLogout}
                          className="p-2 text-gray-400 hover:text-gray-500"
                          title="Logout"
                        >
                          <LogOut className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">
                      <p>Please sign in</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
          {/* Header */}
          <div className="flex flex-shrink-0 items-center px-4 py-5 border-b border-gray-200">
            <h1 className="text-xl font-bold">Micro-Influencer</h1>
          </div>
          
          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto">
            <Sidebar />
          </div>
          
          {/* User Profile Section */}
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
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-gray-500"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <p>Please sign in</p>
              </div>
            )}
          </div>
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