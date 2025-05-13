import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/auth/sign-in', '/auth/sign-up']
  const isPublicRoute = publicRoutes.includes(req.nextUrl.pathname)

  if (!session) {
    // If not logged in and trying to access protected route, redirect to sign-in
    if (!isPublicRoute) {
      return NextResponse.redirect(new URL('/auth/sign-in', req.url))
    }
    // If not logged in and accessing public route, allow access
    return res
  }

  // User is logged in
  if (isPublicRoute) {
    // If logged in and trying to access public route, redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Check if user has completed onboarding
  if (req.nextUrl.pathname !== '/onboarding') {
    const { data: profile } = await supabase
      .from(session.user.user_metadata.role === 'brand' ? 'brand_profiles' : 'influencer_profiles')
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    if (!profile && req.nextUrl.pathname !== '/onboarding') {
      // If no profile and not on onboarding page, redirect to onboarding
      return NextResponse.redirect(new URL('/onboarding', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
} 