'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useQuery } from '@tanstack/react-query'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function InvitationManager() {
  const [activeTab, setActiveTab] = useState('sent')
  const router = useRouter()
  const supabase = createClientComponentClient()

  // Fetch invitations based on active tab
  const { data: invitations, isLoading } = useQuery({
    queryKey: ['invitations', activeTab],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_invitations')
        .select(`
          *,
          campaign:campaigns(*),
          influencer:users!campaign_invitations_influencer_id_fkey(id, full_name, avatar_url),
          brand:users!campaign_invitations_brand_id_fkey(id, full_name, avatar_url)
        `)
        .eq(activeTab === 'sent' ? 'brand_id' : 'influencer_id', (await supabase.auth.getUser()).data.user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    }
  })

  const handleInvitationResponse = async (invitationId: string, status: 'accepted' | 'declined') => {
    const { error } = await supabase
      .from('campaign_invitations')
      .update({ status })
      .eq('id', invitationId)

    if (error) {
      console.error('Error updating invitation:', error)
      return
    }

    // Use router.refresh() instead of window.location.reload()
    router.refresh()
  }

  return (
    <Card className="p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sent">Sent Invitations</TabsTrigger>
          <TabsTrigger value="received">Received Invitations</TabsTrigger>
        </TabsList>

        <TabsContent value="sent" className="mt-6">
          <div className="space-y-4">
            {isLoading ? (
              <div>Loading...</div>
            ) : invitations?.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No sent invitations yet</p>
                <Button
                  className="mt-4"
                  onClick={() => router.push('/dashboard/invitations/discover')}
                >
                  Discover Influencers
                </Button>
              </div>
            ) : (
              invitations?.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={invitation.influencer.avatar_url} />
                      <AvatarFallback>
                        {invitation.influencer.full_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{invitation.influencer.full_name}</h3>
                      <p className="text-sm text-gray-500">{invitation.campaign.title}</p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      invitation.status === 'pending'
                        ? 'secondary'
                        : invitation.status === 'accepted'
                        ? 'default'
                        : 'destructive'
                    }
                  >
                    {invitation.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="received" className="mt-6">
          <div className="space-y-4">
            {isLoading ? (
              <div>Loading...</div>
            ) : invitations?.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No received invitations</p>
              </div>
            ) : (
              invitations?.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={invitation.brand.avatar_url} />
                      <AvatarFallback>
                        {invitation.brand.full_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{invitation.brand.full_name}</h3>
                      <p className="text-sm text-gray-500">{invitation.campaign.title}</p>
                    </div>
                  </div>
                  {invitation.status === 'pending' ? (
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => handleInvitationResponse(invitation.id, 'declined')}
                      >
                        Decline
                      </Button>
                      <Button
                        onClick={() => handleInvitationResponse(invitation.id, 'accepted')}
                      >
                        Accept
                      </Button>
                    </div>
                  ) : (
                    <Badge
                      variant={
                        invitation.status === 'accepted'
                          ? 'default'
                          : 'destructive'
                      }
                    >
                      {invitation.status}
                    </Badge>
                  )}
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  )
} 