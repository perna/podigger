// Feature: api-authentication-strategy
// Requirements: 8.6, 13.5

import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js middleware that protects routes requiring authentication.
 * Checks for the presence of the `access_token` cookie.
 * If absent, redirects to `/auth/unauthorized?next=<original-url>`.
 *
 * Note: This middleware cannot access React context — it reads the cookie directly.
 */
export function middleware(request: NextRequest): NextResponse {
    const accessToken = request.cookies.get('access_token');

    if (!accessToken) {
        const { pathname, search } = request.nextUrl;
        const next = encodeURIComponent(pathname + search);
        const redirectUrl = new URL(`/auth/unauthorized?next=${next}`, request.url);
        return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/add-podcast',
        '/admin/:path*',
    ],
};
