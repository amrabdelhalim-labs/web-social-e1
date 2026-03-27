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
import { connectDB } from '@/app/lib/mongodb';
import { getUserRepository } from '@/app/repositories/user.repository';
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
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  // Primary: HttpOnly cookie (XSS-safe)
  const cookieToken = request.cookies.get(AUTH_COOKIE_NAME)?.value ?? null;

  // Fallback: Authorization header for programmatic clients / tests
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  const token = cookieToken ?? bearerToken;

  if (!token) {
    return { error: unauthorizedError('رمز المصادقة مفقود.') };
  }

  let payload: { id: string; sv?: number };
  try {
    payload = verifyToken(token);
  } catch {
    return { error: unauthorizedError('رمز المصادقة غير صالح أو منتهي الصلاحية.') };
  }

  try {
    await connectDB();
    const userRepo = getUserRepository();
    const foundUser = await userRepo.findById(payload.id);

    if (!foundUser) {
      return { error: unauthorizedError('الجلسة غير صالحة. يرجى تسجيل الدخول مرة أخرى.') };
    }

    const tokenSessionVersion = payload.sv ?? 0;
    const currentSessionVersion = foundUser.sessionVersion ?? 0;

    if (tokenSessionVersion !== currentSessionVersion) {
      return { error: unauthorizedError('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.') };
    }

    return { userId: payload.id };
  } catch {
    return { error: unauthorizedError('تعذر التحقق من الجلسة. يرجى تسجيل الدخول مرة أخرى.') };
  }
}
