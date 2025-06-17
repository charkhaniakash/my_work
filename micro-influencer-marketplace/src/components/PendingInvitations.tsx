'use client'

import React, { useState, useEffect } from 'react'
import InvitationCard from './invitations/InvitationCard'
import { useSupabase } from '@/lib/providers/supabase-provider'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

interface PendingInvitationsProps {
  limit?: number
}

export default function PendingInvitations({ limit = 1 }: PendingInvitationsProps) {
  const [invitations, setInvitations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { supabase } = useSupabase()
  
  useEffect(() => {
    const fetchInvitations = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) return;
  
      try {
        setLoading(true);
  
        if (!currentSession?.access_token) {
          throw new Error('No active session');
        }
  
        const response = await fetch(`/api/campaigns/invitations?status=pending&limit=${limit}`, {
          headers: {
            'Authorization': `Bearer ${currentSession.access_token}`
          }
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch invitations');
        }
  
        const data = await response.json();
        setInvitations(data.invitations || []);
      } catch (error) {
        console.error('Error fetching pending invitations:', error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchInvitations();
  }, [limit, supabase]); // Removed `session`
  
  const handleInvitationUpdate = (invitationId: string) => {
    // Remove the invitation from the list when it's accepted/declined
    setInvitations(prevInvitations => 
      prevInvitations.filter(invitation => invitation.id !== invitationId)
    )
  }
  
  if (loading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="mb-4">
          <h3 className="text-lg font-medium">Pending Invitations</h3>
          <p className="text-sm text-muted-foreground">Campaign collaboration invitations</p>
        </div>
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }
  
  if (invitations.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="mb-4">
          <h3 className="text-lg font-medium">Pending Invitations</h3>
          <p className="text-sm text-muted-foreground">Campaign collaboration invitations</p>
        </div>
        <div className="bg-primary/5 rounded-lg p-4 text-center">
          <p className="text-muted-foreground text-sm">No pending invitations</p>
          <p className="text-xs mt-1">Brands will send you invitations to collaborate on their campaigns.</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-medium">Pending Invitations</h3>
          <p className="text-sm text-muted-foreground">Campaign collaboration invitations</p>
        </div>
        <Link href="/dashboard/influencer/invitations" className="text-sm text-primary hover:underline">
          View all
        </Link>
      </div>
      
      <div className="space-y-4">
        {invitations.map(invitation => (
          <InvitationCard 
            key={invitation.id}
            invitation={invitation}
            onStatusChange={handleInvitationUpdate}
          />
        ))}
      </div>
    </div>
  )
} 