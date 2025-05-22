import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const campaignId = params.id;
    
    // Fetch campaign details
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (error) {
      console.error('Error fetching campaign:', error);
      return NextResponse.json(
        { error: 'Failed to fetch campaign' },
        { status: 500 }
      );
    }

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Check if user is authorized to view this campaign
    // Either the user is the brand owner or an influencer with an application
    const isOwner = campaign.brand_id === userId;
    
    if (!isOwner) {
      const { data: application, error: appError } = await supabase
        .from('campaign_applications')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('influencer_id', userId)
        .single();

      if (appError || !application) {
        return NextResponse.json(
          { error: 'Not authorized to view this campaign' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 