import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// For client-side operations (limited by RLS)
const supabase = createClientComponentClient()

export type NotificationType = 'message' | 'application' | 'campaign' | 'user' | 'system'

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
    // Create the notification data object
    const notificationData = {
      user_id: userId,
      title,
      content,
      type,
      link,
      related_id: relatedId,
      related_type: relatedType,
      is_read: false
    };

    // Try making the insert directly
    const { data, error } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single();

    // If direct insert fails, try using a server function (fallback)
    if (error) {
      console.error('Direct notification creation failed:', error);
      
      // Call our API route as a fallback
      const response = await fetch('/api/notifications/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create notification via API route');
      }
      
      return { data: await response.json(), error: null };
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
  applicationId: string
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
  applicationId: string
) => {
  return createNotification({
    userId: brandId,
    title: 'New campaign application',
    content: `${influencerName} has applied to your campaign "${campaignTitle}".`,
    type: 'application',
    link: `/dashboard/campaigns`,
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
    link: `/dashboard/available-campaigns`,
    relatedId: campaignId,
    relatedType: 'campaign'
  })
} 