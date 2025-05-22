import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(
  request: Request,
  { params }: { params: { id: string; influencerId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: campaignId, influencerId } = params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Validate status value
    const validStatuses = ['pending', 'approved', 'approved_and_paid', 'rejected', 'completed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Verify the user is the brand who owns the campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('brand_id')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    if (campaign.brand_id !== userId) {
      return NextResponse.json(
        { error: 'Not authorized to update this application' },
        { status: 403 }
      );
    }

    // Update application status
    const { data, error } = await supabase
      .from('campaign_applications')
      .update({ status })
      .match({
        campaign_id: campaignId,
        influencer_id: influencerId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating application:', error);
      return NextResponse.json(
        { error: 'Failed to update application status' },
        { status: 500 }
      );
    }

    // If status is approved_and_paid, update the campaign status to in_progress if it's not already
    if (status === 'approved_and_paid') {
      await supabase
        .from('campaigns')
        .update({ status: 'in_progress' })
        .eq('id', campaignId)
        .not('status', 'eq', 'in_progress');
    }

    // Notify the influencer about the status change
    await supabase.from('notifications').insert({
      user_id: influencerId,
      title: `Campaign application ${status}`,
      message: `Your application for campaign has been ${status.replace('_', ' ')}`,
      type: 'application_update',
      metadata: { campaign_id: campaignId, application_id: data.id },
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 