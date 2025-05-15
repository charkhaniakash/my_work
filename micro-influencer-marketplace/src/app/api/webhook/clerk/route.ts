import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET || ''

// Log environment variables (excluding sensitive values)
console.log('Environment check:', {
  hasWebhookSecret: !!process.env.CLERK_WEBHOOK_SECRET,
  hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
})

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Test Supabase connection
async function testSupabaseConnection() {
  try {
    // First test basic connection
    const { data, error } = await supabase.from('users').select('count').limit(1)
    if (error) {
      console.error('Supabase connection test failed:', error)
      return false
    }
    
    // Test table structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('users')
      .select('id, email, full_name, role, is_verified')
      .limit(0)
    
    if (tableError) {
      console.error('Table structure test failed:', {
        error: tableError,
        message: 'Make sure your users table has all required columns: id, email, full_name, role, is_verified'
      })
      return false
    }
    
    console.log('Supabase connection and table structure verified successfully')
    return true
  } catch (error) {
    console.error('Error testing Supabase connection:', error)
    return false
  }
}

async function handleUserCreated(data: any) {
  try {
    console.log('Handling user.created webhook with data:', JSON.stringify(data, null, 2))
    
    // Test connection before proceeding
    const isConnected = await testSupabaseConnection()
    if (!isConnected) {
      throw new Error('Failed to connect to Supabase')
    }
    
    // Extract user data, handling both email and OAuth cases
    const { id, email_addresses, first_name, last_name, public_metadata, username, external_accounts } = data

    if (!id) {
      throw new Error('No user ID provided in webhook data')
    }

    // Get the primary email or the email from GitHub
    const primaryEmail = email_addresses?.[0]?.email_address
    
    // Get name from various possible sources
    let fullName = `${first_name || ''} ${last_name || ''}`.trim()
    
    // If no first/last name, try to get it from GitHub data
    if (!fullName && external_accounts?.length > 0) {
      const githubAccount = external_accounts.find((account: any) => account.provider === 'github')
      if (githubAccount) {
        fullName = githubAccount.username || githubAccount.first_name || ''
      }
    }

    // If still no name, use username or email prefix
    if (!fullName) {
      fullName = username || primaryEmail?.split('@')[0] || id
    }

    const userData = {
      id: id,
      email: primaryEmail,
      full_name: fullName,
      role: public_metadata?.role || 'brand',
      is_verified: true,
    }

    console.log('Attempting to create user in Supabase with data:', JSON.stringify(userData, null, 2))

    // First check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows returned
      console.error('Error checking for existing user:', checkError)
      throw checkError
    }

    if (existingUser) {
      console.log('User already exists in Supabase, updating instead...')
      const { error: updateError } = await supabase
        .from('users')
        .update(userData)
        .eq('id', id)

      if (updateError) {
        console.error('Error updating existing user:', updateError)
        throw updateError
      }
      return existingUser
    }

    // Create user in Supabase
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single()

    if (insertError) {
      console.error('Supabase insert error:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      })
      throw insertError
    }

    console.log('Successfully created user in Supabase:', JSON.stringify(newUser, null, 2))
    return newUser
  } catch (error) {
    console.error('Detailed error in handleUserCreated:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    throw error
  }
}

async function handleUserUpdated(data: any) {
  try {
    const { id, email_addresses, first_name, last_name, public_metadata } = data

    if (!id) {
      throw new Error('No user ID provided in webhook data')
    }

    const updateData = {
      email: email_addresses[0]?.email_address,
      full_name: `${first_name || ''} ${last_name || ''}`.trim(),
      role: public_metadata?.role,
    }

    console.log('Attempting to update user in Supabase:', JSON.stringify(updateData, null, 2))

    // Update user in Supabase
    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Supabase update error:', {
        code: error.code,
        message: error.message,
        details: error.details
      })
      throw error
    }
  } catch (error) {
    console.error('Error in handleUserUpdated:', error)
    throw error
  }
}

async function handleUserDeleted(data: any) {
  const { id } = data

  // Delete user in Supabase
  const { error } = await supabase.from('users').delete().eq('id', id)

  if (error) {
    console.error('Error deleting user in Supabase:', error)
    throw error
  }
}

export async function POST(req: Request) {
  try {
    console.log('Webhook endpoint hit')
    
    // Get the headers
    const headersList = await headers()
    const svix_id = headersList.get("svix-id")
    const svix_timestamp = headersList.get("svix-timestamp")
    const svix_signature = headersList.get("svix-signature")

    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error('Missing headers:', {
        svix_id: !!svix_id,
        svix_timestamp: !!svix_timestamp,
        svix_signature: !!svix_signature
      })
      return NextResponse.json(
        { success: false, error: 'Missing required Svix headers' },
        { status: 400 }
      )
    }

    // Get and log the body
    const payload = await req.json()
    console.log('Received webhook payload:', JSON.stringify(payload, null, 2))
    const body = JSON.stringify(payload)

    // Verify the webhook
    let evt: WebhookEvent
    try {
      const wh = new Webhook(webhookSecret)
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as WebhookEvent
    } catch (err) {
      console.error('Webhook verification error:', err instanceof Error ? err.message : err)
      return NextResponse.json(
        { success: false, error: 'Invalid webhook signature' },
        { status: 400 }
      )
    }

    const eventType = evt.type
    console.log('Processing webhook event type:', eventType)

    try {
      switch (eventType) {
        case 'user.created':
          await handleUserCreated(evt.data)
          break
        case 'user.updated':
          await handleUserUpdated(evt.data)
          break
        case 'user.deleted':
          await handleUserDeleted(evt.data)
          break
        default:
          console.log(`Unhandled event type: ${eventType}`)
      }

      return NextResponse.json({ success: true }, { status: 200 })
    } catch (error) {
      console.error('Error processing webhook:', {
        eventType,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error processing webhook',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Critical webhook error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Critical webhook error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 