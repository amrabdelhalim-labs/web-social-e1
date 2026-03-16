/**
 * PUT    /api/profile — Update user name and/or email
 * DELETE /api/profile — Delete user account (requires password confirmation, cascade)
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import { comparePassword } from '@/app/lib/auth';
import { authenticateRequest } from '@/app/middlewares/auth.middleware';
import { getUserRepository } from '@/app/repositories/user.repository';
import { getPhotoRepository } from '@/app/repositories/photo.repository';
import { validateUpdateUserInput } from '@/app/validators';
import {
  validationError,
  conflictError,
  notFoundError,
  unauthorizedError,
  serverError,
} from '@/app/lib/apiErrors';
import { getStorageService } from '@/app/lib/storage/storage.service';
import type { User } from '@/app/types';

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = authenticateRequest(request);
    if (auth.error) return auth.error;

    const body = await request.json();

    const errors = validateUpdateUserInput(body);
    if (errors.length > 0) return validationError(errors);

    await connectDB();
    const userRepo = getUserRepository();

    if (body.email) {
      const trimmedEmail = body.email.trim().toLowerCase();
      const existing = await userRepo.findByEmail(trimmedEmail);
      if (existing && existing._id.toString() !== auth.userId) {
        return conflictError('البريد الإلكتروني مُسجّل مسبقًا.');
      }
    }

    const updateData: Record<string, string> = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.email !== undefined) updateData.email = body.email.trim().toLowerCase();

    const updated = await userRepo.update(auth.userId, updateData);
    if (!updated) return notFoundError('المستخدم غير موجود.');

    const user: User = {
      _id: updated._id.toString(),
      name: updated.name,
      email: updated.email,
      avatarUrl: updated.avatarUrl,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };

    return NextResponse.json({ data: user, message: 'تم تحديث البيانات بنجاح.' }, { status: 200 });
  } catch (error) {
    console.error('Profile update error:', error);
    return serverError();
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = authenticateRequest(request);
    if (auth.error) return auth.error;

    let body: { password?: string };
    try {
      body = await request.json();
    } catch {
      return validationError(['صيغة الطلب غير صحيحة.']);
    }
    if (!body || typeof body.password !== 'string' || !body.password.trim()) {
      return validationError(['كلمة المرور مطلوبة لتأكيد حذف الحساب.']);
    }

    await connectDB();
    const userRepo = getUserRepository();
    const photoRepo = getPhotoRepository();

    const foundUser = await userRepo.findById(auth.userId);
    if (!foundUser) return notFoundError('المستخدم غير موجود.');

    const isMatch = await comparePassword(body.password.trim(), foundUser.password);
    if (!isMatch) return unauthorizedError('كلمة المرور غير صحيحة.');

    const storage = getStorageService();

    const userPhotos = await photoRepo.findAll({ user: auth.userId } as never);
    const filesToDelete = userPhotos.map((p) => p.imageUrl);
    if (foundUser.avatarUrl) filesToDelete.push(foundUser.avatarUrl);

    await userRepo.deleteUserCascade(auth.userId);

    if (filesToDelete.length > 0) {
      await storage.deleteFiles(filesToDelete);
    }

    return NextResponse.json({ message: 'تم حذف الحساب نهائيًا.' }, { status: 200 });
  } catch (error) {
    console.error('Account deletion error:', error);
    return serverError();
  }
}
