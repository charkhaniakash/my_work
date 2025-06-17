// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  // Define paths that don't need session checking
  const publicPaths = ['/', '/auth/callback']
  const authPaths = [
    '/auth/sign-in', 
    '/auth/sign-up', 
    '/auth/forgot-password', 
    '/auth/reset-password'
  ]
  
  // Get current path without query parameters
  const pathname = req.nextUrl.pathname
  
  // Check for Supabase auth token in URL (used in password reset and other auth flows)
  const hasAuthToken = req.nextUrl.searchParams.has('token') || 
                      req.nextUrl.searchParams.has('access_token') ||
                      req.nextUrl.searchParams.has('refresh_token') ||
                      req.nextUrl.searchParams.has('type')
  
  // If there's an auth token in the URL, don't redirect
  if (hasAuthToken) {
    return res
  }
  
  const isPublicPath = publicPaths.some(path => pathname === path)
  const isAuthPath = authPaths.some(path => pathname === path || pathname.startsWith(path))
  const isStaticAsset = pathname.match(/\.(js|css|svg|png|jpg|jpeg|gif|ico|ttf|woff|woff2)$/)
 

  const restrictedRoutes = [
    {
      pathPrefix: '/dashboard/invitations/discover',
      restrictedRoles: ['influencer'],
    },
    {
      pathPrefix: '/dashboard/analytics',
      restrictedRoles: ['influencer'],
    },
  ]
  
  // Skip session check for static assets
  if (isStaticAsset) {
    return res
  }

  try {
    // Get session (this refreshes the session if not expired)
    const { data: { session }, error } = await supabase.auth.getSession()
    const role = session?.user?.user_metadata?.role
    
    if (error) {
      console.error('Middleware auth error:', error)
    }

    // Add additional session expiration check
    const isSessionExpired = session && session.expires_at ? 
      new Date(session.expires_at * 1000) < new Date() : 
      true;
    
    const isLoggedIn = session && !isSessionExpired;

    // If user is signed in and trying to access auth pages, redirect to dashboard
    if (isLoggedIn && isAuthPath) {
      const redirectUrl = new URL('/dashboard', req.url)
      return NextResponse.redirect(redirectUrl)
    }

    // If user is not signed in or session is expired and trying to access protected routes
    if ((!isLoggedIn) && !isPublicPath && !isAuthPath) {
      // Clear cookies if session is expired
      if (isSessionExpired && session) {
        await supabase.auth.signOut();
      }
      
      const redirectUrl = new URL('/auth/sign-in', req.url)
      return NextResponse.redirect(redirectUrl)
    }

    if (pathname.startsWith('/dashboard/invitations/discover') && role === 'influencer') {
      return NextResponse.redirect(new URL('/not-found', req.url))
    }


    for (const route of restrictedRoutes) {
      if (pathname.startsWith(route.pathPrefix) && route.restrictedRoles.includes(role)) {
        return NextResponse.redirect(new URL('/not-found', req.url))
      }
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    return res
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}