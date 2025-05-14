import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your middleware

const isPublicRoute = createRouteMatcher(["/", "/auth/sign-in", "/auth/sign-up"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  
  // If the user is signed in and trying to access auth pages, redirect to dashboard
  if (userId && isPublicRoute(req) && req.nextUrl.pathname !== "/") {
    const dashboardUrl = new URL("/dashboard", req.url);
    return Response.redirect(dashboardUrl);
  }

  // If the user is not signed in and trying to access protected routes, auth.protect() will handle the redirect
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}; 