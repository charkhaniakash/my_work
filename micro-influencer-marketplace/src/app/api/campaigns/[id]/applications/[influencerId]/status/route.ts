import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; influencerId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    const { status } = body;

    if (!status || !['accepted', 'rejected', 'approved_and_paid'].includes(status)) {
      return NextResponse.json(
        { message: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Fetch the campaign to check ownership
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('brand_id')
      .eq('id', params.id)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { message: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Ensure the user is the brand owner
    if (campaign.brand_id !== session.user.id) {
      return NextResponse.json(
        { message: 'You are not authorized to update this application' },
        { status: 403 }
      );
    }

    // Update the application status
    const { data: updatedApplication, error: updateError } = await supabase
      .from('campaign_applications')
      .update({ status })
      .eq('campaign_id', params.id)
      .eq('influencer_id', params.influencerId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating application:', updateError);
      return NextResponse.json(
        { message: 'Failed to update application status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Application status updated successfully',
      application: updatedApplication
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { message: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
} 