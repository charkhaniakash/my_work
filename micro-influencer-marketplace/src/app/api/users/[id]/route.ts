import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const targetUserId = params.id;
    
    // Fetch user details (limited to necessary fields for security)
    const { data: user, error } = await supabase
      .from('users')
      .select('id, full_name, role, profile_image')
      .eq('id', targetUserId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return NextResponse.json(
        { error: 'Failed to fetch user' },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 