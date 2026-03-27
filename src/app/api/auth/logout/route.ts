/**
 * POST /api/auth/logout
 *
 * Clears the HttpOnly auth cookie, ending the session server-side.
 * No request body required. Always succeeds (idempotent).
 *
 * Response: { message }
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/app/lib/auth';
import { connectDB } from '@/app/lib/mongodb';
import { getUserRepository } from '@/app/repositories/user.repository';
import { AUTH_COOKIE_NAME, clearAuthCookie } from '@/app/lib/authCookie';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const response = NextResponse.json({ message: 'تم تسجيل الخروج بنجاح.' }, { status: 200 });

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (token) {
    try {
      const payload = verifyToken(token);
      await connectDB();
      const userRepo = getUserRepository();
      await userRepo.bumpSessionVersion(payload.id);
    } catch {
      // Token may already be invalid/expired — still clear cookie below.
    }
  }

  clearAuthCookie(response, request);
  return response;
}
