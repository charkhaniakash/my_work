"use client"
import { Suspense } from 'react'
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

// export const metadata = {
//   title: 'Dashboard',
//   description: 'Example dashboard app built using the components.',
// }

export default function DashboardPage() {
  return (
    <>
      <DashboardHeader
        heading="Dashboard"
        text="Overview of your account"
      >
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/dashboard/campaigns/new">Create Campaign</Link>
          </Button>
        </div>
      </DashboardHeader>
      
      <div className="grid gap-8">
        {/* Welcome Message */}
        <div className="p-6 bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-lg text-white">
          <h2 className="text-xl font-medium mb-2">Welcome to the Micro-Influencer Marketplace!</h2>
          <p>Connect with brands and creators to grow your business and create authentic content.</p>
      </div>

        {/* User-specific content */}
        <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-5">
          
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
    </>
  )
}

function RoleBasedMainContent() {
  return (
    <ClientOnly>
      {({ user }: { user: User | null }) => {
        // Show different main content based on user role
        if (user?.user_metadata?.role === 'influencer') {
          return (
            <>
              <PendingInvitations limit={2} />
              <RecommendedCampaigns limit={3} />
              
              <div className="p-5 bg-white rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="text-sm text-gray-500">Earnings this month</div>
                    <div className="text-2xl font-bold text-gray-900">$0.00</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="text-sm text-gray-500">Applications</div>
                    <div className="text-2xl font-bold text-gray-900">0</div>
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
              
              <div className="p-5 bg-white rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="text-sm text-gray-500">Active Campaigns</div>
                    <div className="text-2xl font-bold text-gray-900">0</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="text-sm text-gray-500">Total Spent</div>
                    <div className="text-2xl font-bold text-gray-900">$0.00</div>
            </div>
          </div>
        </div>
            </>
          )
        }
        
        return (
          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Complete your profile</h3>
            <p className="mt-1 text-gray-600">
              Please complete your profile to access all features.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/dashboard/profile">Update Profile</Link>
            </Button>
      </div>
        )
      }}
    </ClientOnly>
  )
} 