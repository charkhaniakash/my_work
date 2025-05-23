// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  // Define paths that don't need session checking
  const publicPaths = ['/', '/auth/sign-in', '/auth/sign-up', '/auth/callback']
  const isPublicPath = publicPaths.some(path => req.nextUrl.pathname === path)
  const isStaticAsset = req.nextUrl.pathname.match(/\.(js|css|svg|png|jpg|jpeg|gif|ico|ttf|woff|woff2)$/)
  
  // Skip session check for public paths and static assets
  if (isPublicPath || isStaticAsset) {
    return res
  }

  try {
    // Get session (this refreshes the session automatically)
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Middleware auth error:', error)
    }

    const isAuthPage = req.nextUrl.pathname.startsWith('/auth')
    
    // If user is not signed in and trying to access protected routes
    if (!session && !isAuthPage) {
      return NextResponse.redirect(new URL('/auth/sign-in', req.url))
    }

    // If user is signed in and trying to access auth pages
    if (session && isAuthPage) {
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