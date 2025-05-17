import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your middleware

export async function middleware(req: NextRequest) {
  // const res = NextResponse.next()
  // const supabase = createMiddlewareClient({ req, res })


  // console.log("middleware"  ,supabase )
  // const {
  //   data: { session },
  // } = await supabase.auth.getSession()

  // // If user is not signed in and the current path is not /auth/*,
  // // redirect the user to /auth/sign-in
  // if (!session && !req.nextUrl.pathname.startsWith('/auth')) {
  //   return NextResponse.redirect(new URL('/auth/sign-in', req.url))
  // }

  // // If user is signed in and the current path is /auth/*,
  // // redirect the user to /dashboard
  // if (session && req.nextUrl.pathname.startsWith('/auth')) {
  //   return NextResponse.redirect(new URL('/dashboard', req.url))
  // }

  // return res
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
} 