'use client'

import React, { useState, useEffect } from 'react'
import InvitationCard from './InvitationCard'
import { Loader2 } from 'lucide-react'
import EmptyState from '@/components/EmptyState'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

interface InvitationsListProps {
  status?: string
  campaignId?: string
  className?: string
}

export default function InvitationsList({ status, campaignId, className = '' }: InvitationsListProps) {
  const [invitations, setInvitations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchInvitations = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      setLoading(true)
      setError(null)

      try {
        let url = `/api/campaigns/invitations?`

        if (status) {
          url += `status=${status}&`
        }

        if (campaignId) {
          url += `campaignId=${campaignId}&`
        }

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch invitations')
        }

        const data = await response.json()
        setInvitations(data.invitations || [])
      } catch (err: any) {
        console.error('Error fetching invitations:', err)
        setError(err.message || 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }

    fetchInvitations()
  }, [status, campaignId])

  const handleStatusChange = (invitationId: string, newStatus: string) => {
    setInvitations(prevInvitations =>
      prevInvitations.filter(invitation => invitation.id !== invitationId)
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-md text-red-800">
        <p>Error: {error}</p>
      </div>
    )
  }

  if (!invitations.length) {
    return (
      <EmptyState
        icon="inbox"
        title="No invitations"
        description={`You don't have any ${status || ''} invitations${campaignId ? ' for this campaign' : ''}.`}
      />
    )
  }

  return (
    <div className={`grid gap-4 ${className}`}>
      {invitations.map(invitation => (
        <InvitationCard
          key={invitation.id}
          invitation={invitation}
          onStatusChange={handleStatusChange}
        />
      ))}
    </div>
  )
} 