import { createClient } from '@supabase/supabase-js'
import { getNotificationPreferences } from './notification-preferences-service'

// Initialize Supabase admin client for notifications
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
)

export type NotificationType = 'message' | 'application' | 'campaign' | 'invitation' | 'invitation_response'

interface CreateNotificationParams {
  userId: string
  title: string
  content: string
  type: NotificationType
  link?: string
  relatedId?: string
  relatedType?: string
}

export const createNotification = async ({
  userId,
  title,
  content,
  type,
  link,
  relatedId,
  relatedType
}: CreateNotificationParams) => {
  try {
    // Check user preferences before sending notification
    if (type === 'message' || type === 'application' || type === 'campaign') {
      const preferences = await getNotificationPreferences(userId);
      
      const preferenceType = type === 'message' ? 'messages' : 
                            type === 'application' ? 'applications' : 'campaigns';
      
      if (!preferences[preferenceType]) {
        console.log(`Notification of type ${type} disabled by user preferences for ${userId}`);
        return { data: null, error: null, skipped: true };
      }
    }
    
    // Create the notification using admin client
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        content,
        type,
        link,
        related_id: relatedId,
        related_type: relatedType,
        is_read: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { data: null, error };
  }
};

// Helper functions for common notification types

export const createMessageNotification = async (userId: string, senderName: string, messageContent: string, conversationId: string) => {
  return createNotification({
    userId,
    title: `New message from ${senderName}`,
    content: messageContent.length > 100 ? `${messageContent.substring(0, 100)}...` : messageContent,
    type: 'message',
    link: `/dashboard/messages?conversation=${conversationId}`,
    relatedId: conversationId,
    relatedType: 'conversation'
  })
}

export const createApplicationNotification = async (
  userId: string, 
  campaignTitle: string, 
  status: 'pending' | 'accepted' | 'rejected', 
  applicationId: string,
  campaignId?: string
) => {
  let title = ''
  let content = ''

  if (status === 'accepted') {
    title = `Application accepted!`
    content = `Your application for "${campaignTitle}" has been accepted.`
  } else if (status === 'rejected') {
    title = `Application update`
    content = `Your application for "${campaignTitle}" was not selected.`
  } else {
    title = `Application received`
    content = `We've received your application for "${campaignTitle}".`
  }

  return createNotification({
    userId,
    title,
    content,
    type: 'application',
    link: `/dashboard/applications`,
    relatedId: applicationId,
    relatedType: 'application'
  })
}

export const createCampaignApplicationNotification = async (
  brandId: string,
  influencerName: string,
  campaignTitle: string,
  applicationId: string,
  campaignId?: string
) => {
  return createNotification({
    userId: brandId,
    title: 'New campaign application',
    content: `${influencerName} has applied to your campaign "${campaignTitle}".`,
    type: 'application',
    link: campaignId ? `/dashboard/campaigns/${campaignId}` : `/dashboard/campaigns`,
    relatedId: applicationId,
    relatedType: 'application'
  })
}

export const createCampaignNotification = async (
  influencerId: string,
  campaignTitle: string,
  brandName: string,
  campaignId: string
) => {
  return createNotification({
    userId: influencerId,
    title: 'New campaign available',
    content: `${brandName} has posted a new campaign: "${campaignTitle}"`,
    type: 'campaign',
    link: `/dashboard/campaigns/${campaignId}`,
    relatedId: campaignId,
    relatedType: 'campaign'
  })
}

// Create a notification for a new application using API route
export async function createApplicationNotificationAdmin(
  recipientId: string,
  senderId: string,
  senderName: string,
  campaignTitle: string,
  campaignId: string
) {
  try {
    await fetch('/api/notifications/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipientId,
        senderId,
        type: 'application',
        message: `${senderName} has applied to your campaign "${campaignTitle}"`,
        campaignId
      }),
    });
  } catch (error) {
    console.error('Error creating application notification:', error);
  }
}

// Create a notification for application status update using API route
export async function createApplicationStatusNotificationAdmin(
  recipientId: string,
  senderId: string,
  senderName: string,
  campaignTitle: string,
  campaignId: string,
  status: string
) {
  try {
    const statusText = status === 'approved' 
      ? 'approved' 
      : status === 'rejected' 
        ? 'rejected' 
        : 'updated';
    
    await fetch('/api/notifications/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipientId,
        senderId,
        type: 'application_status',
        message: `${senderName} has ${statusText} your application for "${campaignTitle}"`,
        campaignId,
        status
      }),
    });
  } catch (error) {
    console.error('Error creating application status notification:', error);
  }
}

// Create a notification for a new invitation
export async function createInvitationNotificationAdmin(
  recipientId: string,
  senderId: string,
  senderName: string,
  campaignTitle: string,
  campaignId: string
) {
  console.log('Creating invitation notification with:', {
    recipientId,
    senderId,
    senderName,
    campaignTitle,
    campaignId
  })

  try {
    console.log('Using Supabase admin client with URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: recipientId,
        title: 'New Campaign Invitation',
        content: `${senderName} has invited you to join their campaign "${campaignTitle}"`,
        type: 'invitation',
        link: `/dashboard/influencer/invitations`,
        related_id: campaignId,
        related_type: 'campaign',
        is_read: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating invitation notification:', error)
      throw error;
    }

    console.log('Successfully created invitation notification:', data)
    return { data, error: null };
  } catch (error) {
    console.error('Error in createInvitationNotificationAdmin:', error)
    return { data: null, error };
  }
}

// Create a notification for invitation response
export async function createInvitationResponseNotificationAdmin(
  recipientId: string,
  senderId: string,
  senderName: string,
  campaignTitle: string,
  campaignId: string,
  status: string
) {
  console.log('Creating invitation response notification with:', {
    recipientId,
    senderId,
    senderName,
    campaignTitle,
    campaignId,
    status
  })

  try {
    console.log('Using Supabase admin client with URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: recipientId,
        title: 'Invitation Response',
        content: `${senderName} has ${status} your invitation for the campaign "${campaignTitle}"`,
        type: 'invitation_response',
        link: `/dashboard/campaigns/${campaignId}`,
        related_id: campaignId,
        related_type: 'campaign',
        is_read: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating invitation response notification:', error)
      throw error;
    }

    console.log('Successfully created invitation response notification:', data)
    return { data, error: null };
  } catch (error) {
    console.error('Error in createInvitationResponseNotificationAdmin:', error)
    return { data: null, error };
  }
} 