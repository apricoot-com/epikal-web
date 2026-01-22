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
    const publicPaths = ["/", "/login", "/signup", "/api/auth", "/api/trpc", "/api/analytics", "/api/public", "/api/cron"];

    // Check if path is public
    const isPublicPath = publicPaths.some(
        (path) => pathname === path || pathname.startsWith(path + "/")
    );

    // Module 3: Subdomain Handling (Sites)
    const hostname = request.headers.get("host") || "";
    // Allow custom domains or subdomains, excluding main domain (e.g. localhost:3000 or app.epikal.com)
    // For local dev, we might use "test.localhost:3000"
    const isLocal = hostname.includes("localhost");
    const rootDomain = isLocal ? "localhost:3000" : (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "epikal.com");

    // Check if this is a templated site request (subdomain or custom domain)
    // E.g. "salon-maria.epikal.com" -> we want to serve /sites/salon-maria
    // Logic: If hostname != rootDomain and not a reserved subdomain (like "app" or "www")

    const isMainDomain = hostname === rootDomain || hostname === `www.${rootDomain}`;
    // TODO: Add "app" to reserved subdomains if we use app.epikal.com

    if (!isMainDomain && !pathname.startsWith('/api')) {
        // Extract subdomain or custom domain
        // For subdomains: salon.epikal.com -> salon
        // For custom: mysalon.com -> mysalon.com

        let siteId = hostname.replace(`.${rootDomain}`, "");
        if (hostname === siteId) {
            // It's a custom domain, pass full hostname
            // Logic later will look up by customDomain field
        }

        // Rewrite to the sites folder
        // We preserve the pathname (e.g. /about)
        // New URL: /_sites/{siteId}/about
        // Correction: Using Next.js Dynamic Route (sites)/[[...path]]
        // We can pass the siteId as a search param or part of the path if we structure it that way.
        // Or better: Rewrite to `/sites/${hostname}${pathname}` and handle parsing in the page.

        // Let's rewrite to /sites/[hostname] + pathname
        return NextResponse.rewrite(new URL(`/sites/${hostname}${pathname}`, request.url));
    }

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
