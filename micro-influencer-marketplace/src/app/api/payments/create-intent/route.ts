import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createCheckoutSession } from '@/lib/services/payment-service';

export async function POST(req: Request) {
  try {
    // Logging to debug request
    console.log('Create checkout session called');
    
    // Use Supabase auth instead of Clerk
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      console.log('Unauthorized: No user session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    console.log('User ID:', userId);
    
    let body;
    try {
      body = await req.json();
      console.log('Request body:', body);
    } catch (err) {
      console.error('Error parsing request body:', err);
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    const { campaignId, brandId, influencerId, amount } = body;

    // Validate required fields
    if (!campaignId || !brandId || !influencerId || !amount) {
      console.log('Missing required fields:', { campaignId, brandId, influencerId, amount });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify that the requesting user is the brand
    if (brandId !== userId) {
      console.log(`User mismatch: brandId=${brandId}, userId=${userId}`);
      return NextResponse.json(
        { error: 'Only the brand can create payments' },
        { status: 403 }
      );
    }

    // Get the host from the request headers to construct success/cancel URLs
    const host = req.headers.get('host');
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    
    console.log('Creating checkout session with:', {
      campaignId,
      brandId,
      influencerId,
      amount,
      successUrl: `${protocol}://${host}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${protocol}://${host}/payments/cancel`,
    });
    
    // Create checkout session
    const checkout = await createCheckoutSession({
      campaignId,
      brandId,
      influencerId,
      amount,
      successUrl: `${protocol}://${host}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${protocol}://${host}/payments/cancel`,
    });

    console.log('Checkout session created:', checkout);
    return NextResponse.json(checkout);
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    // Send more detailed error information
    return NextResponse.json(
      { 
        error: 'Error creating checkout session', 
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
      },
      { status: 500 }
    );
  }
} 