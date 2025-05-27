"use client"
import { Suspense, useState, useEffect } from 'react'
import { DashboardHeader } from '@/components/dashboard-header'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { RecentTransactions } from '@/components/payments/RecentTransactions'
import { CardSkeleton } from '@/components/loaders/card-skeleton'
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
          <div className="lg:col-span-2 space-y-8">
            <Suspense fallback={<CardSkeleton />}>
              <RecentTransactions limit={5} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}

function RoleBasedMainContent() {
  const [stats, setStats] = useState({
    activeCampaigns: 0,
    totalSpent: 0
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
            totalSpent
          });
        } catch (error) {
          console.error('Error fetching stats:', error);
        } finally {
          setLoading(false);
        }
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
              <PendingInvitations limit={2} />
              <RecommendedCampaigns limit={3} />

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Stats</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-600">Earnings this month</p>
                          <p className="text-2xl font-bold text-green-700 mt-1">$0.00</p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-lg">
                          <DollarSign className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-600">Applications</p>
                          <p className="text-2xl font-bold text-blue-700 mt-1">0</p>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-lg">
                          <Users className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                    </div>
                  </div>
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
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-purple-600">Active Campaigns</p>
                          <div className="text-2xl font-bold text-purple-700 mt-1">
                            {loading ? (
                              <div className="animate-pulse bg-purple-200 h-8 w-16 rounded"></div>
                            ) : (
                              stats.activeCampaigns
                            )}
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
                            {loading ? (
                              <div className="animate-pulse bg-indigo-200 h-8 w-24 rounded"></div>
                            ) : (
                              `$${stats.totalSpent.toLocaleString()}`
                            )}
                          </div>
                        </div>
                        <div className="bg-indigo-100 p-3 rounded-lg">
                          <BarChart3 className="h-6 w-6 text-indigo-600" />
                        </div>
                      </div>
                    </div>
                  </div>
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