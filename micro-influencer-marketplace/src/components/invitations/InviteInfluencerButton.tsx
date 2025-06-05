'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import dynamic from 'next/dynamic'

// Use dynamic import with SSR disabled for CampaignPayment to avoid NextRouter mounting issues
const CampaignPayment = dynamic(
  () => import('@/components/payments/CampaignPayment'),
  { ssr: false }
)

const inviteFormSchema = z.object({
  customMessage: z.string().optional(),
  proposedRate: z.coerce.number().min(0, 'Rate cannot be negative').optional(),
})

type InviteFormValues = z.infer<typeof inviteFormSchema>

interface InviteInfluencerButtonProps {
  campaignId: string
  influencerId: string
  campaignBudget?: number
  onInviteSent?: () => void
  buttonText?: string
  buttonVariant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'link'
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  disabled?: boolean
}

export default function InviteInfluencerButton({
  campaignId,
  influencerId,
  campaignBudget,
  onInviteSent,
  buttonText = 'Invite',
  buttonVariant = 'default',
  buttonSize = 'sm',
  className = '',
  disabled = false
}: InviteInfluencerButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [invitationStatus, setInvitationStatus] = useState<string | null>(null)
  const [showPayment, setShowPayment] = useState(false)
  const supabase = createClientComponentClient()
  
  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      customMessage: '',
      proposedRate: campaignBudget || undefined,
    },
  })
  
  // Check if invitation exists
  useEffect(() => {
    const checkInvitation = async () => {
      try {
        const { data, error } = await supabase
          .from('campaign_invitations')
          .select('status')
          .eq('campaign_id', campaignId)
          .eq('influencer_id', influencerId)
          .single()

        if (data) {
          setInvitationStatus(data.status)
          
          // If invitation is accepted, check if payment is needed
          if (data.status === 'accepted') {
            const { data: appData } = await supabase
              .from('campaign_applications')
              .select('status')
              .eq('campaign_id', campaignId)
              .eq('influencer_id', influencerId)
              .single()
            
            // If application exists but not paid yet, show payment option
            if (appData && appData.status === 'accepted' && appData.status !== 'approved_and_paid') {
              setShowPayment(true)
            }
          }
        }
      } catch (error) {
        console.error('Error checking invitation:', error)
      }
    }

    if (campaignId && influencerId) {
      checkInvitation()
    }
  }, [campaignId, influencerId])
  
  const onSubmit = async (values: InviteFormValues) => {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (!session) return
    
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/campaigns/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          campaignId,
          influencerId,
          customMessage: values.customMessage || undefined,
          proposedRate: values.proposedRate || undefined
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        if (response.status === 409) {
          if (data.error.includes('already sent')) {
            toast.error('You have already sent an invitation to this influencer for this campaign')
          } else if (data.error.includes('already accepted')) {
            toast.error('This influencer has already accepted an invitation for this campaign')
          } else {
            toast.error('An invitation already exists for this influencer')
          }
        } else {
          toast.error(data.error || 'Failed to send invitation')
        }
        return
      }
      
      toast.success('Invitation sent successfully')
      
      setIsDialogOpen(false)
      form.reset()
      if (onInviteSent) onInviteSent()
    } catch (error: any) {
      console.error('Error sending invitation:', error)
      toast.error(error.message || 'Failed to send invitation')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handlePaymentSuccess = async () => {
    toast.success('Payment successful! The influencer has been paid.')
    setShowPayment(false)
    
    // Update the application status to approved_and_paid
    try {
      const { data: appData } = await supabase
        .from('campaign_applications')
        .select('id')
        .eq('campaign_id', campaignId)
        .eq('influencer_id', influencerId)
        .single()
        
      if (appData) {
        await supabase
          .from('campaign_applications')
          .update({ status: 'approved_and_paid' })
          .eq('id', appData.id)
      }
    } catch (error) {
      console.error('Error updating application status:', error)
    }
  }

  if (showPayment) {
    return (
      <div>
        <CampaignPayment
          campaignId={campaignId}
          influencerId={influencerId}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowPayment(false)}
        />
      </div>
    )
  }

  if (invitationStatus === 'pending') {
    return <Button disabled>Invitation Sent</Button>
  }

  if (invitationStatus === 'accepted') {
    return <Button onClick={() => setShowPayment(true)} variant="outline">Make Payment</Button>
  }

  if (invitationStatus === 'declined') {
    return <Button onClick={() => setIsDialogOpen(true)}>Re-invite</Button>
  }

  return (
    <>
      <Button
        variant={buttonVariant as any}
        size={buttonSize as any}
        onClick={() => setIsDialogOpen(true)}
        className={className}
        disabled={disabled || isSubmitting}
      >
        {buttonText}
      </Button>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Influencer</DialogTitle>
            <DialogDescription>
              Send a personalized invitation to collaborate on your campaign.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
              <FormField
                control={form.control}
                name="proposedRate"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Proposed Rate</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder={campaignBudget ? formatCurrency(campaignBudget) : 'Enter amount'}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter the payment amount you'd like to offer this influencer
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="customMessage"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Custom Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell the influencer why you'd like them to be part of your campaign..."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A personalized message increases the chances of acceptance
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending...' : 'Send Invitation'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
} 