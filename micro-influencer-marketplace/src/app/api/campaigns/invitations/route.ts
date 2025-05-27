import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createInvitationNotificationAdmin, createInvitationResponseNotificationAdmin } from '@/lib/services/notification-service'

// Initialize Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
)

// POST: Create a new invitation
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { campaignId, influencerId, customMessage, proposedRate } = body
    
    // Authorization check
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Verify campaign ownership
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('brand_id, title')
      .eq('id', campaignId)
      .single()
    
    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }
    
    if (campaign.brand_id !== user.id) {
      return NextResponse.json({ error: 'You do not own this campaign' }, { status: 403 })
    }
    
    // Check if the influencer exists
    const { data: influencer, error: influencerError } = await supabase
      .from('users')
      .select('role, full_name')
      .eq('id', influencerId)
      .eq('role', 'influencer')
      .single()
      
    if (influencerError || !influencer) {
      return NextResponse.json({ error: 'Influencer not found' }, { status: 404 })
    }
    
    // Check if invitation already exists
    const { data: existingInvitation, error: invitationError } = await supabase
      .from('campaign_invitations')
      .select('id, status')
      .eq('campaign_id', campaignId)
      .eq('influencer_id', influencerId)
      .maybeSingle()
    
    if (existingInvitation) {
      if (existingInvitation.status === 'pending') {
        return NextResponse.json({ 
          error: 'Invitation already sent', 
          invitation: existingInvitation 
        }, { status: 409 })
      } else if (existingInvitation.status === 'accepted') {
        return NextResponse.json({ 
          error: 'Influencer has already accepted an invitation to this campaign', 
          invitation: existingInvitation 
        }, { status: 409 })
      } else if (existingInvitation.status === 'declined') {
        // If declined, allow resending as a new invitation
        const { data: updatedInvitation, error: updateError } = await supabase
          .from('campaign_invitations')
          .update({ 
            status: 'pending', 
            custom_message: customMessage,
            proposed_rate: proposedRate,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingInvitation.id)
          .select()
          .single()
        
        if (updateError) {
          console.error('Error updating invitation:', updateError)
          return NextResponse.json({ error: 'Failed to update invitation' }, { status: 500 })
        }
        
        // Send notification to the influencer
        await createInvitationNotificationAdmin(
          influencerId, 
          user.id,
          user.user_metadata?.full_name || 'A brand',
          campaign.title,
          campaignId
        )
        
        return NextResponse.json({ invitation: updatedInvitation })
      }
    }
    
    // Create new invitation
    const { data: newInvitation, error: createError } = await supabase
      .from('campaign_invitations')
      .insert({
        campaign_id: campaignId,
        brand_id: user.id,
        influencer_id: influencerId,
        status: 'pending',
        custom_message: customMessage,
        proposed_rate: proposedRate
      })
      .select()
      .single()
    
    if (createError) {
      console.error('Error creating invitation:', createError)
      return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 })
    }
    
    // Send notification to the influencer
    await createInvitationNotificationAdmin(
      influencerId,
      user.id,
      user.user_metadata?.full_name || 'A brand',
      campaign.title,
      campaignId
    )
    
    return NextResponse.json({ invitation: newInvitation })
  } catch (error: any) {
    console.error('Error in invitation creation:', error)
    return NextResponse.json(
      { error: `An error occurred: ${error.message}` },
      { status: 500 }
    )
  }
}

// GET: List or retrieve invitations
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const campaignId = url.searchParams.get('campaignId')
    const influencerId = url.searchParams.get('influencerId')
    const status = url.searchParams.get('status')
    const invitationId = url.searchParams.get('id')
    const limit = url.searchParams.get('limit')
    
    // Authorization check
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // If specific invitation is requested
    if (invitationId) {
      const { data: invitation, error: invitationError } = await supabase
        .from('campaign_invitations')
        .select(`
          *,
          campaign:campaigns(*),
          brand:brand_id(id, full_name, avatar_url),
          influencer:influencer_id(id, full_name, avatar_url)
        `)
        .eq('id', invitationId)
        .single()
      
      if (invitationError || !invitation) {
        return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
      }
      
      // Check authorization - user must be either brand or influencer
      if (invitation.brand_id !== user.id && invitation.influencer_id !== user.id) {
        return NextResponse.json({ error: 'Not authorized to view this invitation' }, { status: 403 })
      }
      
      return NextResponse.json({ invitation })
    }
    
    // Start building the query
    let query = supabase
      .from('campaign_invitations')
      .select(`
        *,
        campaign:campaigns(id, title, budget, start_date, end_date),
        brand:brand_id(id, full_name, avatar_url),
        influencer:influencer_id(id, full_name, avatar_url)
      `)
    
    // Apply filters
    if (campaignId) {
      query = query.eq('campaign_id', campaignId)
      
      // If filtering by campaign, ensure the user owns the campaign
      if (!influencerId) {
        const { data: campaign } = await supabase
          .from('campaigns')
          .select('brand_id')
          .eq('id', campaignId)
          .single()
        
        if (!campaign || campaign.brand_id !== user.id) {
          return NextResponse.json({ error: 'Not authorized to view invitations for this campaign' }, { status: 403 })
        }
      }
    }
    
    // User can only see their own invitations
    if (user.user_metadata?.role === 'brand') {
      query = query.eq('brand_id', user.id)
    } else if (user.user_metadata?.role === 'influencer') {
      query = query.eq('influencer_id', user.id)
    }
    
    // Apply additional filters
    if (influencerId) {
      query = query.eq('influencer_id', influencerId)
    }
    
    if (status) {
      query = query.eq('status', status)
    }
    
    // Sort by creation date
    query = query.order('created_at', { ascending: false })
    
    // Apply limit if specified
    if (limit) {
      const limitNumber = parseInt(limit, 10)
      if (!isNaN(limitNumber) && limitNumber > 0) {
        query = query.limit(limitNumber)
      }
    }
    
    const { data: invitations, error: listError } = await query
    
    if (listError) {
      console.error('Error listing invitations:', listError)
      return NextResponse.json({ error: 'Failed to list invitations' }, { status: 500 })
    }
    
    return NextResponse.json({ invitations })
  } catch (error: any) {
    console.error('Error in invitation listing:', error)
    return NextResponse.json(
      { error: `An error occurred: ${error.message}` },
      { status: 500 }
    )
  }
}

// PATCH: Update invitation status
export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { invitationId, status, pitch, proposedRate } = body
    
    // Authorization check
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('campaign_invitations')
      .select('*, campaign:campaigns(*)')
      .eq('id', invitationId)
      .single()

    if (invitationError || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    // Verify the user is the influencer
    if (invitation.influencer_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized to update this invitation' }, { status: 403 })
    }

    // Update the invitation status and custom message/rate if provided
    const updateData: any = { 
      status,
      updated_at: new Date().toISOString()
    }
    
    // If accepting and pitch/rate provided, update those fields
    if (status === 'accepted') {
      if (pitch) updateData.custom_message = pitch
      if (proposedRate !== undefined) updateData.proposed_rate = proposedRate
    }
    
    const { data: updatedInvitation, error: updateError } = await supabase
      .from('campaign_invitations')
      .update(updateData)
      .eq('id', invitationId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating invitation:', updateError)
      return NextResponse.json({ error: 'Failed to update invitation' }, { status: 500 })
    }

    // Send notification to the brand
    await createInvitationResponseNotificationAdmin(
      invitation.brand_id,
      user.id,
      user.user_metadata?.full_name || 'An influencer',
      invitation.campaign.title,
      invitation.campaign.id,
      status
    )

    return NextResponse.json({ invitation: updatedInvitation })
  } catch (error: any) {
    console.error('Error updating invitation:', error)
    return NextResponse.json(
      { error: `An error occurred: ${error.message}` },
      { status: 500 }
    )
  }
} 