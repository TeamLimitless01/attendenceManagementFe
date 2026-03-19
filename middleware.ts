import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    });

    const { pathname } = request.nextUrl;

    // Public auth pages (accessible only if not logged in)
    const authPages = ["/login", "/register", "/forgot-password", "/reset-password"];

    // If the user is authenticated and tries to access auth pages, redirect to home
    if (token && authPages.includes(pathname)) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    // Public routes that everyone can access (logged in or logged out)
    const isPublicRoute = pathname === "/" || authPages.includes(pathname);

    // If user is not logged in and tries to access a protected route (anything other than public routes)
    if (!token && !isPublicRoute) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // Role-based authorization for authenticated users
    if (token) {
        const role = token.role as string;

        // Admin routes protection
        if (pathname.startsWith("/admin") && role !== "admin") {
            return NextResponse.redirect(new URL("/", request.url)); // or a 403 page
        }

        // Student routes protection
        if (pathname.startsWith("/student") && role !== "student") {
            return NextResponse.redirect(new URL("/", request.url));
        }

        // Teacher routes protection
        if (pathname.startsWith("/teacher") && role !== "teacher") {
            return NextResponse.redirect(new URL("/", request.url));
        }

        // Note: '/' and '/profile' implicitly pass through for all logged-in users.
    }

    return NextResponse.next();
}

// Update the matcher to apply middleware to all paths except static assets and api routes
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, sitemap.xml, robots.txt (metadata files)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
    ],
};
