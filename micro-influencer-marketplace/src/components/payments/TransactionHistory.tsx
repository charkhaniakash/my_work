import React, { useState, useEffect } from 'react';

interface Transaction {
  id: string;
  amount: number;
  platform_fee: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  created_at: string;
  brand: { full_name: string };
  influencer: { full_name: string };
  campaign: { title: string };
}

const TransactionHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/payments/transactions');
      if (!res.ok) {
        throw new Error('Failed to fetch transaction history');
      }
      const data = await res.json();
      setTransactions(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'processing':
        return 'text-blue-600 bg-blue-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      case 'refunded':
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} ${years === 1 ? 'year' : 'years'} ago`;
    }
  };

  if (loading) {
    return <div className="text-gray-500">Loading transaction history...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-3">
        {error}
      </div>
    );
  }

  if (transactions.length === 0) {
    return <div className="text-gray-500">No transactions found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Transaction History</h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Campaign</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Amount</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Fee</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Status</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Date</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Brand</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Influencer</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">{transaction.campaign?.title || 'Unknown Campaign'}</td>
                <td className="px-4 py-3 text-sm font-medium">{formatAmount(transaction.amount)}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{formatAmount(transaction.platform_fee)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-1 text-xs rounded-md ${getStatusColor(
                      transaction.status
                    )}`}
                  >
                    {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600" title={new Date(transaction.created_at).toLocaleString()}>
                  {formatDate(transaction.created_at)}
                </td>
                <td className="px-4 py-3 text-sm">{transaction.brand?.full_name || 'Unknown Brand'}</td>
                <td className="px-4 py-3 text-sm">{transaction.influencer?.full_name || 'Unknown Influencer'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionHistory; 