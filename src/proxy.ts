/**
 * Next.js Proxy — Route Protection
 *
 * Runs before every matched request (before the page renders).
 *
 * Strategy:
 *  - Protected routes (/my-photos, /profile): redirect to /login if no auth cookie.
 *  - Prefetch requests are excluded from redirects to avoid stale unauthenticated
 *    redirect caching after a successful login.
 *  - Redirects are also limited to navigation/document requests, so App Router
 *    data/prefetch fetches are not treated as hard unauthenticated navigations.
 *
 * Security note:
 *  This proxy checks cookie *presence* only to prevent protected page shell rendering.
 *  Full JWT + session-version verification happens in `authenticateRequest`.
 *  Guest-only redirects are intentionally handled on the client (GuestRoute), so
 *  stale/invalid cookies never block access to /login or /register.
 */

import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/app/lib/authCookie';

const PROTECTED_PATHS = ['/my-photos', '/profile'];

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const hasAuthCookie = request.cookies.has(AUTH_COOKIE_NAME);
  const isPrefetch =
    request.headers.has('next-router-prefetch') || request.headers.get('purpose') === 'prefetch';
  const secFetchMode = request.headers.get('sec-fetch-mode');
  const secFetchDest = request.headers.get('sec-fetch-dest');
  const isNavigationRequest =
    (secFetchMode === null && secFetchDest === null) ||
    secFetchMode === 'navigate' ||
    secFetchDest === 'document';

  const isProtected = PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));

  if (!isPrefetch && isNavigationRequest && isProtected && !hasAuthCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     *  - _next/static  (static files)
     *  - _next/image   (image optimisation)
     *  - favicon.ico
     *  - public folder (uploads, icons, etc.)
     *  - api routes (handled by their own auth middleware)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/|uploads/).*)',
  ],
};
