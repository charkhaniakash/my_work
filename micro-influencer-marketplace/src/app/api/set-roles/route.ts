import { clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { userId, role } = await req.json()

  try {
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: { role },
    })

    return NextResponse.json({ message: 'Metadata updated' })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to update metadata' }, { status: 500 })
  }
}
