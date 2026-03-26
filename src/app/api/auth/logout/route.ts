/**
 * POST /api/auth/logout
 *
 * Clears the HttpOnly auth cookie, ending the session server-side.
 * No request body required. Always succeeds (idempotent).
 *
 * Response: { message }
 */

import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/app/lib/authCookie';

export async function POST(): Promise<NextResponse> {
  const response = NextResponse.json({ message: 'تم تسجيل الخروج بنجاح.' }, { status: 200 });
  response.cookies.delete(AUTH_COOKIE_NAME);
  return response;
}
