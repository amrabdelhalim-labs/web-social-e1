/**
 * GET /api/auth/me
 *
 * Returns the currently authenticated user's profile.
 * Auth source: HttpOnly cookie `auth-token` (primary) or Authorization: Bearer (fallback).
 *
 * Response: { data: user }
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import { authenticateRequest } from '@/app/middlewares/auth.middleware';
import { getUserRepository } from '@/app/repositories/user.repository';
import { notFoundError, serverError } from '@/app/lib/apiErrors';
import type { User } from '@/app/types';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await authenticateRequest(request);
    if (auth.error) return auth.error;

    await connectDB();
    const userRepo = getUserRepository();

    const foundUser = await userRepo.findById(auth.userId);
    if (!foundUser) return notFoundError('المستخدم غير موجود.');

    const user: User = {
      _id: foundUser._id.toString(),
      name: foundUser.name,
      email: foundUser.email,
      avatarUrl: foundUser.avatarUrl,
      createdAt: foundUser.createdAt.toISOString(),
      updatedAt: foundUser.updatedAt.toISOString(),
    };

    return NextResponse.json({ data: user }, { status: 200 });
  } catch (error) {
    console.error('Auth/me error:', error);
    return serverError();
  }
}
