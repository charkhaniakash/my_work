"use client"
import { Suspense, useState, useEffect } from 'react'
import { DashboardHeader } from '@/components/dashboard-header'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { RecentTransactions } from '@/components/payments/RecentTransactions'
import { CardSkeleton, StatCardSkeleton } from '@/components/loaders'
import RecommendedCampaigns from '@/components/campaigns/RecommendedCampaigns'
import { RecentCampaigns } from '@/components/campaigns/RecentCampaigns'
import { ClientOnly } from '@/components/client-only'
import { User } from '@supabase/supabase-js'
import PendingInvitations from '@/components/dashboard/PendingInvitations'
import { useSupabase } from '@/lib/providers/supabase-provider'
import { TrendingUp, DollarSign, Users, BarChart3, ArrowUpRight } from 'lucide-react'

// export const metadata = {
//   title: 'Dashboard',
//   description: 'Example dashboard app built using the components.',
// }

export default function DashboardPage() {
  const { supabase, user } = useSupabase();
  console.log('🔍 User:', user)
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        heading="Dashboard"
        text="Overview of your account"
      >
        <div className="flex items-center gap-2">
          <Button asChild className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800">
            <Link href="/dashboard/campaigns/new">Create Campaign</Link>
          </Button>
        </div>
      </DashboardHeader>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Message */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-800 p-8 text-white shadow-xl">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-3">Welcome to the Micro-Influencer Marketplace!</h2>
            <p className="text-indigo-100 max-w-2xl">Connect with brands and creators to grow your business and create authentic content.</p>
          </div>
          <div className="absolute right-0 top-0 -mt-4 -mr-4 h-64 w-64 transform rotate-45 bg-white opacity-10"></div>
        </div>

        {/* User-specific content */}
        <div className="mt-8 grid gap-8 md:grid-cols-1 lg:grid-cols-5">
          {/* Left column for both users */}
          <div className="lg:col-span-3 space-y-8">
            <RoleBasedMainContent />
          </div>

          {/* Right column for both users - shared across roles */}
          {user?.user_metadata?.role === 'brand' && (
          <div className="lg:col-span-2 space-y-8">
            <Suspense fallback={<CardSkeleton />}>
              <RecentTransactions limit={5} />
              </Suspense>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function RoleBasedMainContent() {
  const [stats, setStats] = useState({
    activeCampaigns: 0,
    totalSpent: 0,
    totalApplications: 0,
    monthlyEarnings: 0
  });
  const [loading, setLoading] = useState(true);
  const { supabase, user } = useSupabase();

  useEffect(() => {
    async function fetchStats() {
      if (user?.user_metadata?.role === 'brand') {
        try {
          const { data: campaigns, error: campaignsError } = await supabase
            .from('campaigns')
            .select('id')
            .eq('brand_id', user.id)
            .eq('status', 'active');

          if (campaignsError) throw campaignsError;

          const { data: transactions, error: transactionsError } = await supabase
            .from('payment_transactions')
            .select('amount')
            .eq('brand_id', user.id)
            .eq('status', 'completed');

          if (transactionsError) throw transactionsError;

          const totalSpent = transactions?.reduce((sum: number, t: { amount: number }) => sum + (Number(t.amount) || 0), 0) || 0;

          setStats({
            activeCampaigns: campaigns?.length || 0,
            totalSpent,
            totalApplications: 0,
            monthlyEarnings: 0
          });
        } catch (error) {
          console.error('Error fetching stats:', error);
        } finally {
          setLoading(false);
        }
      } else if (user?.user_metadata?.role === 'influencer') {
        try {
          // Fetch applications count
          const { data: applications, error: applicationsError } = await supabase
            .from('campaign_applications')
            .select('id, proposed_rate, status')
            .eq('influencer_id', user.id);

          if (applicationsError) throw applicationsError;

          // Calculate monthly earnings (approved and paid applications)
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          
          const monthlyEarnings = applications
            ?.filter(app => {
              if (app.status !== 'approved_and_paid') return false;
              // Note: You might want to add a payment_date field to track this more accurately
              return true; // For now, include all paid applications
            })
            .reduce((sum, app) => sum + (app.proposed_rate || 0), 0) || 0;

          setStats({
            activeCampaigns: 0,
            totalSpent: 0,
            totalApplications: applications?.length || 0,
            monthlyEarnings
          });
        } catch (error) {
          console.error('Error fetching influencer stats:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }

    fetchStats();
  }, [user]);

  return (
    <ClientOnly>
      {({ user }: { user: User | null }) => {
        if (user?.user_metadata?.role === 'influencer') {
          return (
            <>
              <PendingInvitations limit={1} />
              <RecommendedCampaigns limit={3} />

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Stats</h3>
                  {loading ? (
                    <div className="grid grid-cols-2 gap-6">
                      <StatCardSkeleton />
                      <StatCardSkeleton />
                    </div>
                  ) : (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5">
                      <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-green-600">Total Earnings</p>
                            <div className="text-2xl font-bold text-green-700 mt-1">
                              ${stats.monthlyEarnings.toLocaleString()}
                            </div>
                        </div>
                        <div className="bg-green-100 p-3 rounded-lg">
                          <DollarSign className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                    </div>
                      <Link href="/dashboard/applications" className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 block hover:from-blue-100 hover:to-blue-200 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-600">Applications</p>
                            <div className="text-2xl font-bold text-blue-700 mt-1">
                              {stats.totalApplications}
                            </div>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-lg">
                          <Users className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </>
          )
        }

        if (user?.user_metadata?.role === 'brand') {
          return (
            <>
              <RecentCampaigns />

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Stats</h3>
                  {loading ? (
                    <div className="grid grid-cols-2 gap-6">
                      <StatCardSkeleton />
                      <StatCardSkeleton />
                    </div>
                  ) : (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-purple-600">Active Campaigns</p>
                          <div className="text-2xl font-bold text-purple-700 mt-1">
                              {stats.activeCampaigns}
                          </div>
                        </div>
                        <div className="bg-purple-100 p-3 rounded-lg">
                          <TrendingUp className="h-6 w-6 text-purple-600" />
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-indigo-600">Total Spent</p>
                          <div className="text-2xl font-bold text-indigo-700 mt-1">
                              ${stats.totalSpent.toLocaleString()}
                          </div>
                        </div>
                        <div className="bg-indigo-100 p-3 rounded-lg">
                          <BarChart3 className="h-6 w-6 text-indigo-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                  )}
                </div>
              </div>
            </>
          )
        }

        return (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900">Complete your profile</h3>
              <p className="mt-2 text-gray-600">
                Please complete your profile to access all features.
              </p>
              <Button className="mt-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800" asChild>
                <Link href="/dashboard/profile">Update Profile</Link>
              </Button>
            </div>
          </div>
        )
      }}
    </ClientOnly>
  )
}

