import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Call the expire_campaigns function
    const { error } = await supabase.rpc('expire_campaigns')

    if (error) {
      console.error('Error expiring campaigns:', error)
      return NextResponse.json(
        { error: 'Failed to expire campaigns' },
        { status: 500 }
      )
    }

    // Also get the count of affected campaigns for logging
    const { data: expiredCampaigns, error: countError } = await supabase
      .from('campaigns')
      .select('id, title, end_date')
      .eq('status', 'completed')
      .lt('end_date', new Date().toISOString().split('T')[0])

    if (countError) {
      console.error('Error fetching expired campaigns count:', countError)
    }

    const affectedCount = expiredCampaigns?.length || 0

    return NextResponse.json({
      success: true,
      message: `Successfully processed campaign expiration`,
      expiredCount: affectedCount,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Unexpected error in expire campaigns endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Optional: Add GET endpoint for status check
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get campaigns that should be expired but aren't yet
    const { data: shouldBeExpired, error } = await supabase
      .from('campaigns')
      .select('id, title, end_date, status')
      .in('status', ['active', 'scheduled'])
      .lt('end_date', new Date().toISOString().split('T')[0])

    if (error) {
      return NextResponse.json(
        { error: 'Failed to check campaign status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      campaignsNeedingExpiration: shouldBeExpired?.length || 0,
      campaigns: shouldBeExpired || [],
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in GET expire campaigns endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 