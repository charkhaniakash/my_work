import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any,
});

// Initialize Supabase client with service role key for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    // Get the session_id from the URL
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing session ID' },
        { status: 400 }
      );
    }

    console.log(`Verifying Stripe session: ${sessionId}`);

    // Verify the session with Stripe
    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);

    if (!stripeSession) {
      console.log('Session not found');
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check payment status
    if (stripeSession.payment_status !== 'paid') {
      console.log(`Payment not completed: ${stripeSession.payment_status}`);
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    console.log('Payment verified as paid');

    // Extract metadata
    const { campaignId, influencerId } = stripeSession.metadata || {};

    if (!campaignId || !influencerId) {
      console.log('Missing metadata:', stripeSession.metadata);
      return NextResponse.json(
        { error: 'Missing campaign or influencer information in session metadata' },
        { status: 400 }
      );
    }

    let applicationUpdateStatus = true;
    let applicationUpdateError = null;

    try {
      // First check if the application exists
      const { data: existingApplication, error: checkError } = await supabase
        .from('campaign_applications')
        .select('id, status')
        .eq('campaign_id', campaignId)
        .eq('influencer_id', influencerId)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking application existence:', checkError);
        applicationUpdateStatus = false;
        applicationUpdateError = checkError;
      } else if (!existingApplication) {
        console.log('No application found for this campaign and influencer');
        applicationUpdateStatus = false;
        applicationUpdateError = { message: 'No application found for this campaign and influencer' };
      } else {
        console.log(`Found application with ID ${existingApplication.id}, current status: ${existingApplication.status}`);
        
        // Update application status to 'approved_and_paid'
        const { error: updateError } = await supabase
          .from('campaign_applications')
          .update({ status: 'approved_and_paid' })
          .eq('id', existingApplication.id);

        if (updateError) {
          console.error('Error updating application status:', updateError);
          applicationUpdateStatus = false;
          applicationUpdateError = updateError;
        } else {
          console.log('Application status updated successfully');
        }
      }
    } catch (dbError: any) {
      console.error('Database operation failed:', dbError);
      applicationUpdateStatus = false;
      applicationUpdateError = dbError;
    }

    // Always mark payment as verified, even if application update fails
    return NextResponse.json({ 
      success: true, 
      message: applicationUpdateStatus 
        ? 'Payment verification successful and application status updated'
        : 'Payment verification successful but application status update failed',
      sessionId: stripeSession.id,
      paymentStatus: stripeSession.payment_status,
      campaignId,
      influencerId,
      applicationUpdateStatus,
      applicationUpdateError: applicationUpdateError ? applicationUpdateError.message : null
    });
  } catch (error: any) {
    console.error('Error verifying checkout session:', error);
    return NextResponse.json(
      { error: `An error occurred: ${error.message}` },
      { status: 500 }
    );
  }
} 