// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  try {
    // This refreshes the session automatically
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Middleware auth error:', error)
    }

    console.log("Middleware - session exists:", !!session, "path:", req.nextUrl.pathname)

    const isAuthPage = req.nextUrl.pathname.startsWith('/auth')
    const isPublicPage = req.nextUrl.pathname === '/' || isAuthPage
    
    // If user is not signed in and trying to access protected routes
    if (!session && !isPublicPage) {
      console.log("Redirecting to sign-in - no session for protected route")
      return NextResponse.redirect(new URL('/auth/sign-in', req.url))
    }

    // If user is signed in and trying to access auth pages
    if (session && isAuthPage) {
      console.log("Redirecting to dashboard - authenticated user on auth page")
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // If user is signed in and on home page, redirect to dashboard
    if (session && req.nextUrl.pathname === '/') {
      console.log("Redirecting to dashboard - authenticated user on home page")
      return NextResponse.redirect(new URL('/dashboard', req.url))
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