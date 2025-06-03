// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  // Define paths that don't need session checking
  const publicPaths = ['/', '/auth/callback']
  const authPaths = ['/auth/sign-in', '/auth/sign-up']
  const isPublicPath = publicPaths.some(path => req.nextUrl.pathname === path)
  const isAuthPath = authPaths.some(path => req.nextUrl.pathname === path)
  const isStaticAsset = req.nextUrl.pathname.match(/\.(js|css|svg|png|jpg|jpeg|gif|ico|ttf|woff|woff2)$/)
  
  // Skip session check for static assets
  if (isStaticAsset) {
    return res
  }

  try {
    // Get session (this refreshes the session automatically)
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Middleware auth error:', error)
    }

    // If user is signed in and trying to access auth pages, redirect to dashboard
    if (session && isAuthPath) {
      const redirectUrl = new URL('/dashboard', req.url)
      return NextResponse.redirect(redirectUrl)
    }

    // If user is not signed in and trying to access protected routes
    if (!session && !isPublicPath && !isAuthPath) {
      const redirectUrl = new URL('/auth/sign-in', req.url)
      return NextResponse.redirect(redirectUrl)
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