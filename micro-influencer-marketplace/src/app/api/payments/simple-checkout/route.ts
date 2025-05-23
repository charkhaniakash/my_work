import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Handle both GET (test) and POST (actual use from CampaignPayment)
export async function GET() {
  return createSimpleCheckout();
}

export async function POST(req: Request) {
  let body;
  try {
    body = await req.json();
    console.log('Simple checkout request body:', body);
  } catch (err) {
    console.error('Error parsing request body:', err);
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }

  return createSimpleCheckout(body);
}

async function createSimpleCheckout(params?: any) {
  try {
    // Check if Stripe API key is defined
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe API key is not defined in environment variables' },
        { status: 500 }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16' as any,
    });

    const host = typeof window !== 'undefined' ? window.location.host : 'localhost:3000';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';

    // Create line item based on the parameters
    const lineItem = {
      price_data: {
        currency: 'usd',
        product_data: {
          name: params?.campaignId ? `Campaign Payment (${params.campaignId})` : 'Test Product',
          description: params?.campaignId 
            ? `Payment for campaign ID: ${params.campaignId}` 
            : 'This is a test product',
        },
        unit_amount: params?.amount
          ? Math.round(params.amount * 100) // Convert to cents
          : 1000, // Default $10.00
      },
      quantity: 1,
    };

    // Log the metadata being passed
    console.log('Creating checkout session with metadata:', {
      campaignId: params?.campaignId || '',
      brandId: params?.brandId || '',
      influencerId: params?.influencerId || '',
    });

    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [lineItem],
      mode: 'payment',
      success_url: params?.successUrl || 
        `${protocol}://${host}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: params?.cancelUrl || 
        `${protocol}://${host}/payments/cancel`,
      metadata: {
        campaignId: params?.campaignId || '',
        brandId: params?.brandId || '',
        influencerId: params?.influencerId || '',
      },
    });

    // Return the checkout URL and session ID
    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id
    });
  } catch (error: any) {
    console.error('Simple checkout error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create simple checkout',
        message: error.message,
        type: error.type,
        code: error.code,
        statusCode: error.statusCode,
        detail: error.detail,
      },
      { status: 500 }
    );
  }
} 