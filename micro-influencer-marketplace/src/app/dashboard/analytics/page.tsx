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

        if (campaignsError) {
          toast.error('Failed to load campaign data')
          console.error('Campaigns error:', campaignsError)
          setLoading(false)
          return
        }

        // For brand users, fetch applications related to their campaigns
        const { data: applications, error: applicationsError } = await supabase
          .from('campaign_applications')
          .select('*')
          .in('campaign_id', campaigns?.map(c => c.id) || [])

        if (applicationsError) {
          toast.error('Failed to load application data')
          console.error('Applications error:', applicationsError)
          // Still calculate analytics with campaign data even if application data fails
          const partialAnalytics = calculateAnalytics(campaigns || [], [])
          setAnalytics(partialAnalytics)
          setLoading(false)
          return
        }

        // Calculate analytics with both campaign and application data
        const analytics = calculateAnalytics(campaigns || [], applications || [])
        setAnalytics(analytics)
      } else {
        // Load influencer analytics
        const { data: applications, error: applicationsError } = await supabase
          .from('campaign_applications')
          .select('*, campaign:campaigns(*)')
          .eq('influencer_id', user.id)

        if (applicationsError) {
          toast.error('Failed to load application data')
          console.error('Applications error:', applicationsError)
          setLoading(false)
          return
        }

        // Extract campaigns from applications
        const campaigns = applications?.map(app => app.campaign).filter(Boolean) || []
        
        // Calculate analytics
        const analytics = calculateAnalytics(campaigns, applications || [])
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
    // Create a safe copy of campaigns to prevent errors
    const safeCampaigns = Array.isArray(campaigns) ? campaigns : []
    const safeApplications = Array.isArray(applications) ? applications : []
    
    // Group campaigns by status
    const campaignsByStatus = safeCampaigns.reduce((acc, campaign) => {
      const status = campaign?.status || 'unknown'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Group applications by month
    const applicationsByMonth = safeApplications.reduce((acc, app) => {
      if (!app?.created_at) return acc
      
      const month = new Date(app.created_at).toLocaleString('default', { month: 'long' })
      acc[month] = (acc[month] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Calculate totals with safety checks
    return {
      totalCampaigns: safeCampaigns.length,
      activeCampaigns: safeCampaigns.filter(c => c?.status === 'active').length,
      totalApplications: safeApplications.length,
      acceptedApplications: safeApplications.filter(a => a?.status === 'accepted').length,
      pendingApplications: safeApplications.filter(a => a?.status === 'pending').length,
      rejectedApplications: safeApplications.filter(a => a?.status === 'rejected').length,
      totalBudget: safeCampaigns.reduce((sum, campaign) => sum + (Number(campaign?.budget) || 0), 0),
      averageRate: safeApplications.length
        ? safeApplications.reduce((sum, app) => sum + (Number(app?.proposed_rate) || 0), 0) / safeApplications.length
        : 0,
      campaignsByStatus,
      applicationsByMonth
    }
  }

  if (!isLoaded) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      <span className="ml-2">Loading analytics data...</span>
    </div>
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
                  <dd className="text-lg font-medium text-gray-900">${analytics.totalBudget.toLocaleString()}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Applications Status */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Accepted Applications</dt>
                  <dd className="text-lg font-medium text-gray-900">{analytics.acceptedApplications}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Applications</dt>
                  <dd className="text-lg font-medium text-gray-900">{analytics.pendingApplications}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircle className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Rejected Applications</dt>
                  <dd className="text-lg font-medium text-gray-900">{analytics.rejectedApplications}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Status Distribution */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="p-5">
          <h3 className="text-base font-semibold leading-6 text-gray-900">Campaign Status Distribution</h3>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Object.entries(analytics.campaignsByStatus).map(([status, count]) => (
              <div key={status} className="rounded-lg bg-gray-50 p-4">
                <dt className="text-sm font-medium text-gray-500 capitalize">{status}</dt>
                <dd className="mt-1 text-lg font-semibold text-gray-900">{count}</dd>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Applications by Month */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="p-5">
          <h3 className="text-base font-semibold leading-6 text-gray-900">Applications by Month</h3>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {Object.entries(analytics.applicationsByMonth).map(([month, count]) => (
              <div key={month} className="rounded-lg bg-gray-50 p-4">
                <dt className="text-sm font-medium text-gray-500">{month}</dt>
                <dd className="mt-1 text-lg font-semibold text-gray-900">{count}</dd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 