import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
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

    // Get payment details from request
    const {
      campaign_id,
      brand_id,
      influencer_id,
      amount,
      payment_method,
      payment_details,
    } = await req.json();

    // Validate the request
    if (!campaign_id || !brand_id || !influencer_id || !amount) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Make sure the authenticated user is the brand making the payment
    if (session.user.id !== brand_id) {
      return NextResponse.json(
        { message: 'You are not authorized to make this payment' },
        { status: 403 }
      );
    }

    // Create a transaction record
    const { data: transaction, error } = await supabase
      .from('payment_transactions')
      .insert({
        campaign_id,
        payer_id: brand_id,
        payee_id: influencer_id,
        amount,
        status: 'completed',
        payment_method,
        payment_details,
      })
      .select()
      .single();

    if (error) {
      console.error('Transaction error:', error);
      return NextResponse.json(
        { message: 'Failed to record transaction' },
        { status: 500 }
      );
    }

    // Update the campaign application status
    const { error: applicationError } = await supabase
      .from('campaign_applications')
      .update({ status: 'approved_and_paid' })
      .eq('campaign_id', campaign_id)
      .eq('influencer_id', influencer_id);

    if (applicationError) {
      console.error('Failed to update application status:', applicationError);
      // Don't fail the request, just log the error
    }

    // Return the transaction data
    return NextResponse.json({
      message: 'Payment processed successfully',
      transaction,
    });
  } catch (error) {
    console.error('Payment processing error:', error);
    return NextResponse.json(
      { message: 'An error occurred while processing the payment' },
      { status: 500 }
    );
  }
} 