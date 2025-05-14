import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // const res = NextResponse.next()
  // const supabase = createMiddlewareClient({ req, res })

  // const {
  //   data: { session },
  // } = await supabase.auth.getSession()

  // // Public routes that don't require authentication
  // const publicRoutes = ['/', '/auth/sign-in', '/auth/sign-up']
  // const isPublicRoute = publicRoutes.includes(req.nextUrl.pathname)

  // // API routes should be handled separately
  // if (req.nextUrl.pathname.startsWith('/api')) {
  //   return res
  // }
  // console.log('Session:', session)
  // console.log('isPublicRoute:', isPublicRoute)

  // if (!session) {
  //   // If not logged in and trying to access protected route, redirect to sign-in
  //   if (!isPublicRoute) {
  //     return NextResponse.redirect(new URL('/auth/sign-in', req.url))
  //   }
  //   // If not logged in and accessing public route, allow access
  //   return res
  // }


  // // User is logged in
  // if (isPublicRoute) {
  //   // If logged in and trying to access public route, redirect to dashboard
  //   return NextResponse.redirect(new URL('/dashboard', req.url))
  // }

  // // Skip profile checks for the onboarding route
  // if (req.nextUrl.pathname === '/onboarding') {
  //   return res
  // }

  // try {
  //   // Get the user record
  //   const { data: userRecord, error: userError } = await supabase
  //     .from('users')
  //     .select('id, role')
  //     .eq('id', session.user.id)
  //     .single()

  //   if (userError) {
  //     console.error('Error fetching user record:', userError)
  //     return NextResponse.redirect(new URL('/auth/sign-in', req.url))
  //   }

  //   if (!userRecord) {
  //     // If no user record exists, redirect to onboarding
  //     return NextResponse.redirect(new URL('/onboarding', req.url))
  //   }

  //   // Check for profile completion
  //   const { data: profile, error: profileError } = await supabase
  //     .from(userRecord.role === 'brand' ? 'brand_profiles' : 'influencer_profiles')
  //     .select('id')
  //     .eq('user_id', session.user.id)
  //     .single()

  //   if (profileError && profileError.code !== 'PGRST116') {
  //     console.error('Error checking profile:', profileError)
  //     return NextResponse.redirect(new URL('/auth/sign-in', req.url))
  //   }

  //   if (!profile) {
  //     // If profile is not complete, redirect to onboarding
  //     return NextResponse.redirect(new URL('/onboarding', req.url))
  //   }

  //   // All checks passed, allow access to the requested route
  //   return res
  // } catch (error) {
  //   console.error('Middleware error:', error)
  //   return NextResponse.redirect(new URL('/auth/sign-in', req.url))
  // }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
} 