import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { getTransactionHistory } from '@/lib/services/payment-service';

export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transactions = await getTransactionHistory(userId);
    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 