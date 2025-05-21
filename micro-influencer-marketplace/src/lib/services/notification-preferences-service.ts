import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// For client-side operations (limited by RLS)
const supabase = createClientComponentClient()

export type NotificationPreferences = {
  id?: string
  user_id?: string
  campaigns: boolean
  applications: boolean
  messages: boolean
  sound_enabled: boolean
  email_notifications: boolean
  created_at?: string
  updated_at?: string
}

// Get user notification preferences
export const getNotificationPreferences = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching notification preferences:', error)
      
      // If no preferences found, create default ones
      if (error.code === 'PGRST116') {
        const { data: newPrefs, error: insertError } = await supabase
          .from('notification_preferences')
          .insert({
            user_id: userId,
            campaigns: true,
            applications: true,
            messages: true,
            sound_enabled: true,
            email_notifications: false
          })
          .select()
          .single()
          
        if (insertError) {
          console.error('Error creating default preferences:', insertError)
          return {
            campaigns: true,
            applications: true,
            messages: true,
            sound_enabled: true,
            email_notifications: false
          }
        }
        
        return newPrefs
      }
      
      // Return default preferences if error
      return {
        campaigns: true,
        applications: true,
        messages: true,
        sound_enabled: true,
        email_notifications: false
      }
    }

    return data
  } catch (error) {
    console.error('Unexpected error fetching notification preferences:', error)
    return {
      campaigns: true,
      applications: true,
      messages: true,
      sound_enabled: true,
      email_notifications: false
    }
  }
}

// Update user notification preferences
export const updateNotificationPreferences = async (
  userId: string,
  preferences: Partial<NotificationPreferences>
) => {
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .update(preferences)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating notification preferences:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error updating notification preferences:', error)
    return { success: false, error }
  }
}

// Check if notifications are enabled for specific type
export const shouldSendNotification = async (userId: string, type: 'campaigns' | 'applications' | 'messages') => {
  try {
    const preferences = await getNotificationPreferences(userId)
    return preferences[type]
  } catch (error) {
    console.error(`Error checking notification preferences for ${type}:`, error)
    return true // Default to sending notifications if there's an error
  }
} 