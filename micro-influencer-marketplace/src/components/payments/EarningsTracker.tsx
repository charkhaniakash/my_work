import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

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

interface EarningStats {
  total: number;
  fees: number;
  net: number;
  avgPerTransaction: number;
  transactionCount: number;
  uniqueCampaignCount: number;
  monthlyAverages?: Array<{
    month: string;
    total: number;
    average: number;
    count: number;
  }>;
}

interface EarningsPeriod {
  period: string;
  earnings: number;
  platformFee: number;
  netEarnings: number;
  completedTransactions: number;
}

interface MonthlyEarnings {
  month: string;
  amount: number;
}

interface EarningsTrackerProps {
  userId?: string; // Optional - if not provided, will use current user
}

const EarningsTracker: React.FC<EarningsTrackerProps> = ({ userId }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<EarningStats | null>(null);
  const [summary, setSummary] = useState<{
    totalEarnings: number;
    totalFees: number;
    netEarnings: number;
    pendingAmount: number;
  }>({
    totalEarnings: 0,
    totalFees: 0,
    netEarnings: 0,
    pendingAmount: 0,
  });
  const [periods, setPeriods] = useState<EarningsPeriod[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyEarnings[]>([]);

  console.log("summary", periods)
  useEffect(() => {
    const actualUserId = userId || user?.id;
    
    if (actualUserId) {
      fetchEarningsData(actualUserId);
    }
  }, [user, userId]);

  const fetchEarningsData = async (userId: string) => {
    try {
      setLoading(true);
      // Fetch transactions for the user, specifically for their role as an influencer
      const res = await fetch(`/api/payments/earnings?userId=${userId}`);
      
      console.log('Response status:', res.status);
      console.log('Response headers:', Object.fromEntries(res.headers.entries()));
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch earnings data');
      }
      
      const data = await res.json();
      console.log('API response data:', data);
      
      // Save the actual transactions
      setTransactions(data.transactions || []);
      
      // Save the stats if available
      if (data.stats && !data.stats.error) {
        console.log('Using stats from API:', data.stats);
        setStats(data.stats);
        
        // Update summary with stats data if available
        setSummary({
          totalEarnings: data.stats.total || 0,
          totalFees: data.stats.fees || 0,
          netEarnings: data.stats.net || 0,
          pendingAmount: calculatePendingAmount(data.transactions || [])
        });
      } else {
        console.log('Processing transactions directly:', data.transactions?.length || 0, 'transactions');
        // Process the data for display directly from transactions
        processEarningsData(data.transactions || []);
      }
      
      setError(null);
    } catch (err: any) {
      console.error('Earnings data fetch error:', err);
      setError(err.message || 'Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };
  
  const calculatePendingAmount = (transactions: Transaction[]): number => {
    return transactions
      .filter(t => t.status === 'pending' || t.status === 'processing')
      .reduce((sum, t) => sum + Number(t.amount), 0);
  };

  const processEarningsData = (transactions: Transaction[]) => {
    console.log('Processing earnings data from', transactions.length, 'transactions');
    
    // Log raw transaction data for debugging
    console.log('Raw transactions:', transactions.map(t => ({
      id: t.id,
      amount: t.amount,
      created_at: t.created_at,
      status: t.status
    })));
    
    // Calculate overall summary
    const completed = transactions.filter(t => t.status === 'completed');
    console.log('Found', completed.length, 'completed transactions');
    
    const pending = transactions.filter(t => t.status === 'pending' || t.status === 'processing');
    
    const totalEarnings = completed.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalFees = completed.reduce((sum, t) => sum + Number(t.platform_fee), 0);
    const netEarnings = totalEarnings - totalFees;
    const pendingAmount = pending.reduce((sum, t) => sum + Number(t.amount), 0);
    
    setSummary({
      totalEarnings,
      totalFees,
      netEarnings,
      pendingAmount
    });

    // Process period data (this year, last month, this month)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    console.log('Current date for comparison:', {
      date: now.toISOString(),
      year: currentYear,
      month: currentMonth
    });

    // Create default periods even if there's no data
    const defaultPeriods: EarningsPeriod[] = [
      {
        period: 'This Month',
        earnings: 0,
        platformFee: 0,
        netEarnings: 0,
        completedTransactions: 0,
      },
      {
        period: 'Last Month',
        earnings: 0,
        platformFee: 0,
        netEarnings: 0,
        completedTransactions: 0,
      },
      {
        period: 'This Year',
        earnings: 0,
        platformFee: 0,
        netEarnings: 0,
        completedTransactions: 0,
      }
    ];
    
    // If we have no transactions, use the default periods
    if (completed.length === 0) {
      setPeriods(defaultPeriods);
      setMonthlyData([]);
      return;
    }

    // Log date parsing for all transactions to debug
    console.log('Transaction date parsing:');
    completed.forEach((t, idx) => {
      try {
        const date = new Date(t.created_at);
        console.log(`Transaction ${idx} (${t.id}):`, {
          raw: t.created_at,
          parsed: date.toISOString(),
          year: date.getFullYear(),
          month: date.getMonth(),
          valid: !isNaN(date.getTime())
        });
      } catch (err) {
        console.error(`Error parsing date for transaction ${idx} (${t.id}):`, t.created_at, err);
      }
    });

    // Manually fix any potentially invalid dates
    const fixDates = (transactions: Transaction[]) => {
      return transactions.map(t => {
        if (!t.created_at) {
          console.warn(`Transaction ${t.id} has no created_at date, using current date`);
          return {...t, created_at: new Date().toISOString()};
        }
        
        try {
          // Test if date is valid
          const testDate = new Date(t.created_at);
          if (isNaN(testDate.getTime())) {
            console.warn(`Transaction ${t.id} has invalid date: ${t.created_at}, using current date`);
            return {...t, created_at: new Date().toISOString()};
          }
          return t;
        } catch (e) {
          console.warn(`Error processing date for transaction ${t.id}, using current date`);
          return {...t, created_at: new Date().toISOString()};
        }
      });
    };
    
    // Make sure we have valid dates
    const validTransactions = fixDates(completed);

    // This year's data - with better error handling
    const thisYearTransactions = validTransactions.filter(t => {
      try {
        const date = new Date(t.created_at);
        return date.getFullYear() === currentYear;
      } catch {
        return false;
      }
    });
    console.log('This year transactions:', thisYearTransactions.length);
    
    // This month's data - with better error handling
    const thisMonthTransactions = validTransactions.filter(t => {
      try {
        const date = new Date(t.created_at);
        return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
      } catch {
        return false;
      }
    });
    console.log('This month transactions:', thisMonthTransactions.length);
    
    // Last month's data - with better error handling
    const lastMonthDate = new Date(now);
    lastMonthDate.setMonth(currentMonth - 1);
    const lastMonthYear = lastMonthDate.getFullYear();
    const lastMonth = lastMonthDate.getMonth();
    
    const lastMonthTransactions = validTransactions.filter(t => {
      try {
        const date = new Date(t.created_at);
        return date.getFullYear() === lastMonthYear && date.getMonth() === lastMonth;
      } catch {
        return false;
      }
    });
    console.log('Last month transactions:', lastMonthTransactions.length);

    // Calculate period summaries - ensure we have at least empty periods
    const periods: EarningsPeriod[] = [
      {
        period: 'This Month',
        earnings: thisMonthTransactions.reduce((sum, t) => sum + Number(t.amount), 0),
        platformFee: thisMonthTransactions.reduce((sum, t) => sum + Number(t.platform_fee), 0),
        netEarnings: thisMonthTransactions.reduce((sum, t) => sum + Number(t.amount) - Number(t.platform_fee), 0),
        completedTransactions: thisMonthTransactions.length,
      },
      {
        period: 'Last Month',
        earnings: lastMonthTransactions.reduce((sum, t) => sum + Number(t.amount), 0),
        platformFee: lastMonthTransactions.reduce((sum, t) => sum + Number(t.platform_fee), 0),
        netEarnings: lastMonthTransactions.reduce((sum, t) => sum + Number(t.amount) - Number(t.platform_fee), 0),
        completedTransactions: lastMonthTransactions.length,
      },
      {
        period: 'This Year',
        earnings: thisYearTransactions.reduce((sum, t) => sum + Number(t.amount), 0),
        platformFee: thisYearTransactions.reduce((sum, t) => sum + Number(t.platform_fee), 0),
        netEarnings: thisYearTransactions.reduce((sum, t) => sum + Number(t.amount) - Number(t.platform_fee), 0),
        completedTransactions: thisYearTransactions.length,
      }
    ];
    
    console.log('Generated periods:', periods);
    setPeriods(periods);
    
    // Generate monthly data for the chart - with better error handling
    if (stats?.monthlyAverages && stats.monthlyAverages.length > 0) {
      // Use the pre-calculated monthly data from stats
      const monthlyData = stats.monthlyAverages.map(item => ({
        month: formatMonthDisplay(item.month),
        amount: item.total
      }));
      console.log('Using monthly data from stats:', monthlyData);
      setMonthlyData(monthlyData);
    } else {
      // Calculate from transactions if stats not available
      const monthlyMap = new Map<string, number>();
      
      // Initialize all months with zero for the last 6 months
      for (let i = 0; i < 6; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthlyMap.set(monthKey, 0);
      }
      
      // Fill in actual data - with better error handling
      validTransactions.forEach(transaction => {
        try {
          const date = new Date(transaction.created_at);
          if (isNaN(date.getTime())) {
            console.warn('Skipping transaction with invalid date:', transaction.id, transaction.created_at);
            return;
          }
          
          // Only consider last 6 months
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
          
          if (date >= sixMonthsAgo) {
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const currentAmount = monthlyMap.get(monthKey) || 0;
            monthlyMap.set(monthKey, currentAmount + Number(transaction.amount) - Number(transaction.platform_fee));
          }
        } catch (err) {
          console.error('Error processing transaction for monthly data:', transaction.id, err);
        }
      });
      
      // Convert map to array and sort by date
      const monthlyData = Array.from(monthlyMap.entries())
        .map(([month, amount]) => ({ 
          month: formatMonthDisplay(month), 
          amount
        }))
        .sort((a, b) => a.month.localeCompare(b.month));
      
      console.log('Generated monthly data:', monthlyData);  
      setMonthlyData(monthlyData);
    }
  };
  
  const formatMonthDisplay = (dateKey: string) => {
    // Handle format from stats API (YYYY-MM) or from our calculation
    const [year, month] = dateKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleString('default', { month: 'short', year: '2-digit' });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return <div className="text-gray-500">Loading earnings data...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-3">
        {error}
      </div>
    );
  }

  // Check if we have any data to display
  if (!transactions.length && !stats) {
    return <div className="text-gray-500">No earnings data available.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Summary Cards */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Total Earnings</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{formatCurrency(summary.totalEarnings)}</dd>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Platform Fees</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{formatCurrency(summary.totalFees)}</dd>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Net Earnings</dt>
            <dd className="mt-1 text-3xl font-semibold text-green-600">{formatCurrency(summary.netEarnings)}</dd>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Pending Payments</dt>
            <dd className="mt-1 text-3xl font-semibold text-blue-600">{formatCurrency(summary.pendingAmount)}</dd>
          </div>
        </div>
      </div>

      {/* Stats Overview (if available) */}
      {stats && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Performance Overview</h3>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Completed Payments</dt>
                <dd className="mt-1 text-sm text-gray-900">{stats.transactionCount}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Average Per Transaction</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatCurrency(stats.avgPerTransaction)}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Unique Campaigns</dt>
                <dd className="mt-1 text-sm text-gray-900">{stats.uniqueCampaignCount}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {/* Monthly Chart */}
      {monthlyData.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Monthly Earnings</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Your earnings over the last 6 months</p>
          </div>
          <div className="p-6">
            {/* Simple bar chart visualization */}
            <div className="flex items-end h-64 space-x-2">
              {monthlyData.map(({ month, amount }) => {
                const maxValue = Math.max(...monthlyData.map(d => d.amount));
                const heightPercent = maxValue > 0 ? (amount / maxValue) * 100 : 0;
                
                return (
                  <div key={month} className="flex flex-col items-center flex-1">
                    <div className="w-full bg-indigo-100 rounded-t" style={{ height: `${heightPercent}%` }}>
                      <div 
                        className="bg-indigo-600 w-full h-full rounded-t"
                        title={`${formatCurrency(amount)}`}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2 -rotate-12">{month}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Monthly Earnings</h3>
            <p className="mt-1 text-sm text-gray-500">No monthly data available</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EarningsTracker; 