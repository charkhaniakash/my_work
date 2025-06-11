'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useSupabase } from '@/lib/providers/supabase-provider'
import { Bell, Check, Trash2, Filter, Calendar, MessageSquare, FileText, User, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { NotificationSkeleton, TableRowSkeleton } from '@/components/loaders'

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

type FilterState = {
  type: 'all' | 'campaign' | 'application' | 'message' | 'system'
  read: 'all' | 'read' | 'unread'
}

export default function NotificationCenter() {
  const { user } = useSupabase()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [allSelected, setAllSelected] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    type: 'all',
    read: 'all'
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)
  
  const PAGE_SIZE = 10
  
  useEffect(() => {
    if (!user) return
    
    loadNotifications()
    
    // Set up real-time subscription for new notifications
    const channel = supabase
      .channel('notification-center-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Just trigger a refresh without playing sound
          setRefreshKey(prev => prev + 1)
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
          // Just trigger a refresh
          setRefreshKey(prev => prev + 1)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Just trigger a refresh
          setRefreshKey(prev => prev + 1)
        }
      )
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, currentPage, filters, refreshKey])
  
  const loadNotifications = async () => {
    if (!user) return
    
    setLoading(true)
    
    try {
      // Build query with filters
      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      // Apply type filter
      if (filters.type !== 'all') {
        query = query.eq('type', filters.type)
      }
      
      // Apply read status filter
      if (filters.read === 'read') {
        query = query.eq('is_read', true)
      } else if (filters.read === 'unread') {
        query = query.eq('is_read', false)
      }
      
      // Apply pagination
      const from = (currentPage - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      
      // Execute the query
      const { data, error, count } = await query
        .range(from, to)
      
      if (error) throw error
      
      setNotifications(data || [])
      setTotalCount(count || 0)
      setTotalPages(Math.ceil((count || 0) / PAGE_SIZE))
      setAllSelected(false)
      setSelectedIds([])
    } catch (error) {
      console.error('Error loading notifications:', error)
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }
  
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }
  
  const handleNotificationClick = (notification: Notification) => {
    console.log('Notification clicked:', notification)
    // Mark as read if not already
    if (!notification.is_read) {
      markAsRead([notification.id])
    }
    
    // Navigate if there's a link
    if (notification.link) {
      console.log(`Navigating to ${notification.link}`)
      router.push(notification.link)
    }
  }
  
  const markAsRead = async (ids: string[]) => {
    if (!user || ids.length === 0) return
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', ids)
      
      if (error) throw error
      
      // Update local state
      setNotifications(prev => prev.map(n => 
        ids.includes(n.id) ? { ...n, is_read: true } : n
      ))
      
      if (ids.length === 1) {
        toast.success('Notification marked as read')
      } else {
        toast.success(`${ids.length} notifications marked as read`)
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error)
      toast.error('Failed to update notifications')
    }
  }
  
  const markAllAsRead = async () => {
    if (!user) return
    
    try {
      // If we have filters, only mark filtered notifications as read
      let query = supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
      
      if (filters.type !== 'all') {
        query = query.eq('type', filters.type)
      }
      
      const { error } = await query
      
      if (error) throw error
      
      toast.success('All notifications marked as read')
      setRefreshKey(prev => prev + 1) // Refresh the list
    } catch (error) {
      console.error('Error marking all as read:', error)
      toast.error('Failed to update notifications')
    }
  }
  
  const deleteNotifications = async (ids: string[]) => {
    if (!user || ids.length === 0) return
    
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .in('id', ids)
      
      if (error) throw error
      
      // Update local state
      setNotifications(prev => prev.filter(n => !ids.includes(n.id)))
      setSelectedIds([])
      
      if (ids.length === 1) {
        toast.success('Notification deleted')
      } else {
        toast.success(`${ids.length} notifications deleted`)
      }
    } catch (error) {
      console.error('Error deleting notifications:', error)
      toast.error('Failed to delete notifications')
    }
  }
  
  const clearAllNotifications = async () => {
    if (!user) return
    
    if (!window.confirm('Are you sure you want to delete all notifications? This cannot be undone.')) {
      return
    }
    
    try {
      // If we have filters, only delete filtered notifications
      let query = supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
      
      if (filters.type !== 'all') {
        query = query.eq('type', filters.type)
      }
      
      if (filters.read !== 'all') {
        query = query.eq('is_read', filters.read === 'read')
      }
      
      const { error } = await query
      
      if (error) throw error
      
      toast.success('Notifications cleared')
      setRefreshKey(prev => prev + 1) // Refresh the list
    } catch (error) {
      console.error('Error clearing notifications:', error)
      toast.error('Failed to clear notifications')
    }
  }
  
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([])
      setAllSelected(false)
    } else {
      setSelectedIds(notifications.map(n => n.id))
      setAllSelected(true)
    }
  }
  
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-5 w-5 text-blue-500" />
      case 'application':
        return <FileText className="h-5 w-5 text-green-500" />
      case 'campaign':
        return <Calendar className="h-5 w-5 text-indigo-500" />
      case 'user':
        return <User className="h-5 w-5 text-purple-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
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
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString()
    }
  }
  
  if (!user) {
    return <div>Please log in to view notifications</div>
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Notifications
          </h2>
          <p className="mt-1 text-sm leading-6 text-gray-500">
            Manage all your notifications in one place
          </p>
        </div>
        
        <button
          onClick={handleRefresh}
          className="text-gray-500 cursor-pointer hover:text-gray-700"
          title="Refresh notifications"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>
      
      {/* Filters and Actions */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Type Filter */}
          <div>
            <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700">
              Type
            </label>
            <select
              id="type-filter"
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as FilterState['type'] }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="all">All Types</option>
              <option value="campaign">Campaigns</option>
              <option value="application">Applications</option>
              <option value="message">Messages</option>
              <option value="system">System</option>
            </select>
          </div>
          
          {/* Read Status Filter */}
          <div>
            <label htmlFor="read-filter" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="read-filter"
              value={filters.read}
              onChange={(e) => setFilters(prev => ({ ...prev, read: e.target.value as FilterState['read'] }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="all">All</option>
              <option value="read">Read</option>
              <option value="unread">Unread</option>
            </select>
          </div>
          
          {/* Bulk Actions */}
          <div className="flex items-end space-x-2">
            <button
              onClick={() => markAllAsRead()}
              className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 cursor-pointer"
              disabled={loading}
            >
              <Check className="mr-1.5 h-4 w-4 text-gray-400 cursor-pointer" />
              Mark All Read
            </button>
            
            <button
              onClick={() => clearAllNotifications()}
              className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 cursor-pointer"
              disabled={loading}
            >
              <Trash2 className="mr-1.5 h-4 w-4 text-gray-400" />
              Clear All
            </button>
          </div>
        </div>
      </div>
      
      {/* Selection Actions (only visible when items selected) */}
      {selectedIds.length > 0 && (
        <div className="bg-indigo-50 shadow rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-indigo-700">
              {selectedIds.length} {selectedIds.length === 1 ? 'notification' : 'notifications'} selected
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => markAsRead(selectedIds)}
                className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 cursor-pointer"
                disabled={loading}
              >
                <Check className="mr-1.5 h-4 w-4 text-gray-400" />
                Mark Read
              </button>
              
              <button
                onClick={() => deleteNotifications(selectedIds)}
                className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 cursor-pointer"
                disabled={loading}
              >
                <Trash2 className="mr-1.5 h-4 w-4 text-gray-400" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Notifications List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="border-b">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                    <input
                      type="checkbox"
                      disabled
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notification
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRowSkeleton key={i} columns={4} />
                ))}
              </tbody>
            </table>
          </div>
        ) : notifications.length > 0 ? (
          <>
            <div className="border-b">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notification
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Time
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {notifications.map((notification) => (
                    <tr 
                      key={notification.id} 
                      className={`hover:bg-gray-50 cursor-pointer ${!notification.is_read ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(notification.id)}
                          onChange={() => toggleSelect(notification.id)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4" onClick={() => handleNotificationClick(notification)}>
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="ml-4">
                            <div className={`text-sm font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                              {notification.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {notification.content}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" onClick={() => handleNotificationClick(notification)}>
                        {formatTime(notification.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm" onClick={() => handleNotificationClick(notification)}>
                        {notification.is_read ? (
                          <span className="inline-flex rounded-full bg-gray-100 px-2 text-xs font-semibold leading-5 text-gray-800">
                            Read
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-blue-100 px-2 text-xs font-semibold leading-5 text-blue-800">
                            New
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{notifications.length > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0}</span> to{' '}
                    <span className="font-medium">{Math.min(currentPage * PAGE_SIZE, totalCount)}</span> of{' '}
                    <span className="font-medium">{totalCount}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 cursor-pointer"
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>
                    
                    {/* Page numbers */}
                    {[...Array(totalPages)].map((_, i) => {
                      const page = i + 1
                      // Only show current page, first page, last page, and pages near current
                      const isVisible = 
                        page === 1 || 
                        page === totalPages || 
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      
                      if (!isVisible && page === currentPage - 2) {
                        return (
                          <span key="ellipsis-left" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                            ...
                          </span>
                        )
                      }
                      
                      if (!isVisible && page === currentPage + 2) {
                        return (
                          <span key="ellipsis-right" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                            ...
                          </span>
                        )
                      }
                      
                      if (!isVisible) return null
                      
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === page
                              ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 cursor-pointer"
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <Bell className="h-10 w-10 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No notifications found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filters.type !== 'all' || filters.read !== 'all'
                ? 'Try changing your filters to see more notifications'
                : 'You don\'t have any notifications yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 