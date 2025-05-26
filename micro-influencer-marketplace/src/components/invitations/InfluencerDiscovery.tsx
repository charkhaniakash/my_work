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

export default function InfluencerDiscovery() {
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [niche, setNiche] = useState<string | null>(null)
  const [location, setLocation] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch influencers with filters
  const { data: influencers, isLoading } = useQuery({
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

  const handleInvite = async (influencerId: string, campaignId: string) => {
    try {
      const { error } = await supabase
        .from('campaign_invitations')
        .insert({
          influencer_id: influencerId,
          campaign_id: campaignId,
          brand_id: (await supabase.auth.getUser()).data.user?.id,
          status: 'pending'
        })

      if (error) throw error

      toast.success('Invitation sent successfully!')
      router.refresh()
    } catch (error) {
      console.error('Error sending invitation:', error)
      toast.error('Failed to send invitation')
    }
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
        {isLoading ? (
          <div>Loading...</div>
        ) : influencers?.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">No influencers found</p>
          </div>
        ) : (
          influencers?.map((influencer) => (
            <Card key={influencer.id} className="p-6">
              <div className="flex items-start space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={influencer.avatar_url} />
                  <AvatarFallback>
                    {influencer.full_name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-medium">{influencer.full_name}</h3>
                  <p className="text-sm text-gray-500">{influencer.bio}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="secondary">{influencer.niche}</Badge>
                    <Badge variant="outline">{influencer.location}</Badge>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                {campaignsLoading ? (
                  <div>Loading campaigns...</div>
                ) : campaigns?.length === 0 ? (
                  <div className="text-sm text-gray-500">
                    No active campaigns available
                  </div>
                ) : (
                  <Select
                    onValueChange={(campaignId) => handleInvite(influencer.id, campaignId)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select campaign to invite" />
                    </SelectTrigger>
                    <SelectContent>
                      {campaigns?.map((campaign) => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          {campaign.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
} 