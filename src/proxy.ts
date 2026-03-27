/**
 * Next.js Proxy — Route Protection
 *
 * Runs before every matched request (before the page renders).
 *
 * Strategy:
 *  - Protected routes (/my-photos, /profile): redirect to /login if no auth cookie.
 *  - Guest-only routes (/login, /register):   redirect to / if auth cookie present.
 *
 * Security note:
 *  This proxy checks for cookie *presence* only, which is fast and sufficient
 *  for preventing the page shell from rendering. Full JWT verification is performed
 *  by `authenticateRequest` inside every API route handler that requires auth.
 *  An invalid/expired cookie will result in a 401 from the API, and the client-side
 *  AuthContext will then clear the user state and redirect to /login.
 */

import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/app/lib/authCookie';

const PROTECTED_PATHS = ['/my-photos', '/profile'];
const GUEST_ONLY_PATHS = ['/login', '/register'];

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const hasAuthCookie = request.cookies.has(AUTH_COOKIE_NAME);

  const isProtected = PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
  const isGuestOnly = GUEST_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));

  if (isProtected && !hasAuthCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isGuestOnly && hasAuthCookie) {
    return NextResponse.redirect(new URL('/', request.url));
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
