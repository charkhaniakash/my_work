'use client'

import React, { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useSupabase } from '@/lib/providers/supabase-provider'
import { DashboardHeader } from '@/components/dashboard-header'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  Calendar, 
  Eye,
  MessageSquare,
  TrendingUp
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ApplicationWithCampaign {
  id: string
  campaign_id: string
  influencer_id: string
  brand_id: string
  status: 'pending' | 'accepted' | 'rejected' | 'approved_and_paid'
  pitch: string
  proposed_rate: number
  created_at: string
  updated_at: string
  campaign: {
    id: string
    title: string
    description: string
    budget: number
    status: string
    requirements: string[]
    brand: {
      id: string
      full_name: string
      avatar_url?: string
      brand_profile?: {
        company_name: string
      }
    }
  }
}

interface ApplicationStats {
  total: number
  pending: number
  accepted: number
  rejected: number
  approved_and_paid: number
  totalEarnings: number
}

export default function ApplicationsPage() {
  const { user } = useSupabase()
  const [applications, setApplications] = useState<ApplicationWithCampaign[]>([])
  const [filteredApplications, setFilteredApplications] = useState<ApplicationWithCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<ApplicationStats>({
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
    approved_and_paid: 0,
    totalEarnings: 0
  })
  const [activeTab, setActiveTab] = useState('all')
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (user?.id && user?.user_metadata?.role === 'influencer') {
      loadApplications()
    }
  }, [user])

  useEffect(() => {
    filterApplications()
  }, [applications, activeTab])

  const loadApplications = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('campaign_applications')
        .select(`
          *,
          campaign:campaigns (
            id,
            title,
            description,
            budget,
            status,
            requirements,
            brand:users!campaigns_brand_id_fkey (
              id,
              full_name,
              avatar_url,
              brand_profile:brand_profiles!brand_profiles_user_id_fkey (
                company_name
              )
            )
          )
        `)
        .eq('influencer_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setApplications(data || [])
      calculateStats(data || [])
    } catch (error) {
      console.error('Error loading applications:', error)
      toast.error('Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (apps: ApplicationWithCampaign[]) => {
    const stats = {
      total: apps.length,
      pending: apps.filter(app => app.status === 'pending').length,
      accepted: apps.filter(app => app.status === 'accepted').length,
      rejected: apps.filter(app => app.status === 'rejected').length,
      approved_and_paid: apps.filter(app => app.status === 'approved_and_paid').length,
      totalEarnings: apps
        .filter(app => app.status === 'approved_and_paid')
        .reduce((sum, app) => sum + app.proposed_rate, 0)
    }
    setStats(stats)
  }

  const filterApplications = () => {
    let filtered = applications
    
    switch (activeTab) {
      case 'pending':
        filtered = applications.filter(app => app.status === 'pending')
        break
      case 'accepted':
        filtered = applications.filter(app => app.status === 'accepted' || app.status === 'approved_and_paid')
        break
      case 'rejected':
        filtered = applications.filter(app => app.status === 'rejected')
        break
      default:
        filtered = applications
    }
    
    setFilteredApplications(filtered)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { 
        label: 'Under Review', 
        variant: 'secondary' as const, 
        icon: Clock,
        className: 'bg-yellow-100 text-yellow-800 border-yellow-300'
      },
      accepted: { 
        label: 'Accepted', 
        variant: 'default' as const, 
        icon: CheckCircle,
        className: 'bg-green-100 text-green-800 border-green-300'
      },
      approved_and_paid: { 
        label: 'Paid', 
        variant: 'default' as const, 
        icon: DollarSign,
        className: 'bg-emerald-100 text-emerald-800 border-emerald-300'
      },
      rejected: { 
        label: 'Not Selected', 
        variant: 'destructive' as const, 
        icon: XCircle,
        className: 'bg-red-100 text-red-800 border-red-300'
      }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className={`${config.className} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getStatusMessage = (status: string) => {
    const messages = {
      pending: "Your application is being reviewed by the brand. You'll be notified once they make a decision.",
      accepted: "🎉 Congratulations! Your application was accepted. The brand will process payment soon.",
      approved_and_paid: "✅ Payment has been processed! You can now start working on the campaign deliverables.",
      rejected: "Unfortunately, your application wasn't selected. Keep applying to other campaigns!"
    }
    return messages[status as keyof typeof messages] || ''
  }

  if (!user || user.user_metadata?.role !== 'influencer') {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Access Restricted</h3>
        <p className="mt-1 text-sm text-gray-500">This page is only available to influencers.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader
          heading="My Applications"
          text="Track your campaign applications and their status"
        />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        heading="My Applications"
        text="Track your campaign applications and their status"
      >
        <Button asChild>
          <Link href="/dashboard/available-campaigns">
            Find New Campaigns
          </Link>
        </Button>
      </DashboardHeader>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Under Review</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accepted</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.accepted + stats.approved_and_paid}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed & Paid</CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{stats.approved_and_paid}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">${stats.totalEarnings.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Applications List */}
        <Card>
          <CardHeader>
            <CardTitle>Application History</CardTitle>
            <CardDescription>
              View and track all your campaign applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
                <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
                <TabsTrigger value="accepted">Accepted ({stats.accepted + stats.approved_and_paid})</TabsTrigger>
                <TabsTrigger value="rejected">Rejected ({stats.rejected})</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                {filteredApplications.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      {activeTab === 'all' ? 'No applications yet' : `No ${activeTab} applications`}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {activeTab === 'all' 
                        ? 'Start by applying to campaigns that match your profile.'
                        : `You don't have any ${activeTab} applications at the moment.`
                      }
                    </p>
                    {activeTab === 'all' && (
                      <div className="mt-6">
                        <Button asChild>
                          <Link href="/dashboard/available-campaigns">
                            Browse Campaigns
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredApplications.map((application) => (
                      <div
                        key={application.id}
                        className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="flex items-center gap-2">
                                                                 {application.campaign.brand.avatar_url ? (
                                   <img
                                     src={application.campaign.brand.avatar_url}
                                     alt={application.campaign.brand.brand_profile?.company_name || application.campaign.brand.full_name}
                                     className="h-8 w-8 rounded-full"
                                   />
                                 ) : (
                                   <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                                     <span className="text-sm font-medium text-gray-600">
                                       {(application.campaign.brand.brand_profile?.company_name || application.campaign.brand.full_name)?.[0]}
                                     </span>
                                   </div>
                                 )}
                                 <div>
                                   <h3 className="text-lg font-semibold text-gray-900">
                                     {application.campaign.title}
                                   </h3>
                                   <p className="text-sm text-gray-500">
                                     by {application.campaign.brand.brand_profile?.company_name || application.campaign.brand.full_name}
                                   </p>
                                 </div>
                              </div>
                              {getStatusBadge(application.status)}
                            </div>
                            
                            <p className="text-gray-600 mb-4 line-clamp-2">
                              {application.campaign.description}
                            </p>
                            
                            <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                Proposed: ${application.proposed_rate.toLocaleString()}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                Applied: {new Date(application.created_at).toLocaleDateString()}
                              </div>
                              {application.status !== 'pending' && application.updated_at && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  Updated: {new Date(application.updated_at).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                            
                            <div className="bg-gray-50 p-3 rounded-md mb-4">
                              <p className="text-sm text-gray-700">
                                {getStatusMessage(application.status)}
                              </p>
                            </div>
                            
                            <details className="group">
                              <summary className="cursor-pointer text-sm font-medium text-indigo-600 hover:text-indigo-500">
                                View My Pitch
                                {application.pitch === 'Accepted invitation' && (
                                  <span className="ml-2 text-xs text-gray-500">(From Invitation)</span>
                                )}
                              </summary>
                              <div className="mt-2 p-3 bg-indigo-50 rounded-md">
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                  {application.pitch === 'Accepted invitation' 
                                    ? 'This application was created when you accepted a campaign invitation from the brand.'
                                    : application.pitch
                                  }
                                </p>
                              </div>
                            </details>
                          </div>
                          
                          <div className="flex flex-col gap-2 ml-4">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/dashboard/campaigns/${application.campaign_id}`}>
                                <Eye className="h-4 w-4 mr-1" />
                                View Campaign
                              </Link>
                            </Button>
                            
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/dashboard/messages?contact=${application.brand_id}`}>
                                <MessageSquare className="h-4 w-4 mr-1" />
                                Message Brand
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 