/**
 * POST /api/auth/login
 *
 * Authenticates a user by email and password.
 * Sets an HttpOnly session cookie and returns the user object.
 *
 * Body: { email, password }
 * Response: { data: { user }, message }
 *
 * Security: the JWT is stored in an HttpOnly cookie, not returned in the
 * response body, making it inaccessible to JavaScript (XSS-safe).
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import { comparePassword, generateToken } from '@/app/lib/auth';
import { getUserRepository } from '@/app/repositories/user.repository';
import { validateLoginInput } from '@/app/validators';
import { validationError, unauthorizedError, serverError } from '@/app/lib/apiErrors';
import { AUTH_COOKIE_OPTIONS, AUTH_COOKIE_NAME } from '@/app/lib/authCookie';
import type { User } from '@/app/types';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    const errors = validateLoginInput(body);
    if (errors.length > 0) return validationError(errors);

    await connectDB();
    const userRepo = getUserRepository();

    const foundUser = await userRepo.findByEmail(body.email);
    if (!foundUser) {
      return unauthorizedError('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
    }

    const isMatch = await comparePassword(body.password, foundUser.password);
    if (!isMatch) {
      return unauthorizedError('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
    }

    const token = generateToken(foundUser._id.toString());

    const user: User = {
      _id: foundUser._id.toString(),
      name: foundUser.name,
      email: foundUser.email,
      avatarUrl: foundUser.avatarUrl,
      createdAt: foundUser.createdAt.toISOString(),
      updatedAt: foundUser.updatedAt.toISOString(),
    };

    const response = NextResponse.json(
      { data: { user }, message: 'تم تسجيل الدخول بنجاح.' },
      { status: 200 }
    );
    response.cookies.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return serverError();
  }
}
