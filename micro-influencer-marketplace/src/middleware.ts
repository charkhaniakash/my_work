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
    try {
      // First get the user record
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('id, role')
        .eq('id', session.user.id)
        .single()

      if (userError) {
        console.error('User record error in middleware:', userError)
        return NextResponse.redirect(new URL('/auth/sign-in', req.url))
      }

      if (!userRecord) {
        console.error('User record not found in middleware')
        return NextResponse.redirect(new URL('/auth/sign-in', req.url))
      }

      // Then check for profile
      const { data: profile, error: profileError } = await supabase
        .from(userRecord.role === 'brand' ? 'brand_profiles' : 'influencer_profiles')
        .select('id')
        .eq('user_id', userRecord.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') { // Ignore "not found" error
        console.error('Profile check error in middleware:', profileError)
        return NextResponse.redirect(new URL('/auth/sign-in', req.url))
      }

      if (!profile && req.nextUrl.pathname !== '/onboarding') {
        // If no profile and not on onboarding page, redirect to onboarding
        console.log('No profile found in middleware, redirecting to onboarding')
        return NextResponse.redirect(new URL('/onboarding', req.url))
      }
    } catch (error) {
      console.error('Middleware error:', error)
      return NextResponse.redirect(new URL('/auth/sign-in', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
} 