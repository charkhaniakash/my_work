'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useUser } from '@clerk/nextjs'
import { 
  Users,
  MessageSquare,
  FileText,
  TrendingUp,
  Bell
} from 'lucide-react'
import { Campaign, CampaignApplication } from '@/lib/types/database'
import { toast } from 'react-hot-toast'

interface Activity {
  id: string
  title: string
  description: string
  created_at: string
  type: 'campaign' | 'application' | 'message'
}

export default function Dashboard() {
  const { user, isLoaded } = useUser()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    activeCampaigns: 0,
    totalConnections: 0,
    totalMessages: 0,
    engagementRate: 0
  })
  const [activities, setActivities] = useState<Activity[]>([])

  useEffect(() => {
    if (isLoaded && user) {
      loadDashboardStats()
      loadRecentActivity()
    }
  }, [isLoaded, user])

  const loadRecentActivity = async () => {
    try {
      const activities: Activity[] = []

      // Get recent campaigns
      const { data: campaigns, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*')
        .eq(user?.publicMetadata.role === 'brand' ? 'brand_id' : 'status', user?.id || 'active')
        .order('created_at', { ascending: false })
        .limit(3)

      if (campaignsError) throw campaignsError

      // Get recent applications
      const { data: applications, error: applicationsError } = await supabase
        .from('campaign_applications')
        .select('*, campaign:campaigns(*)')
        .eq(user?.publicMetadata.role === 'brand' ? 'brand_id' : 'influencer_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(3)

      if (applicationsError) throw applicationsError

      // Format campaigns
      campaigns?.forEach(campaign => {
        activities.push({
          id: `campaign-${campaign.id}`,
          title: user?.publicMetadata.role === 'brand' 
            ? `Campaign "${campaign.title}" ${campaign.status}`
            : `New campaign available: ${campaign.title}`,
          description: campaign.description,
          created_at: campaign.created_at,
          type: 'campaign'
        })
      })

      // Format applications
      applications?.forEach(application => {
        activities.push({
          id: `application-${application.id}`,
          title: user?.publicMetadata.role === 'brand'
            ? `New application received for "${application.campaign.title}"`
            : `Your application for "${application.campaign.title}" is ${application.status}`,
          description: application.pitch || 'No pitch provided',
          created_at: application.created_at,
          type: 'application'
        })
      })

      // Sort by date and limit to 5
      activities.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setActivities(activities.slice(0, 5))

    } catch (error) {
      console.error('Error loading recent activity:', error)
      toast.error('Failed to load recent activity')
    }
  }

  const loadDashboardStats = async () => {
    try {
      setLoading(true)

      // Load active campaigns
      const { data: campaigns, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('status', 'active')
        .eq('brand_id', user?.id)

      if (campaignsError) throw campaignsError

      // Load connections (applications)
      const { data: applications, error: applicationsError } = await supabase
        .from('campaign_applications')
        .select('*')
        .eq(user?.publicMetadata.role === 'brand' ? 'brand_id' : 'influencer_id', user?.id)

      if (applicationsError) throw applicationsError

      // Load messages
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)

      if (messagesError) throw messagesError

      // Calculate engagement rate (accepted applications / total applications)
      const acceptedApplications = applications?.filter(app => app.status === 'accepted').length || 0
      const engagementRate = applications?.length 
        ? ((acceptedApplications / applications.length) * 100).toFixed(1)
        : 0

      setStats({
        activeCampaigns: campaigns?.length || 0,
        totalConnections: applications?.length || 0,
        totalMessages: messages?.length || 0,
        engagementRate: Number(engagementRate)
      })
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
      toast.error('Failed to load dashboard stats')
    } finally {
      setLoading(false)
    }
  }

  if (!isLoaded || loading) {
    return <div>Loading...</div>
  }

  const statsData = [
    { 
      name: 'Active Campaigns', 
      value: stats.activeCampaigns.toString(), 
      icon: FileText
    },
    { 
      name: 'Total Connections', 
      value: stats.totalConnections.toString(), 
      icon: Users
    },
    { 
      name: 'Messages', 
      value: stats.totalMessages.toString(), 
      icon: MessageSquare
    },
    { 
      name: 'Engagement Rate', 
      value: `${stats.engagementRate}%`, 
      icon: TrendingUp
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Welcome back!
        </h2>
        <p className="mt-1 text-sm leading-6 text-gray-500">
          Here's what's happening with your account today.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat) => (
          <div
            key={stat.name}
            className="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6"
          >
            <dt>
              <div className="absolute rounded-md bg-indigo-500 p-3">
                <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">{stat.name}</p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
            </dd>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-6">
            <h3 className="text-base font-semibold leading-6 text-gray-900">Recent Activity</h3>
            <div className="mt-6 flow-root">
              {activities.length === 0 ? (
                <p className="text-sm text-gray-500">No recent activity</p>
              ) : (
                <ul role="list" className="-my-5 divide-y divide-gray-200">
                  {activities.map((activity) => (
                    <li key={activity.id} className="py-5">
                      <div className="relative focus-within:ring-2 focus-within:ring-indigo-500">
                        <h3 className="text-sm font-semibold text-gray-800">
                          <span className="absolute inset-0" aria-hidden="true" />
                          {activity.title}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                          {activity.description}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          {new Date(activity.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-6">
            <h3 className="text-base font-semibold leading-6 text-gray-900">Quick Actions</h3>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button 
                onClick={() => window.location.href = '/dashboard/campaigns/new'}
                className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                <FileText className="-ml-0.5 h-5 w-5" aria-hidden="true" />
                Create Campaign
              </button>
              <button 
                onClick={() => window.location.href = '/dashboard/discover'}
                className="inline-flex items-center gap-x-2 rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                <Users className="-ml-0.5 h-5 w-5" aria-hidden="true" />
                Find Influencers
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 