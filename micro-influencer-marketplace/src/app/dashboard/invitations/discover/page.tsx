import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import InfluencerDiscoveryWrapper from '@/components/invitations/InfluencerDiscoveryWrapper'

export default async function DiscoverInfluencersPage() {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/login')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Discover Influencers</h1>
        <p className="mt-2 text-gray-600">
          Find and invite influencers to your campaigns
        </p>
      </div>

      <InfluencerDiscoveryWrapper />
    </div>
  )
} 