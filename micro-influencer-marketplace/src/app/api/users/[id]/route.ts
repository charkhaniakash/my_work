import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log(`User API called for ID: ${params.id}`);
  
  try {
    if (!params.id || params.id === 'undefined') {
      console.log('Invalid user ID provided');
      return NextResponse.json(
        { message: 'Invalid user ID provided' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    console.log('Checking user authentication');
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      console.error('Authentication error: No session found');
      return NextResponse.json(
        { message: 'Unauthorized. Please sign in to access this resource.' },
        { status: 401 }
      );
    }

    console.log(`Fetching user data for ID ${params.id}`);
    // Get user data from public.users table - using only columns that exist in schema
    const { data: user, error } = await supabase
      .from('users')
      .select('id, full_name, email, role, avatar_url, is_verified')
      .eq('id', params.id)
      .single();

    console.log('Database response:', { user, error });

    if (error) {
      console.error(`Database error fetching user data for ID ${params.id}:`, error);
      
      // Check if this is a not found error or something else
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { message: 'User not found in database' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { message: `Failed to fetch user details from database: ${error.message}` },
        { status: 500 }
      );
    }

    if (!user) {
      console.error(`User not found in database for ID ${params.id}`);
      return NextResponse.json(
        { message: 'User not found in database' },
        { status: 404 }
      );
    }

    console.log('Successfully returning user data');
    return NextResponse.json(user);
  } catch (error: any) {
    console.error('Server error in user endpoint:', error);
    return NextResponse.json(
      { message: `An error occurred: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
} 