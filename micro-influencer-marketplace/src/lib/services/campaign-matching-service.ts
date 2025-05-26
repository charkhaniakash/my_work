import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Define match criteria and scoring weights
const WEIGHTS = {
  niche: 0.4,
  location: 0.3,
  audience: 0.2,
  engagement: 0.1,
}

interface InfluencerProfile {
  id: string
  niches: string[]
  location?: string
  audience_size?: number
  engagement_rate?: number
  metrics?: {
    followers?: number
    average_likes?: number
    average_comments?: number
  }
  [key: string]: any
}

interface Campaign {
  id: string
  title: string
  description: string
  target_niche: string[]
  target_location?: string
  target_audience_size?: {
    min?: number
    max?: number
  }
  requirements?: string
  [key: string]: any
}

export interface CampaignMatch {
  campaignId: string
  influencerId: string
  campaignTitle: string
  matchScore: number
  matchDetails: {
    nicheScore: number
    locationScore: number
    audienceScore: number
    engagementScore: number
  }
}

/**
 * Calculates a match score between an influencer and a campaign based on various criteria
 * 
 * @param influencer The influencer profile
 * @param campaign The campaign details
 * @returns A match score between 0-100
 */
export const calculateMatchScore = (
  influencer: InfluencerProfile, 
  campaign: Campaign
): CampaignMatch => {
  // Calculate niche match - how many of the campaign niches match influencer niches
  const influencerNiches = influencer.niches || []
  const campaignNiches = campaign.target_niche || []
  
  let nicheMatches = 0
  if (campaignNiches.length > 0 && influencerNiches.length > 0) {
    campaignNiches.forEach(niche => {
      if (influencerNiches.includes(niche)) {
        nicheMatches++
      }
    })
  }
  // Normalize to 0-1 scale based on percentage of matches
  const nicheScore = campaignNiches.length > 0 
    ? nicheMatches / campaignNiches.length 
    : 0

  // Calculate location match (exact match or no match)
  const locationScore = (!campaign.target_location || !influencer.location) 
    ? 0.5 // Neutral if either is not specified
    : campaign.target_location.toLowerCase() === influencer.location.toLowerCase()
      ? 1 // Perfect match
      : 0 // No match

  // Calculate audience size match (if target is specified)
  let audienceScore = 0.5 // Default neutral
  if (campaign.target_audience_size && influencer.audience_size) {
    const { min, max } = campaign.target_audience_size
    
    if (min !== undefined && max !== undefined) {
      // Full range specified
      if (influencer.audience_size >= min && influencer.audience_size <= max) {
        audienceScore = 1 // Perfect match
      } else if (influencer.audience_size < min) {
        // Smaller audience than desired
        audienceScore = Math.max(0, influencer.audience_size / min) 
      } else {
        // Larger audience than desired
        audienceScore = Math.max(0, 1 - ((influencer.audience_size - max) / max))
      }
    } else if (min !== undefined) {
      // Only minimum specified
      audienceScore = influencer.audience_size >= min ? 1 : Math.max(0, influencer.audience_size / min)
    } else if (max !== undefined) {
      // Only maximum specified
      audienceScore = influencer.audience_size <= max ? 1 : Math.max(0, 1 - ((influencer.audience_size - max) / max))
    }
  }

  // Calculate engagement score
  let engagementScore = 0.5 // Default neutral
  if (influencer.engagement_rate) {
    // Higher engagement is generally better
    engagementScore = Math.min(1, influencer.engagement_rate / 0.05) // 5% engagement considered excellent
  } else if (influencer.metrics?.followers && 
             (influencer.metrics?.average_likes || influencer.metrics?.average_comments)) {
    // Calculate engagement from metrics if available
    const interactions = (influencer.metrics.average_likes || 0) + (influencer.metrics.average_comments || 0)
    const calculatedRate = interactions / influencer.metrics.followers
    engagementScore = Math.min(1, calculatedRate / 0.05)
  }

  // Calculate final weighted score
  const matchDetails = {
    nicheScore,
    locationScore,
    audienceScore,
    engagementScore
  }
  
  const weightedScore = 
    (nicheScore * WEIGHTS.niche) +
    (locationScore * WEIGHTS.location) +
    (audienceScore * WEIGHTS.audience) +
    (engagementScore * WEIGHTS.engagement)

  // Convert to a 0-100 scale
  const matchScore = Math.round(weightedScore * 100)

  return {
    campaignId: campaign.id,
    influencerId: influencer.id,
    campaignTitle: campaign.title,
    matchScore,
    matchDetails
  }
}

/**
 * Finds suitable campaigns for a specific influencer
 */
export const findMatchingCampaigns = async (
  influencerId: string,
  minMatchScore: number = 60
): Promise<CampaignMatch[]> => {
  const supabase = createClientComponentClient()

  try {
    // First fetch influencer profile
    const { data: influencer, error: influencerError } = await supabase
      .from('users')
      .select('*, profile:influencer_profiles(*)')
      .eq('id', influencerId)
      .single()

    if (influencerError) throw influencerError
    if (!influencer) throw new Error('Influencer not found')

    // Convert to the format expected by the matching algorithm
    const influencerProfile: InfluencerProfile = {
      id: influencer.id,
      niches: influencer.profile?.niches || [],
      location: influencer.profile?.location,
      audience_size: influencer.profile?.audience_size,
      engagement_rate: influencer.profile?.engagement_rate,
      metrics: {
        followers: influencer.profile?.followers_count,
        average_likes: influencer.profile?.avg_likes,
        average_comments: influencer.profile?.avg_comments
      }
    }

    // Fetch active campaigns
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('status', 'active')

    if (campaignsError) throw campaignsError
    if (!campaigns || campaigns.length === 0) return []

    // Check for existing applications to avoid recommending already applied campaigns
    const { data: applications } = await supabase
      .from('campaign_applications')
      .select('campaign_id')
      .eq('influencer_id', influencerId)

    const appliedCampaignIds = applications?.map(app => app.campaign_id) || []

    // Calculate match scores for each campaign and filter by minimum score
    const matches: CampaignMatch[] = campaigns
      .filter(campaign => !appliedCampaignIds.includes(campaign.id)) // Filter out already applied campaigns
      .map(campaign => calculateMatchScore(influencerProfile, campaign))
      .filter(match => match.matchScore >= minMatchScore)
      .sort((a, b) => b.matchScore - a.matchScore) // Sort by highest score first

    return matches
  } catch (error) {
    console.error('Error finding matching campaigns:', error)
    return []
  }
}

/**
 * Finds suitable influencers for a specific campaign
 */
export const findMatchingInfluencers = async (
  campaignId: string,
  minMatchScore: number = 60
): Promise<CampaignMatch[]> => {
  const supabase = createClientComponentClient()

  try {
    // First fetch campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (campaignError) throw campaignError
    if (!campaign) throw new Error('Campaign not found')

    // Fetch all influencer profiles
    const { data: influencers, error: influencersError } = await supabase
      .from('users')
      .select('*, profile:influencer_profiles(*)')
      .eq('role', 'influencer')

    if (influencersError) throw influencersError
    if (!influencers || influencers.length === 0) return []

    // Check for existing applications to avoid recommending already applied influencers
    const { data: applications } = await supabase
      .from('campaign_applications')
      .select('influencer_id')
      .eq('campaign_id', campaignId)

    const appliedInfluencerIds = applications?.map(app => app.influencer_id) || []

    // Calculate match scores for each influencer and filter by minimum score
    const matches: CampaignMatch[] = influencers
      .filter(influencer => !appliedInfluencerIds.includes(influencer.id)) // Filter out already applied influencers
      .map(influencer => {
        const influencerProfile: InfluencerProfile = {
          id: influencer.id,
          niches: influencer.profile?.niches || [],
          location: influencer.profile?.location,
          audience_size: influencer.profile?.audience_size,
          engagement_rate: influencer.profile?.engagement_rate,
          metrics: {
            followers: influencer.profile?.followers_count,
            average_likes: influencer.profile?.avg_likes,
            average_comments: influencer.profile?.avg_comments
          }
        }
        return calculateMatchScore(influencerProfile, campaign)
      })
      .filter(match => match.matchScore >= minMatchScore)
      .sort((a, b) => b.matchScore - a.matchScore) // Sort by highest score first

    return matches
  } catch (error) {
    console.error('Error finding matching influencers:', error)
    return []
  }
} 