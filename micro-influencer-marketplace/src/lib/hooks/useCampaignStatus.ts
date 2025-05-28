import { useMemo, useCallback } from 'react'

export interface CampaignDateStatus {
  isExpired: boolean
  isActive: boolean
  isScheduled: boolean
  daysRemaining: number
  dateStatus: 'expired' | 'active' | 'scheduled' | 'upcoming'
  canAcceptApplications: boolean
  statusMessage: string
  statusColor: 'red' | 'green' | 'yellow' | 'blue' | 'gray'
}

// Function to manually trigger campaign expiration via API
export async function expireCampaigns(): Promise<{ success: boolean; expiredCount: number }> {
  try {
    const response = await fetch('/api/campaigns/expire', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to expire campaigns')
    }

    const data = await response.json()
    return {
      success: data.success,
      expiredCount: data.expiredCount || 0
    }
  } catch (error) {
    console.error('Error expiring campaigns:', error)
    return { success: false, expiredCount: 0 }
  }
}

export function useCampaignStatus(
  startDate: string, 
  endDate: string, 
  currentStatus: string
): CampaignDateStatus {
  return useMemo(() => {
    const now = new Date()
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    // Set to start of day for consistent comparison
    now.setHours(0, 0, 0, 0)
    start.setHours(0, 0, 0, 0)
    end.setHours(0, 0, 0, 0)
    
    const isExpired = end < now
    const isBeforeStart = start > now
    const isActive = !isExpired && !isBeforeStart && currentStatus === 'active'
    const isScheduled = isBeforeStart && currentStatus === 'scheduled'
    
    // Calculate days remaining
    const daysRemaining = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    // Determine overall status
    let dateStatus: 'expired' | 'active' | 'scheduled' | 'upcoming'
    let statusMessage: string
    let statusColor: 'red' | 'green' | 'yellow' | 'blue' | 'gray'
    let canAcceptApplications: boolean
    
    // Handle expired campaigns (date-based expiration takes precedence)
    if (isExpired || currentStatus === 'completed') {
      dateStatus = 'expired'
      statusMessage = isExpired ? 'Campaign has ended' : 'Campaign completed'
      statusColor = currentStatus === 'completed' ? 'gray' : 'red'
      canAcceptApplications = false
    } else if (currentStatus === 'paused') {
      dateStatus = 'scheduled' // Paused campaigns act like scheduled
      statusMessage = 'Campaign is paused'
      statusColor = 'yellow'
      canAcceptApplications = false
    } else if (isBeforeStart) {
      dateStatus = 'upcoming'
      statusMessage = `Starts on ${start.toLocaleDateString()}`
      statusColor = 'blue'
      canAcceptApplications = false
    } else {
      // Campaign is currently running
      dateStatus = 'active'
      canAcceptApplications = true
      statusColor = 'green'
      
      if (daysRemaining <= 0) {
        statusMessage = 'Ends today!'
        statusColor = 'red' // Urgent for today
      } else if (daysRemaining === 1) {
        statusMessage = 'Ends tomorrow!'
        statusColor = 'yellow' // Warning for tomorrow
      } else if (daysRemaining <= 7) {
        statusMessage = `${daysRemaining} days remaining`
        statusColor = 'yellow' // Warning for this week
      } else {
        statusMessage = 'Active campaign'
      }
    }
    
    return {
      isExpired,
      isActive,
      isScheduled,
      daysRemaining,
      dateStatus,
      canAcceptApplications,
      statusMessage,
      statusColor
    }
  }, [startDate, endDate, currentStatus])
}

// Helper function for campaign cards
export function getCampaignStatusBadge(status: CampaignDateStatus) {
  const baseClasses = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
  
  const colorClasses = {
    red: 'bg-red-100 text-red-800',
    green: 'bg-green-100 text-green-800', 
    yellow: 'bg-yellow-100 text-yellow-800',
    blue: 'bg-blue-100 text-blue-800',
    gray: 'bg-gray-100 text-gray-800'
  }
  
  return {
    className: `${baseClasses} ${colorClasses[status.statusColor]}`,
    text: status.statusMessage
  }
}

// Helper to check if user can apply to campaign
export function canUserApplyToCampaign(
  campaignStatus: CampaignDateStatus,
  userRole: string,
  hasAlreadyApplied: boolean
): { canApply: boolean; reason?: string } {
  if (userRole !== 'influencer') {
    return { canApply: false, reason: 'Only influencers can apply to campaigns' }
  }
  
  if (hasAlreadyApplied) {
    return { canApply: false, reason: 'You have already applied to this campaign' }
  }
  
  if (!campaignStatus.canAcceptApplications) {
    if (campaignStatus.isExpired) {
      return { canApply: false, reason: 'Campaign has ended' }
    }
    if (campaignStatus.dateStatus === 'upcoming') {
      return { canApply: false, reason: 'Campaign has not started yet' }
    }
    return { canApply: false, reason: 'Campaign is not accepting applications' }
  }
  
  return { canApply: true }
}

// Hook for auto-expiring campaigns when component mounts
export function useAutoExpireCampaigns() {
  const triggerExpiration = useCallback(async () => {
    try {
      const result = await expireCampaigns()
      if (result.success && result.expiredCount > 0) {
        console.log(`Auto-expired ${result.expiredCount} campaigns`)
        // You could trigger a page refresh or state update here
        return true
      }
    } catch (error) {
      console.error('Failed to auto-expire campaigns:', error)
    }
    return false
  }, [])

  return { triggerExpiration }
} 