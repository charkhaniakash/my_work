import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DashboardHeader } from '@/components/dashboard-header'
import EmptyState from '@/components/EmptyState'
import InvitationsList from '@/components/invitations/InvitationsList'

export const metadata: Metadata = {
  title: 'Campaign Invitations | Influencer Dashboard',
  description: 'Review and manage invitations from brands',
}

export default async function InfluencerInvitationsPage() {
  // Initialize Supabase client
  const supabase = createServerComponentClient({ cookies })
  
  // Check authentication and role
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/login')
  }
  
  // Verify user is an influencer
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single()
  
  if (!user || user.role !== 'influencer') {
    redirect('/dashboard')
  }
  
  return (
    <>
      <DashboardHeader 
        heading="Campaign Invitations" 
        text="Review and respond to invitations from brands"
      />
      
      <div className="mt-6">
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid grid-cols-3 w-full max-w-md mb-4">
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="accepted">Accepted</TabsTrigger>
            <TabsTrigger value="declined">Declined</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending">
            <InvitationsList status="pending" />
          </TabsContent>
          
          <TabsContent value="accepted">
            <InvitationsList status="accepted" />
          </TabsContent>
          
          <TabsContent value="declined">
            <InvitationsList status="declined" />
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
} 