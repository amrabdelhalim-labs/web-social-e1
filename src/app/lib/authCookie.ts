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

import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';

export const AUTH_COOKIE_NAME = 'auth-token';

export const AUTH_COOKIE_OPTIONS: Partial<ResponseCookie> = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days
};
