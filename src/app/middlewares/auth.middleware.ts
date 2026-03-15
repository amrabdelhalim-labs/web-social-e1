/**
 * Authentication Middleware
 *
 * Extracts and verifies the JWT from the Authorization header.
 * Returns a discriminated union so callers can branch on success or failure
 * without throwing exceptions in route handlers.
 *
 * Expected header format:
 *   Authorization: Bearer <jwt>
 *
 * Usage in API routes:
 *   const auth = authenticateRequest(request);
 *   if (auth.error) return auth.error;   // 401 response
 *   const { userId } = auth;             // guaranteed string
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/app/lib/auth';
import { unauthorizedError } from '@/app/lib/apiErrors';
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
 * Validates the Bearer token in the Authorization header.
 * Returns { userId } on success, or { error: NextResponse } on failure.
 * Never throws — all error paths return a typed 401 response.
 */
export function authenticateRequest(request: NextRequest): AuthResult {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: unauthorizedError('رمز المصادقة مفقود.') };
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyToken(token);
    return { userId: payload.id };
  } catch {
    return { error: unauthorizedError('رمز المصادقة غير صالح أو منتهي الصلاحية.') };
  }
}
