import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Initialize service role client for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: Request) {
  try {
    // Verify the user is authenticated
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Get notification data from request
    const notificationData = await request.json()
    
    // Validate required fields
    if (!notificationData.user_id || !notificationData.title || !notificationData.content || !notificationData.type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Check notification preferences for user before creating notification
    if (['message', 'application', 'campaign'].includes(notificationData.type)) {
      const preferenceType = notificationData.type === 'message' ? 'messages' : 
                             notificationData.type === 'application' ? 'applications' : 'campaigns';
      
      // Get all user preferences
      const { data: prefsData, error: prefsError } = await supabaseAdmin
        .from('notification_preferences')
        .select('*')
        .eq('user_id', notificationData.user_id)
        .single();
      
      // If preferences exist and the specific type is disabled, skip notification
      if (!prefsError && prefsData) {
        // Check if the specific notification type is disabled
        const isEnabled = prefsData[preferenceType];
        if (isEnabled === false) {
          return NextResponse.json({
            message: `Notification of type ${notificationData.type} is disabled for user`,
            skipped: true
          });
        }
      }
    }
    
    // Create notification with service role client (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert(notificationData)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating notification:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 