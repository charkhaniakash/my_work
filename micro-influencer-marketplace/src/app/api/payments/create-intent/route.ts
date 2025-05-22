import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createPaymentIntent } from '@/lib/services/payment-service';

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { campaignId, brandId, influencerId, amount } = body;

    // Validate required fields
    if (!campaignId || !brandId || !influencerId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify that the requesting user is the brand
    if (brandId !== userId) {
      return NextResponse.json(
        { error: 'Only the brand can create payments' },
        { status: 403 }
      );
    }

    // Create payment intent
    const paymentIntent = await createPaymentIntent({
      campaignId,
      brandId,
      influencerId,
      amount,
    });

    return NextResponse.json(paymentIntent);
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 