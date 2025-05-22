import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { confirmPayment } from '@/lib/services/payment-service';

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { paymentIntentId } = body;

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      );
    }

    // Confirm the payment
    const paymentIntent = await confirmPayment(paymentIntentId);

    return NextResponse.json({ status: paymentIntent.status });
  } catch (error) {
    console.error('Error confirming payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 