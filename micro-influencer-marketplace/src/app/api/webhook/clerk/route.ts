import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    // Get the webhook payload
    const payload = await req.json();
    
    // We're not doing signature verification in this simplified version
    // In production, you should use the svix library to verify the signature
    
    // Process the webhook based on event type
    const eventType = payload.type;
    
    // Handle user creation
    if (eventType === 'user.created') {
      const data = payload.data;
      const { id, email_addresses, first_name, last_name, public_metadata } = data;
      
      try {
        const { error } = await supabase.from('users').insert({
          id,
          email: email_addresses[0]?.email_address,
          full_name: `${first_name || ''} ${last_name || ''}`.trim(),
          role: (public_metadata?.role as string) || 'brand',
          is_verified: true,
          created_at: new Date().toISOString(),
        });
        
        if (error) throw error;
      } catch (error) {
        console.error('Error creating user in Supabase:', error);
        // Continue processing - don't fail the webhook
      }
    }
    
    // Handle user update
    if (eventType === 'user.updated') {
      const data = payload.data;
      const { id, public_metadata } = data;
      const role = public_metadata?.role as string;
      
      if (role) {
        try {
    const { error } = await supabase
      .from('users')
            .update({
              role,
              updated_at: new Date().toISOString()
            })
            .eq('id', id);
            
          if (error) throw error;
  } catch (error) {
          console.error('Error updating user in Supabase:', error);
          // Continue processing - don't fail the webhook
        }
      }
    }
    
    // Always return success to prevent Clerk from retrying (unless you want retries)
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 