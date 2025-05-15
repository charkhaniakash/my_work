import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get role from request body
    const { role } = await req.json()
    if (!role || (role !== 'brand' && role !== 'influencer')) {
      return NextResponse.json(
        { success: false, message: 'Invalid role' },
        { status: 400 }
      )
    }

    // Update user's metadata
    await clerkClient.users.updateUser(userId, {
      publicMetadata: { role }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating user role:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update user role' },
      { status: 500 }
    )
  }
} 