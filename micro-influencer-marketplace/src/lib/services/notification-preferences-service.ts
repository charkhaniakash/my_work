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

// Default preferences
const DEFAULT_PREFERENCES: NotificationPreferences = {
  campaigns: true,
  applications: true,
  messages: true,
  sound_enabled: true,
  email_notifications: false
}

// Get user notification preferences
export const getNotificationPreferences = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      // If no preferences found, create default ones
      if (error.code === 'PGRST116' || error.message.includes('no rows') || error.message.includes('not found')) {
        const { data: newPrefs, error: insertError } = await supabase
          .from('notification_preferences')
          .insert({
            user_id: userId,
            ...DEFAULT_PREFERENCES
          })
          .select()
          .maybeSingle()
          
        if (insertError) {
          return DEFAULT_PREFERENCES
        }
        
        return newPrefs || DEFAULT_PREFERENCES
      }
      
      // Return default preferences if error
      return DEFAULT_PREFERENCES
    }

    // If no data found, return default preferences
    if (!data) {
      return DEFAULT_PREFERENCES;
    }
    
    return data
  } catch (error) {
    console.error('[getNotificationPreferences] Unexpected error fetching notification preferences:', error)
    return DEFAULT_PREFERENCES
  }
}

// Update user notification preferences
export const updateNotificationPreferences = async (
  userId: string,
  preferences: Partial<NotificationPreferences>
) => {
  try {
    
    // First check if a record exists
    const { data: existingData, error: checkError } = await supabase
      .from('notification_preferences')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()
    
    if (checkError) {
      console.error('[updateNotificationPreferences] Error checking for existing preferences:', checkError);
    }
    
    let result;
    
    if (existingData) {
      // Update existing record
      result = await supabase
        .from('notification_preferences')
        .update({
          ...preferences,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .maybeSingle()
    } else {
      // Insert new record
      result = await supabase
        .from('notification_preferences')
        .insert({
          user_id: userId,
          ...DEFAULT_PREFERENCES,
          ...preferences
        })
        .select()
        .maybeSingle()
    }

    const { data, error } = result;

    if (error) {
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
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