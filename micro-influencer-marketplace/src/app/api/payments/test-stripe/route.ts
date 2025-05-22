import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function GET() {
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

    // Try to make a simple API call to verify the key works
    const paymentMethods = await stripe.paymentMethods.list({
      limit: 1,
    });

    return NextResponse.json({
      success: true,
      message: 'Stripe API connection successful',
      stripeKeyDefined: !!process.env.STRIPE_SECRET_KEY,
      validConnection: true,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Stripe API connection failed',
        message: error.message,
        stripeKeyDefined: !!process.env.STRIPE_SECRET_KEY,
        validConnection: false,
      },
      { status: 500 }
    );
  }
} 