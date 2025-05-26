import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { 
      recipientId, 
      senderId, 
      senderName, 
      type, 
      message, 
      campaignId, 
      campaignTitle, 
      status 
    } = body

    // Validate required fields
    if (!recipientId || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let notificationData = {
      recipient_id: recipientId,
      sender_id: senderId,
      type,
      message,
      data: { campaignId, status },
      read: false
    }

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert(notificationData)
      .select()
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, notification: data })
  } catch (error: any) {
    console.error('Error in notification creation:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 