'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/lib/providers/supabase-provider';
import { toast } from 'react-hot-toast';
import { DollarSign, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Transaction {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  created_at: string;
  brand?: {
    full_name: string;
    id: string;
  };
  influencer?: {
    full_name: string;
    id: string;
  };
  campaign?: {
    title: string;
    id: string;
  };
}

interface RecentTransactionsProps {
  limit?: number;
}

export function RecentTransactions({ limit = 5 }: RecentTransactionsProps) {
  const { supabase, user } = useSupabase();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user]);

  const loadTransactions = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get transactions based on user role
      const { data, error } = await supabase
        .from('payment_transactions')
        .select(`
          *,
          brand:brand_id(full_name, id),
          influencer:influencer_id(full_name, id),
          campaign:campaign_id(title, id)
        `)
        .eq(user.user_metadata?.role === 'brand' ? 'brand_id' : 'influencer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };
  
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-md"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Recent Transactions
        </h3>
        <p className="text-gray-500">
          No transactions found.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Recent Transactions
        </h3>
        <Link
          href="/dashboard/transactions"
          className="text-sm text-indigo-600 hover:text-indigo-500"
        >
          View All <ArrowRight className="inline h-4 w-4 ml-1" />
        </Link>
      </div>
      
      <div className="space-y-3">
        {transactions.map((transaction) => (
          <Link
            key={transaction.id}
            href={`/dashboard/transactions/${transaction.id}`}
            className="flex items-center justify-between border border-gray-200 rounded-md p-3 hover:bg-gray-50"
          >
            <div>
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-gray-400 mr-2" />
                <span className="font-medium text-gray-900">
                  {transaction.campaign?.title || 'Payment'}
                </span>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {user?.user_metadata?.role === 'brand' 
                  ? `To: ${transaction.influencer?.full_name}`
                  : `From: ${transaction.brand?.full_name}`
                }
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium text-gray-900">
                {formatCurrency(transaction.amount)}
              </div>
              <div className="text-sm">
                <span className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                  transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                  transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  transaction.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                  transaction.status === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 