import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Initialize service role client for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET(request: Request) {
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
    
    // Create a test notification for the current user
    const notificationData = {
      user_id: session.user.id,
      title: 'Test Notification',
      content: 'This is a test notification to verify the system is working.',
      type: 'system',
      is_read: false
    }
    
    // Try first with regular client
    const { data: regularData, error: regularError } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single()
    
    if (!regularError) {
      return NextResponse.json({
        success: true,
        method: 'regular',
        data: regularData
      })
    }
    
    console.log('Regular client failed, trying admin client:', regularError)
    
    // If regular client fails, try with admin client
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('notifications')
      .insert(notificationData)
      .select()
      .single()
    
    if (adminError) {
      return NextResponse.json(
        { 
          error: 'Both methods failed', 
          regularError: regularError.message,
          adminError: adminError.message 
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      method: 'admin',
      data: adminData
    })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    )
  }
} 