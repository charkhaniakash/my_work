'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  FileText, 
  BarChart, 
  Settings,
  Menu,
  X
} from 'lucide-react'

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
  const pathname = usePathname()

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
              <SidebarContent pathname={pathname} />
            </div>
          </div>
        )}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
          <SidebarContent pathname={pathname} />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}

function SidebarContent({ pathname }: { pathname: string }) {
  return (
    <>
      <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
        <div className="flex flex-shrink-0 items-center px-4">
          <h1 className="text-xl font-bold">Micro-Influencer</h1>
        </div>
        <nav className="mt-5 flex-1 space-y-1 bg-white px-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  group flex items-center px-2 py-2 text-sm font-medium rounded-md
                  ${isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                `}
              >
                <item.icon
                  className={`
                    mr-3 h-6 w-6 flex-shrink-0
                    ${isActive ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500'}
                  `}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="flex flex-shrink-0 border-t border-gray-200 p-4">
        <Link
          href="/auth/sign-in"
          className="group block w-full flex-shrink-0"
        >
          <div className="flex items-center">
            <div>
              <img
                className="inline-block h-9 w-9 rounded-full"
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                alt=""
              />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                Sign In
              </p>
            </div>
          </div>
        </Link>
      </div>
    </>
  )
} 