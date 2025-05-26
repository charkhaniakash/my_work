import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import InvitationManagerWrapper from '@/components/invitations/InvitationManagerWrapper'
import InvitationDashboard from '@/components/invitations/InvitationDashboard'

export default async function InvitationsPage() {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/login')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Campaign Invitations</h1>
        <p className="mt-2 text-gray-600">
          Manage your campaign invitations and discover influencers
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Invitation Management */}
        <div className="lg:col-span-2">
          <InvitationManagerWrapper />
        </div>

        {/* Right Column - Dashboard */}
        <InvitationDashboard />
      </div>
    </div>
  )
} 