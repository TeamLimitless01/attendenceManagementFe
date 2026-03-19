import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    });

    const { pathname } = request.nextUrl;

    // If the user is authenticated and tries to access auth pages, redirect to home
    if (token && (pathname === "/login" || pathname === "/register" || pathname === "/forgot-password" || pathname === "/reset-password")) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    if (!token && pathname === "/") {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: ["/", "/login", "/register", "/forgot-password", "/reset-password"],
};
