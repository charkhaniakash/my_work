'use client'

import React, { useState, useEffect } from 'react'
import InvitationCard from './InvitationCard'
import { Loader2 } from 'lucide-react'
import EmptyState from '@/components/EmptyState'
import { useSupabase } from '@/lib/providers/supabase-provider'

interface InvitationsListProps {
  status?: string
  campaignId?: string
  className?: string
}

export default function InvitationsList({ status, campaignId, className = '' }: InvitationsListProps) {
  const [invitations, setInvitations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { supabase } = useSupabase()

  useEffect(() => {
    const fetchInvitations = async () => {
      console.log('🔍 InvitationsList: Starting to fetch invitations...')
      console.log('🔍 Status filter:', status)
      console.log('🔍 Campaign ID filter:', campaignId)
      
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      console.log('🔍 Session found:', !!currentSession)
      console.log('🔍 User ID:', currentSession?.user?.id)
      console.log('🔍 User metadata:', currentSession?.user?.user_metadata)
      
      if (!currentSession) {
        console.log('❌ No session found, returning early')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        if (!currentSession?.access_token) {
          throw new Error('No active session')
        }

        let url = `/api/campaigns/invitations?`

        if (status) {
          url += `status=${status}&`
        }

        if (campaignId) {
          url += `campaignId=${campaignId}&`
        }

        console.log('🔍 API URL:', url)
        console.log('🔍 Making API request...')

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${currentSession.access_token}`
          }
        })

        console.log('🔍 API Response status:', response.status)
        console.log('🔍 API Response ok:', response.ok)

        if (!response.ok) {
          const errorData = await response.json()
          console.log('❌ API Error data:', errorData)
          throw new Error(errorData.error || 'Failed to fetch invitations')
        }

        const data = await response.json()
        console.log('✅ API Response data:', data)
        console.log('✅ Invitations array:', data.invitations)
        console.log('✅ Number of invitations:', data.invitations?.length || 0)
        
        setInvitations(data.invitations || [])
      } catch (err: any) {
        console.error('❌ Error fetching invitations:', err)
        setError(err.message || 'Something went wrong')
      } finally {
        console.log('🔍 Setting loading to false')
        setLoading(false)
      }
    }

    fetchInvitations()
  }, [status, campaignId, supabase])

  const handleStatusChange = (invitationId: string, newStatus: string) => {
    setInvitations(prevInvitations =>
      prevInvitations.filter(invitation => invitation.id !== invitationId)
    )
  }

  console.log('🔍 InvitationsList render - loading:', loading)
  console.log('🔍 InvitationsList render - error:', error)
  console.log('🔍 InvitationsList render - invitations.length:', invitations.length)

  if (loading) {
    console.log('🔍 Rendering loader...')
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
      </div>
    )
  }

  if (error) {
    console.log('🔍 Rendering error state...')
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-md text-red-800">
        <p>Error: {error}</p>
      </div>
    )
  }

  if (!invitations.length) {
    console.log('🔍 Rendering empty state...')
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