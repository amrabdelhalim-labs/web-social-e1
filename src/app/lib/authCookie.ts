/**
 * Auth Cookie Configuration
 *
 * Centralises the cookie name and options used by login, register, and logout
 * routes, and by the auth middleware.
 *
 * Settings:
 *  - httpOnly  : JS cannot access the token (XSS protection)
 *  - secure    : HTTPS-only in production
 *  - sameSite  : 'lax' — allows normal navigation redirects, blocks cross-site POSTs
 *  - path      : '/' — sent on all routes
 *  - maxAge    : 7 days — matches JWT expiry (JWT_EXPIRES_IN in auth.ts)
 */

import type { NextRequest } from 'next/server';

interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  path?: string;
  maxAge?: number;
}

export const AUTH_COOKIE_NAME = 'auth-token';

const AUTH_COOKIE_BASE_OPTIONS: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

function isHttpsRequest(request: NextRequest): boolean {
  const proto = request.headers.get('x-forwarded-proto');
  return request.nextUrl.protocol === 'https:' || proto === 'https';
}

/**
 * Cookie security mode:
 * - production over HTTPS/proxy HTTPS: secure=true
 * - local HTTP development/startup (including production mode on localhost): secure=false
 */
export function getAuthCookieOptions(request: NextRequest): CookieOptions {
  const secure = process.env.NODE_ENV === 'production' ? isHttpsRequest(request) : false;
  return { ...AUTH_COOKIE_BASE_OPTIONS, secure };
}
