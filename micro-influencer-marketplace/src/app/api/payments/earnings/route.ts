import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    // Get userId from query params
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    console.log(`Earnings API request for userId: ${userId}`);

    // First, verify the user is an influencer
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('User fetch error:', userError);
      return NextResponse.json(
        { error: 'Error fetching user data' },
        { status: 500 }
      );
    }

    console.log(`User role: ${userData.role}`);

    // Allow access to both influencer data (for themselves) and brand data (for campaign owners)
    // This enables both parties to see their respective earnings/payments
    
    // Fetch transactions - for influencers, only show where they are the influencer
    const { data, error } = await supabase
      .from('payment_transactions')
      .select(`
        *,
        campaign:campaigns(title, id),
        brand:brand_id(full_name, id),
        influencer:influencer_id(full_name, id)
      `)
      .eq(userData.role === 'influencer' ? 'influencer_id' : 'brand_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Error fetching earnings data' },
        { status: 500 }
      );
    }

    console.log(`Found ${data?.length || 0} transactions`);
    
    // Log first transaction for debugging
    if (data && data.length > 0) {
      console.log('Sample transaction:', {
        id: data[0].id,
        amount: data[0].amount,
        status: data[0].status,
        created_at: data[0].created_at
      });
    }

    // Add additional analytics data
    const statsResponse = await calculateEarningsStats(userId, userData.role);
    
    // Debug stats response
    console.log('Stats response:', {
      total: statsResponse.total,
      fees: statsResponse.fees,
      transactionCount: statsResponse.transactionCount,
      monthlyAverages: statsResponse.monthlyAverages?.length || 0
    });

    return NextResponse.json({
      transactions: data,
      stats: statsResponse
    });
  } catch (error: any) {
    console.error('Error in earnings endpoint:', error);
    return NextResponse.json(
      { error: `An error occurred: ${error.message}` },
      { status: 500 }
    );
  }
}

// Calculate additional statistics about earnings
async function calculateEarningsStats(userId: string, role: string) {
  try {
    // For influencers: Get total earnings, avg per campaign, etc.
    // For brands: Get total spent, avg per influencer, etc.
    
    const isInfluencer = role === 'influencer';
    const idField = isInfluencer ? 'influencer_id' : 'brand_id';
    
    console.log(`Calculating stats for ${role} with ID ${userId}`);
    
    // Get completed transactions only for stats
    const { data, error } = await supabase
      .from('payment_transactions')
      .select(`
        id,
        amount,
        platform_fee,
        campaign_id,
        created_at,
        status
      `)
      .eq(idField, userId)
      .eq('status', 'completed');
      
    if (error) {
      console.error('Stats query error:', error);
      throw error;
    }
    
    console.log(`Found ${data?.length || 0} completed transactions for stats`);
    
    if (!data || data.length === 0) {
      console.log('No completed transactions found for stats');
      return {
        total: 0,
        fees: 0,
        net: 0,
        avgPerTransaction: 0,
        transactionCount: 0,
        uniqueCampaignCount: 0,
        monthlyAverages: []
      };
    }
    
    // Basic calculations
    const total = data.reduce((sum, t) => sum + Number(t.amount), 0);
    const fees = data.reduce((sum, t) => sum + Number(t.platform_fee), 0);
    const net = total - fees;
    const avgPerTransaction = total / data.length;
    
    // Count unique campaigns
    const uniqueCampaigns = new Set(data.map(t => t.campaign_id));
    
    // Monthly averages (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    // Log date testing for first transaction
    if (data.length > 0) {
      const firstDate = new Date(data[0].created_at);
      console.log('Sample date parsing:', {
        raw: data[0].created_at,
        parsed: firstDate.toISOString(),
        year: firstDate.getFullYear(),
        month: firstDate.getMonth() + 1
      });
    }
    
    const recentTransactions = data.filter(t => {
      // Ensure proper date parsing
      try {
        const transactionDate = new Date(t.created_at);
        return transactionDate >= sixMonthsAgo;
      } catch (err) {
        console.error('Date parsing error for transaction:', t.id, t.created_at);
        return false;
      }
    });
    
    console.log(`Found ${recentTransactions.length} transactions in the last 6 months`);
    
    // Group by month 
    const monthlyData = recentTransactions.reduce((acc: Record<string, number[]>, t) => {
      try {
        const date = new Date(t.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!acc[monthKey]) {
          acc[monthKey] = [];
        }
        
        acc[monthKey].push(Number(t.amount) - Number(t.platform_fee));
      } catch (err) {
        console.error('Error processing transaction for monthly data:', t.id);
      }
      return acc;
    }, {});
    
    console.log('Monthly data keys:', Object.keys(monthlyData));
    
    // Calculate monthly averages
    const monthlyAverages = Object.entries(monthlyData).map(([month, amounts]) => {
      const total = amounts.reduce((sum, amount) => sum + amount, 0);
      return {
        month,
        total,
        average: total / amounts.length,
        count: amounts.length
      };
    });
    
    console.log(`Generated ${monthlyAverages.length} monthly averages`);
    
    return {
      total,
      fees,
      net,
      avgPerTransaction,
      transactionCount: data.length,
      uniqueCampaignCount: uniqueCampaigns.size,
      monthlyAverages
    };
  } catch (error: any) {
    console.error('Error calculating earnings stats:', error);
    return {
      error: 'Failed to calculate earnings statistics',
      message: error.message
    };
  }
} 