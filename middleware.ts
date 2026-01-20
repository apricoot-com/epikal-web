import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware to protect dashboard routes and handle onboarding flow
 * 
 * Routes:
 * - /dashboard/* → Requires auth + company
 * - /onboarding → Requires auth, no company
 * - /login, /signup, /api/auth/* → Public
 */
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Public paths that don't require authentication
    const publicPaths = ["/", "/login", "/signup", "/api/auth", "/api/trpc"];

    // Check if path is public
    const isPublicPath = publicPaths.some(
        (path) => pathname === path || pathname.startsWith(path + "/")
    );

    if (isPublicPath) {
        return NextResponse.next();
    }

    // Check for session cookie
    const sessionCookie = request.cookies.get("better-auth.session_token");

    // If no session, redirect to login
    if (!sessionCookie) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Note: We can't check for company membership here because middleware
    // can't do async DB calls. The onboarding redirect is handled client-side
    // in the dashboard layout or via tRPC response.

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (images, etc.)
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
