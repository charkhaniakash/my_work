'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle, 
  User, 
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  Send
} from 'lucide-react'
import { DashboardHeader } from '@/components/dashboard-header'
import Link from 'next/link'

interface InvitationStats {
  total: number
  pending: number
  accepted: number
  declined: number
}

export default function InvitationsPage() {
  const [mounted, setMounted] = useState(false)
  const [stats, setStats] = useState<InvitationStats>({
    total: 0,
    pending: 0,
    accepted: 0,
    declined: 0
  })
  const [activeTab, setActiveTab] = useState('all')
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch all invitations for the brand
  const { data: invitations, isLoading, refetch } = useQuery({
    queryKey: ['brand-invitations'],
    queryFn: async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (!session) return []

      const response = await fetch('/api/campaigns/invitations', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch invitations')
      }

      const result = await response.json()
      return result.invitations || []
    },
    enabled: mounted
  })

  // Calculate stats when invitations change
  useEffect(() => {
    if (invitations) {
      const newStats = {
        total: invitations.length,
        pending: invitations.filter((inv: any) => inv.status === 'pending').length,
        accepted: invitations.filter((inv: any) => inv.status === 'accepted').length,
        declined: invitations.filter((inv: any) => inv.status === 'declined').length
      }
      setStats(newStats)
    }
  }, [invitations])

  // Filter invitations based on active tab
  const filteredInvitations = invitations?.filter((invitation: any) => {
    if (activeTab === 'all') return true
    return invitation.status === activeTab
  }) || []

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300', 
        icon: Clock, 
        text: 'Pending' 
      },
      accepted: { 
        color: 'bg-green-100 text-green-800 border-green-300', 
        icon: CheckCircle, 
        text: 'Accepted' 
      },
      declined: { 
        color: 'bg-red-100 text-red-800 border-red-300', 
        icon: XCircle, 
        text: 'Declined' 
      }
    }

    const config = statusConfig[status as keyof typeof statusConfig]
    if (!config) return null

    const Icon = config.icon

    return (
      <Badge className={`${config.color} flex items-center gap-1 border`}>
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        heading="Invitations"
        text="Manage and track your influencer invitations"
      >
        <Button asChild>
          <Link href="/dashboard/invitations/discover">
            <Send className="h-4 w-4 mr-2" />
            Invite Influencers
          </Link>
        </Button>
      </DashboardHeader>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invitations</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
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
              <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Declined</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.declined}</div>
            </CardContent>
          </Card>
        </div>

        {/* Invitations List */}
        <Card>
          <CardHeader>
            <CardTitle>Invitation History</CardTitle>
            <CardDescription>
              View and manage all your sent invitations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
                <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
                <TabsTrigger value="accepted">Accepted ({stats.accepted})</TabsTrigger>
                <TabsTrigger value="declined">Declined ({stats.declined})</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="border border-gray-200 rounded-lg p-6">
                          <div className="flex items-center justify-between mb-3">
                            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                            <div className="h-6 bg-gray-200 rounded w-20"></div>
                          </div>
                          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredInvitations.length === 0 ? (
                  <div className="text-center py-12">
                    <Mail className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      {activeTab === 'all' ? 'No invitations sent yet' : `No ${activeTab} invitations`}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {activeTab === 'all' 
                        ? 'Start by inviting influencers to your campaigns.'
                        : `You don't have any ${activeTab} invitations at the moment.`
                      }
                    </p>
                    {activeTab === 'all' && (
                      <div className="mt-6">
                        <Button asChild>
                          <Link href="/dashboard/invitations/discover">
                            <Send className="h-4 w-4 mr-2" />
                            Invite Influencers
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredInvitations.map((invitation: any) => (
                      <div
                        key={invitation.id}
                        className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="flex items-center gap-2">
                                {invitation.influencer?.avatar_url ? (
                                  <img
                                    src={invitation.influencer.avatar_url}
                                    alt={invitation.influencer.full_name}
                                    className="h-10 w-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                    <User className="h-5 w-5 text-gray-400" />
                                  </div>
                                )}
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {invitation.influencer?.full_name || 'Unknown Influencer'}
                                  </h3>
                                  <p className="text-sm text-gray-500">
                                    Campaign: {invitation.campaign?.title || 'Unknown Campaign'}
                                  </p>
                                </div>
                              </div>
                              {getStatusBadge(invitation.status)}
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-500 mb-4">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                Sent: {formatDate(invitation.created_at)}
                              </div>
                              {invitation.proposed_rate && (
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-4 w-4" />
                                  Offered: ${invitation.proposed_rate.toLocaleString()}
                                </div>
                              )}
                              {invitation.updated_at !== invitation.created_at && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  Updated: {formatDate(invitation.updated_at)}
                                </div>
                              )}
      </div>

                            {invitation.custom_message && (
                              <div className="bg-gray-50 p-3 rounded-md mb-4">
                                <p className="text-sm text-gray-700">
                                  <strong>Message:</strong> {invitation.custom_message}
                                </p>
                              </div>
                            )}
        </div>

                          <div className="flex flex-col gap-2 ml-4">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/dashboard/campaigns/${invitation.campaign_id}`}>
                                View Campaign
                              </Link>
                            </Button>
                            
                            {invitation.status === 'accepted' && (
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/dashboard/messages?contact=${invitation.influencer_id}`}>
                                  Message
                                </Link>
                              </Button>
                            )}
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