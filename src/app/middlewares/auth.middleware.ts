/**
 * Authentication Middleware
 *
 * Extracts and verifies the JWT from the request.
 *
 * Token source priority:
 *   1. HttpOnly cookie  `auth-token`  (primary — XSS-safe, set by login/register)
 *   2. Authorization header  `Bearer <jwt>`  (fallback — for programmatic API clients)
 *
 * Returns a discriminated union so callers can branch on success or failure
 * without throwing exceptions in route handlers.
 *
 * Usage in API routes:
 *   const auth = authenticateRequest(request);
 *   if (auth.error) return auth.error;   // 401 response
 *   const { userId } = auth;             // guaranteed string
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/app/lib/auth';
import { unauthorizedError } from '@/app/lib/apiErrors';
import { AUTH_COOKIE_NAME } from '@/app/lib/authCookie';
import type { ApiResponse } from '@/app/types';

interface AuthSuccess {
  userId: string;
  error?: undefined;
}

interface AuthFailure {
  userId?: undefined;
  error: NextResponse<ApiResponse<null>>;
}

export type AuthResult = AuthSuccess | AuthFailure;

/**
 * Validates the JWT from the cookie (primary) or Authorization header (fallback).
 * Returns { userId } on success, or { error: NextResponse } on failure.
 * Never throws — all error paths return a typed 401 response.
 */
export function authenticateRequest(request: NextRequest): AuthResult {
  // Primary: HttpOnly cookie (XSS-safe)
  const cookieToken = request.cookies.get(AUTH_COOKIE_NAME)?.value ?? null;

  // Fallback: Authorization header for programmatic clients / tests
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  const token = cookieToken ?? bearerToken;

  if (!token) {
    return { error: unauthorizedError('رمز المصادقة مفقود.') };
  }

  try {
    const payload = verifyToken(token);
    return { userId: payload.id };
  } catch {
    return { error: unauthorizedError('رمز المصادقة غير صالح أو منتهي الصلاحية.') };
  }
}
