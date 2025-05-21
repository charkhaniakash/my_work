import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // This refreshes the session automatically
  const { data: { session } } = await supabase.auth.getSession()

  console.log("session", session)

  // If user is not signed in and the current path is not /auth/*,
  // redirect the user to /auth/sign-in
  if (!session && !req.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/auth/sign-in', req.url))
  }

  // If user is signed in and the current path is /auth/*,
  // redirect the user to /dashboard
  if (session && req.nextUrl.pathname.startsWith('/auth')) {

    return NextResponse.rewrite(new URL("/dashboard", req.url), {
      status: 303,
    });
  }

  return res
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}