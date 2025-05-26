import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { findMatchingCampaigns, findMatchingInfluencers } from '@/lib/services/campaign-matching-service'

// Initialize Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const influencerId = url.searchParams.get('influencerId')
    const campaignId = url.searchParams.get('campaignId')
    const minScore = parseInt(url.searchParams.get('minScore') || '60')
    
    // Verify that either influencerId or campaignId is provided, but not both
    if ((!influencerId && !campaignId) || (influencerId && campaignId)) {
      return NextResponse.json(
        { error: 'Provide either influencerId or campaignId parameter, but not both' },
        { status: 400 }
      )
    }
    
    // Check user authorization
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // If influencerId is provided, fetch matching campaigns
    if (influencerId) {
      // Check if the user is authorized to get matches for this influencer
      if (user.id !== influencerId && user.app_metadata.role !== 'admin') {
        return NextResponse.json(
          { error: 'You are not authorized to view matches for this influencer' },
          { status: 403 }
        )
      }
      
      const matches = await findMatchingCampaigns(influencerId, minScore)
      
      // Get additional campaign details for the matches
      if (matches.length > 0) {
        const campaignIds = matches.map(match => match.campaignId)
        
        const { data: campaignDetails } = await supabase
          .from('campaigns')
          .select('id, title, description, budget, target_niche, target_location, brand_id, brand:brand_id(full_name, avatar_url)')
          .in('id', campaignIds)
        
        // Merge campaign details with match data
        const enrichedMatches = matches.map(match => {
          const campaign = campaignDetails?.find(c => c.id === match.campaignId)
          return {
            ...match,
            campaign
          }
        })
        
        return NextResponse.json({ matches: enrichedMatches })
      }
      
      return NextResponse.json({ matches })
    }
    
    // If campaignId is provided, fetch matching influencers
    if (campaignId) {
      // Check if the user is the campaign owner or an admin
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('brand_id')
        .eq('id', campaignId)
        .single()
      
      if (campaignError || !campaign) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
      }
      
      if (campaign.brand_id !== user.id && user.app_metadata.role !== 'admin') {
        return NextResponse.json(
          { error: 'You are not authorized to view matches for this campaign' },
          { status: 403 }
        )
      }
      
      const matches = await findMatchingInfluencers(campaignId, minScore)
      
      // Get additional influencer details for the matches
      if (matches.length > 0) {
        const influencerIds = matches.map(match => match.influencerId)
        
        const { data: influencerDetails } = await supabase
          .from('users')
          .select('id, full_name, avatar_url, profile:influencer_profiles(niches, audience_size, engagement_rate, followers_count)')
          .in('id', influencerIds)
        
        // Merge influencer details with match data
        const enrichedMatches = matches.map(match => {
          const influencer = influencerDetails?.find(i => i.id === match.influencerId)
          return {
            ...match,
            influencer
          }
        })
        
        return NextResponse.json({ matches: enrichedMatches })
      }
      
      return NextResponse.json({ matches })
    }
    
    // This should never happen due to initial validation, but just in case
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
    
  } catch (error: any) {
    console.error('Error in campaign matching endpoint:', error)
    return NextResponse.json(
      { error: `An error occurred: ${error.message}` },
      { status: 500 }
    )
  }
} 