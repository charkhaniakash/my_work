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
    console.log(`[getNotificationPreferences] Fetching preferences for user: ${userId}`);
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('[getNotificationPreferences] Error fetching notification preferences:', error)
      console.log('[getNotificationPreferences] Error details:', error.message, error.code)
      
      // If no preferences found, create default ones
      if (error.code === 'PGRST116' || error.message.includes('no rows') || error.message.includes('not found')) {
        console.log('[getNotificationPreferences] Creating default preferences for user:', userId)
        const { data: newPrefs, error: insertError } = await supabase
          .from('notification_preferences')
          .insert({
            user_id: userId,
            ...DEFAULT_PREFERENCES
          })
          .select()
          .maybeSingle()
          
        if (insertError) {
          console.error('[getNotificationPreferences] Error creating default preferences:', insertError)
          console.log('[getNotificationPreferences] Error details:', insertError.message, insertError.code, insertError.details)
          return DEFAULT_PREFERENCES
        }
        
        console.log('[getNotificationPreferences] Successfully created default preferences:', newPrefs);
        return newPrefs || DEFAULT_PREFERENCES
      }
      
      // Return default preferences if error
      console.log('[getNotificationPreferences] Returning default preferences due to error');
      return DEFAULT_PREFERENCES
    }

    // If no data found, return default preferences
    if (!data) {
      console.log('[getNotificationPreferences] No data found, returning default preferences');
      return DEFAULT_PREFERENCES;
    }
    
    console.log('[getNotificationPreferences] Successfully fetched preferences:', data);
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
    console.log(`[updateNotificationPreferences] Updating preferences for user: ${userId}`, preferences);
    
    // First check if a record exists
    const { data: existingData, error: checkError } = await supabase
      .from('notification_preferences')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()
    
    if (checkError) {
      console.error('[updateNotificationPreferences] Error checking for existing preferences:', checkError);
    }
    
    console.log('[updateNotificationPreferences] Existing data check result:', existingData);
    
    let result;
    
    if (existingData) {
      // Update existing record
      console.log('[updateNotificationPreferences] Updating existing preferences for user:', userId);
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
      console.log('[updateNotificationPreferences] Creating new preferences for user:', userId);
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
      console.error('[updateNotificationPreferences] Error updating notification preferences:', error)
      console.log('[updateNotificationPreferences] Error details:', error.message, error.code, error.details)
      return { success: false, error }
    }

    console.log('[updateNotificationPreferences] Successfully updated preferences:', data);
    return { success: true, data }
  } catch (error) {
    console.error('[updateNotificationPreferences] Unexpected error updating notification preferences:', error)
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