import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import {
  getPaymentMethods,
  addPaymentMethod,
  setDefaultPaymentMethod,
} from '@/lib/services/payment-service';

// GET /api/payments/methods - Get user's payment methods
export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const paymentMethods = await getPaymentMethods(userId);
    return NextResponse.json(paymentMethods);
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/payments/methods - Add a new payment method
export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { paymentMethodId } = body;

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'Payment method ID is required' },
        { status: 400 }
      );
    }

    const paymentMethod = await addPaymentMethod(userId, paymentMethodId);
    return NextResponse.json(paymentMethod);
  } catch (error) {
    console.error('Error adding payment method:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/payments/methods/default - Set default payment method
export async function PUT(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { paymentMethodId } = body;

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'Payment method ID is required' },
        { status: 400 }
      );
    }

    const paymentMethod = await setDefaultPaymentMethod(userId, paymentMethodId);
    return NextResponse.json(paymentMethod);
  } catch (error) {
    console.error('Error setting default payment method:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 