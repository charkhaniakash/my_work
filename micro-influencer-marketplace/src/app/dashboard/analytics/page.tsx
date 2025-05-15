'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Campaign, CampaignApplication } from '@/lib/types/database'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  FileText
} from 'lucide-react'
import { toast } from 'react-hot-toast'

type Analytics = {
  totalCampaigns: number
  activeCampaigns: number
  totalApplications: number
  acceptedApplications: number
  pendingApplications: number
  rejectedApplications: number
  totalBudget: number
  averageRate: number
  campaignsByStatus: Record<string, number>
  applicationsByMonth: Record<string, number>
}

export default function Analytics() {
  const { user, isLoaded } = useUser()
  const [analytics, setAnalytics] = useState<Analytics>({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalApplications: 0,
    acceptedApplications: 0,
    pendingApplications: 0,
    rejectedApplications: 0,
    totalBudget: 0,
    averageRate: 0,
    campaignsByStatus: {},
    applicationsByMonth: {}
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (isLoaded && user) {
      loadAnalytics()
    }
  }, [isLoaded, user])

  const loadAnalytics = async () => {
    try {
      if (!user) return

      if (user.publicMetadata.role === 'brand') {
        // Load brand analytics
        const { data: campaigns, error: campaignsError } = await supabase
          .from('campaigns')
          .select('*')
          .eq('brand_id', user.id)

        const { data: applications, error: applicationsError } = await supabase
          .from('campaign_applications')
          .select('*, campaign:campaigns(*)')
          .eq('campaign.brand_id', user.id)

        if (campaignsError || applicationsError) throw campaignsError || applicationsError

        // Calculate analytics
        const analytics = calculateAnalytics(campaigns || [], applications || [])
        setAnalytics(analytics)
      } else {
        // Load influencer analytics
        const { data: applications, error: applicationsError } = await supabase
          .from('campaign_applications')
          .select('*, campaign:campaigns(*)')
          .eq('influencer_id', user.id)

        if (applicationsError) throw applicationsError

        // Calculate analytics
        const analytics = calculateAnalytics(
          applications?.map(app => app.campaign) || [],
          applications || []
        )
        setAnalytics(analytics)
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
      toast.error('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const calculateAnalytics = (campaigns: Campaign[], applications: CampaignApplication[]) => {
    const campaignsByStatus = campaigns.reduce((acc, campaign) => {
      acc[campaign.status] = (acc[campaign.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const applicationsByMonth = applications.reduce((acc, app) => {
      const month = new Date(app.created_at).toLocaleString('default', { month: 'long' })
      acc[month] = (acc[month] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter(c => c.status === 'active').length,
      totalApplications: applications.length,
      acceptedApplications: applications.filter(a => a.status === 'accepted').length,
      pendingApplications: applications.filter(a => a.status === 'pending').length,
      rejectedApplications: applications.filter(a => a.status === 'rejected').length,
      totalBudget: campaigns.reduce((sum, campaign) => sum + (campaign.budget || 0), 0),
      averageRate: applications.length
        ? applications.reduce((sum, app) => sum + (app.proposed_rate || 0), 0) / applications.length
        : 0,
      campaignsByStatus,
      applicationsByMonth
    }
  }

  if (!isLoaded || loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Analytics Dashboard
        </h2>
        <p className="mt-1 text-sm leading-6 text-gray-500">
          Track your performance and campaign metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Campaigns</dt>
                  <dd className="text-lg font-medium text-gray-900">{analytics.totalCampaigns}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Campaigns</dt>
                  <dd className="text-lg font-medium text-gray-900">{analytics.activeCampaigns}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Applications</dt>
                  <dd className="text-lg font-medium text-gray-900">{analytics.totalApplications}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Budget</dt>
                  <dd className="text-lg font-medium text-gray-900">${analytics.totalBudget}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Applications Status */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Applications Status</h3>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="overflow-hidden rounded-lg bg-green-50 px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-green-500 truncate">Accepted</dt>
                    <dd className="text-lg font-medium text-green-900">
                      {analytics.acceptedApplications}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg bg-yellow-50 px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-yellow-500 truncate">Pending</dt>
                    <dd className="text-lg font-medium text-yellow-900">
                      {analytics.pendingApplications}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg bg-red-50 px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <XCircle className="h-6 w-6 text-red-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-red-500 truncate">Rejected</dt>
                    <dd className="text-lg font-medium text-red-900">
                      {analytics.rejectedApplications}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Campaign Status Distribution */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Campaign Status Distribution
            </h3>
            <div className="mt-5">
              {Object.entries(analytics.campaignsByStatus).map(([status, count]) => (
                <div key={status} className="mt-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-600">
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </div>
                    <div className="text-sm font-medium text-gray-900">{count}</div>
                  </div>
                  <div className="mt-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-indigo-600"
                      style={{
                        width: `${(count / analytics.totalCampaigns) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Applications by Month */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Applications by Month
            </h3>
            <div className="mt-5">
              {Object.entries(analytics.applicationsByMonth).map(([month, count]) => (
                <div key={month} className="mt-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-600">{month}</div>
                    <div className="text-sm font-medium text-gray-900">{count}</div>
                  </div>
                  <div className="mt-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-indigo-600"
                      style={{
                        width: `${(count / analytics.totalApplications) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 