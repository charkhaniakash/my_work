import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createCampaignNotification, createNotification } from '@/lib/services/notification-service'

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const today = new Date().toISOString().split('T')[0]

    // Find scheduled campaigns that should be activated today
    const { data: campaignsToActivate, error: fetchError } = await supabase
      .from('campaigns')
      .select('id, title, start_date, brand_id, users!campaigns_brand_id_fkey(user_metadata)')
      .eq('status', 'scheduled')
      .lte('start_date', today)

    if (fetchError) {
      console.error('Error fetching campaigns to activate:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch campaigns for activation' },
        { status: 500 }
      )
    }

    if (!campaignsToActivate || campaignsToActivate.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No campaigns to activate today',
        activatedCount: 0,
        timestamp: new Date().toISOString()
      })
    }

    // Activate each campaign and send notifications
    const activationResults = await Promise.all(
      campaignsToActivate.map(async (campaign) => {
        try {
          // Update campaign status to active
          const { error: updateError } = await supabase
            .from('campaigns')
            .update({ status: 'active' })
            .eq('id', campaign.id)

          if (updateError) {
            console.error(`Error activating campaign ${campaign.id}:`, updateError)
            return { campaignId: campaign.id, success: false, error: updateError }
          }

          // Get all influencers
          const { data: influencers, error: influencersError } = await supabase
            .from('users')
            .select('id')
            .eq('role', 'influencer')

          if (influencersError) {
            console.error(`Error fetching influencers for campaign ${campaign.id}:`, influencersError)
            return { campaignId: campaign.id, success: true, notificationsSuccess: false }
          }

          // Send notifications to all influencers
          const brandUser = campaign.users && campaign.users[0]
          const brandName = brandUser?.user_metadata?.full_name || 'A brand'

          await Promise.all(
            influencers.map(influencer =>
              createCampaignNotification(
                influencer.id,
                campaign.title,
                brandName,
                campaign.id
              )
            )
          )

          return { campaignId: campaign.id, success: true, notificationsSuccess: true }
        } catch (error) {
          console.error(`Unexpected error activating campaign ${campaign.id}:`, error)
          return { campaignId: campaign.id, success: false, error }
        }
      })
    )

    const successfulActivations = activationResults.filter(result => result.success)

    return NextResponse.json({
      success: true,
      message: 'Campaign activation process completed',
      activatedCount: successfulActivations.length,
      campaigns: activationResults,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Unexpected error in activate campaigns endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to check campaigns that need activation
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const today = new Date().toISOString().split('T')[0]

    // Find scheduled campaigns that should be activated
    const { data: campaignsToActivate, error } = await supabase
      .from('campaigns')
      .select('id, title, start_date, brand_id')
      .eq('status', 'scheduled')
      .lte('start_date', today)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to check campaign status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      campaignsNeedingActivation: campaignsToActivate?.length || 0,
      campaigns: campaignsToActivate || [],
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in GET activate campaigns endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 