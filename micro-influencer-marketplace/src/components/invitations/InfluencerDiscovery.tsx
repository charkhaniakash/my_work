"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { User, Mail, MapPin, Users, CheckCircle, Clock, XCircle } from 'lucide-react'
import InviteInfluencerButton from './InviteInfluencerButton'

export default function InfluencerDiscovery() {
  const [mounted, setMounted] = useState(false)
  const [invitedInfluencers, setInvitedInfluencers] = useState<{[key: string]: {[key: string]: string}}>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [niche, setNiche] = useState<string | null>(null)
  const [location, setLocation] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch influencers with filters
  const { data: influencers, isLoading: influencersLoading } = useQuery({
    queryKey: ['influencers', searchQuery, niche, location],
    queryFn: async () => {
      let query = supabase
        .from('users')
        .select('*')
        .eq('role', 'influencer')

      if (searchQuery) {
        query = query.ilike('full_name', `%${searchQuery}%`)
      }
      if (niche) {
        query = query.eq('niche', niche)
      }
      if (location) {
        query = query.eq('location', location)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
    enabled: mounted
  })

  // Fetch available campaigns for the brand
  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      
      console.log('Current user:', user)
      
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('brand_id', user?.id)
        .eq('status', 'active')

      if (error) {
        console.error('Campaign query error:', error)
        throw error
      }
      
      console.log('Campaigns found:', data)
      return data
    },
    enabled: mounted
  })

  // Fetch existing invitations to show status
  const { data: existingInvitations, isLoading: invitationsLoading } = useQuery({
    queryKey: ['invitations'],
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

  // Helper function to get invitation status for an influencer-campaign pair
  const getInvitationStatus = (influencerId: string, campaignId: string) => {
    const invitation = existingInvitations?.find((inv: any) => 
      inv.influencer_id === influencerId && inv.campaign_id === campaignId
    )
    return invitation ? invitation.status : null
  }

  const handleInvite = async (influencerId: string, campaignId: string) => {
    const existingStatus = getInvitationStatus(influencerId, campaignId)
    
    if (existingStatus) {
      if (existingStatus === 'pending') {
        toast.error('Invitation already sent to this influencer')
        return
      } else if (existingStatus === 'accepted') {
        toast.error('This influencer has already accepted an invitation for this campaign')
        return
      }
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Please log in to send invitations')
        return
      }

      const response = await fetch('/api/campaigns/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          campaignId,
          influencerId,
          customMessage: '',
          proposedRate: null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation')
      }

      toast.success('Invitation sent successfully!')
      
      // Update local state to reflect the new invitation
      setInvitedInfluencers(prev => ({
        ...prev,
        [influencerId]: {
          ...prev[influencerId],
          [campaignId]: 'pending'
        }
      }))

      // Refetch invitations to update UI
      // You might want to use React Query's invalidation here
      router.refresh()
    } catch (error: any) {
      console.error('Error sending invitation:', error)
      toast.error(error.message || 'Failed to send invitation')
    }
  }

  const getStatusBadge = (status: string | null) => {
    if (!status) return null

    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pending' },
      accepted: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Accepted' },
      declined: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Declined' }
    }

    const config = statusConfig[status as keyof typeof statusConfig]
    if (!config) return null

    const Icon = config.icon

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    )
  }

  if (!mounted) {
    return null // or a loading skeleton
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Search influencers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </Card>

      {/* Influencer List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {influencersLoading ? (
          <div>Loading...</div>
        ) : influencers?.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">No influencers found</p>
          </div>
        ) : (
          influencers?.map((influencer) => (
            <Card key={influencer.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center space-x-4 mb-4">
                <div className="relative">
                  {influencer.avatar_url ? (
                    <img
                      src={influencer.avatar_url}
                      alt={influencer.full_name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  {influencer.influencer_profile?.verification_status === 'verified' && (
                    <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {influencer.full_name}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <Users className="h-4 w-4 mr-1" />
                    {influencer.influencer_profile?.followers_count?.toLocaleString() || 'N/A'} followers
                  </div>
                </div>
              </div>

              {influencer.influencer_profile && (
                <div className="space-y-3 mb-4">
                  {influencer.influencer_profile.bio && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {influencer.influencer_profile.bio}
                    </p>
                  )}
                  
                  {influencer.influencer_profile.location && (
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="h-4 w-4 mr-1" />
                      {influencer.influencer_profile.location}
                    </div>
                  )}

                  {influencer.influencer_profile.niche && (
                    <div className="flex flex-wrap gap-1">
                      {influencer.influencer_profile.niche.slice(0, 3).map((category: string) => (
                        <Badge key={category} variant="secondary" className="text-xs">
                          {category}
                        </Badge>
                      ))}
                      {influencer.influencer_profile.niche.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{influencer.influencer_profile.niche.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3">
                {campaignsLoading ? (
                  <div className="text-sm text-gray-500">Loading campaigns...</div>
                ) : campaigns?.length === 0 ? (
                  <div className="text-sm text-gray-500">No active campaigns available</div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Select campaign to invite:</label>
                    {campaigns?.map((campaign) => {
                      const invitationStatus = getInvitationStatus(influencer.id, campaign.id)
                      const statusBadge = getStatusBadge(invitationStatus)
                      
                      return (
                        <div key={campaign.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {campaign.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              Budget: ${campaign.budget?.toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {statusBadge}
                            {!invitationStatus && (
                              <Button
                                size="sm"
                                onClick={() => handleInvite(influencer.id, campaign.id)}
                                className="text-xs px-2 py-1"
                              >
                                Invite
                              </Button>
                            )}
                            {invitationStatus === 'declined' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleInvite(influencer.id, campaign.id)}
                                className="text-xs px-2 py-1"
                              >
                                Re-invite
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {influencers?.length === 0 && (
        <div className="text-center py-12">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No influencers found</h3>
          <p className="text-gray-500 mt-1">
            Try adjusting your search criteria or check back later for new influencers.
          </p>
        </div>
      )}
    </div>
  )
} 