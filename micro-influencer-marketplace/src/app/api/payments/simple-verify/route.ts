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
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
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

    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'payment_intent']
    });

    if (!stripeSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check payment status
    if (stripeSession.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }


    // Extract metadata
    const { campaignId, brandId, influencerId } = stripeSession.metadata || {};

    if (!campaignId || !influencerId) {
      return NextResponse.json(
        { error: 'Missing campaign or influencer information in session metadata' },
        { status: 400 }
      );
    }

    // Get payment amount
    let amount = 0;
    if (stripeSession.amount_total) {
      amount = stripeSession.amount_total / 100; // Convert from cents to dollars
    } else if (stripeSession.line_items?.data && stripeSession.line_items.data.length > 0) {
      // Try to get from line items
      const lineItem = stripeSession.line_items.data[0];
      amount = (lineItem.amount_total || 0) / 100;
    }

    // Calculate platform fee (10% of amount)
    const platformFee = Math.round(amount * 0.1 * 100) / 100; // Round to 2 decimal places

    // Extract payment intent ID
    const paymentIntentId = typeof stripeSession.payment_intent === 'string' 
      ? stripeSession.payment_intent 
      : stripeSession.payment_intent?.id;

    // Store transaction in the database
    let transactionId = null;
    let transactionError = null;
    try {
      const { data: transaction, error } = await supabase
        .from('payment_transactions')
        .insert({
          campaign_id: campaignId,
          brand_id: brandId,
          influencer_id: influencerId,
          amount: amount,
          platform_fee: platformFee,
          status: 'completed',
          stripe_payment_intent_id: paymentIntentId,
          stripe_transfer_id: null, // Will be set when funds are transferred to influencer
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error storing transaction:', error);
        transactionError = error;
      } else if (transaction) {
        transactionId = transaction.id;
      }
    } catch (error: any) {
      console.error('Error storing transaction:', error);
      transactionError = error;
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
        applicationUpdateStatus = false;
        applicationUpdateError = { message: 'No application found for this campaign and influencer' };
      } else {
        const { error: updateError } = await supabase
          .from('campaign_applications')
          .update({ status: 'approved_and_paid' })
          .eq('id', existingApplication.id);

        if (updateError) {
          console.error('Error updating application status:', updateError);
          applicationUpdateStatus = false;
          applicationUpdateError = updateError;
        } else {
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
      applicationUpdateError: applicationUpdateError ? applicationUpdateError.message : null,
      transactionCreated: transactionId !== null,
      transactionId,
      transactionError: transactionError ? transactionError.message : null
    });
  } catch (error: any) {
    console.error('Error verifying checkout session:', error);
    return NextResponse.json(
      { error: `An error occurred: ${error.message}` },
      { status: 500 }
    );
  }
} 