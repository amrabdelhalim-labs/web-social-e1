/**
 * PUT /api/profile/password
 *
 * Changes the authenticated user's password.
 * Requires the current password for verification.
 *
 * Body: { currentPassword, newPassword, confirmPassword }
 * Response: { message }
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import { comparePassword, hashPassword } from '@/app/lib/auth';
import { authenticateRequest } from '@/app/middlewares/auth.middleware';
import { getUserRepository } from '@/app/repositories/user.repository';
import { validateChangePasswordInput } from '@/app/validators';
import {
  validationError,
  notFoundError,
  unauthorizedError,
  serverError,
} from '@/app/lib/apiErrors';

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = authenticateRequest(request);
    if (auth.error) return auth.error;

    const body = await request.json();

    const errors = validateChangePasswordInput(body);
    if (errors.length > 0) return validationError(errors);

    await connectDB();
    const userRepo = getUserRepository();

    const foundUser = await userRepo.findById(auth.userId);
    if (!foundUser) return notFoundError('المستخدم غير موجود.');

    const isMatch = await comparePassword(body.currentPassword, foundUser.password);
    if (!isMatch) return unauthorizedError('كلمة المرور الحالية غير صحيحة.');

    const hashed = await hashPassword(body.newPassword);
    await userRepo.update(auth.userId, { password: hashed });

    return NextResponse.json({ message: 'تم تغيير كلمة المرور بنجاح.' }, { status: 200 });
  } catch (error) {
    console.error('Password change error:', error);
    return serverError();
  }
}
