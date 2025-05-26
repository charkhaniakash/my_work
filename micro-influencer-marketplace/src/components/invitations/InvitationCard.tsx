import React, { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar, Clock, DollarSign, MessageSquare, Check, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

interface InvitationCardProps {
  invitation: {
    id: string
    status: string
    created_at: string
    custom_message?: string
    proposed_rate?: number
    campaign: {
      id: string
      title: string
      budget: number
      start_date: string
      end_date: string
    }
    brand: {
      id: string
      full_name: string
      avatar_url: string
    }
  }
  onStatusChange?: (invitationId: string, newStatus: string) => void
  showActions?: boolean
}

export default function InvitationCard({ 
  invitation, 
  onStatusChange,
  showActions = true
}: InvitationCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  const handleStatusChange = async (status: 'accepted' | 'declined') => {
    console.log('handleStatusChange called with status:', status)
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('Session:', session)
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      toast.error('Authentication error')
      return
    }
    
    if (!session) {
      console.log('No session found')
      toast.error('You must be logged in to respond to invitations')
      router.push('/login') // Redirect to login page
      return
    }
    
    setIsLoading(true)
    try {
      console.log('Sending PATCH request to /api/campaigns/invitations')
      const response = await fetch('/api/campaigns/invitations', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          invitationId: invitation.id,
          status
        })
      })
      
      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update invitation')
      }
      
      toast.success(status === 'accepted' ? 'Invitation Accepted' : 'Invitation Declined')
      
      if (onStatusChange) {
        console.log('Calling onStatusChange callback')
        onStatusChange(invitation.id, status)
      }
    } catch (error: any) {
      console.error('Error in handleStatusChange:', error)
      toast.error(error.message || 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={invitation.brand.avatar_url || ''} alt={invitation.brand.full_name} />
              <AvatarFallback>{invitation.brand.full_name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{invitation.brand.full_name}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(invitation.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          <StatusBadge status={invitation.status} />
        </div>
        <CardTitle className="text-lg">{invitation.campaign.title}</CardTitle>
        <CardDescription className="flex flex-wrap gap-2 mt-1">
          <div className="flex items-center text-xs">
            <Calendar className="h-3 w-3 mr-1" />
            {new Date(invitation.campaign.start_date).toLocaleDateString()} - {new Date(invitation.campaign.end_date).toLocaleDateString()}
          </div>
          <div className="flex items-center text-xs">
            <DollarSign className="h-3 w-3 mr-1" />
            {formatCurrency(invitation.campaign.budget)}
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {invitation.custom_message && (
          <div className="mb-4 p-3 bg-secondary/30 rounded-md">
            <div className="flex items-start gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
              <p className="text-sm">{invitation.custom_message}</p>
            </div>
          </div>
        )}
        
        {invitation.proposed_rate && (
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Proposed Rate:</span>
            <span className="font-medium">{formatCurrency(invitation.proposed_rate)}</span>
          </div>
        )}
      </CardContent>
      
      {showActions && invitation.status === 'pending' && (
        <CardFooter className="flex justify-end space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            disabled={isLoading}
            onClick={() => handleStatusChange('declined')}
          >
            <X className="h-4 w-4 mr-1" />
            Decline
          </Button>
          <Button 
            size="sm"
            disabled={isLoading}
            onClick={() => handleStatusChange('accepted')}
          >
            <Check className="h-4 w-4 mr-1" />
            Accept
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'pending') {
    return <Badge variant="outline" className="border-yellow-400 text-yellow-600">Pending</Badge>
  } else if (status === 'accepted') {
    return <Badge variant="outline" className="border-green-400 text-green-600">Accepted</Badge>
  } else {
    return <Badge variant="outline" className="border-red-400 text-red-600">Declined</Badge>
  }
} 