/**
 * PUT    /api/profile/avatar — Upload or replace the user's avatar (multipart/form-data)
 * DELETE /api/profile/avatar — Remove the avatar, revert to default (null)
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import { authenticateRequest } from '@/app/middlewares/auth.middleware';
import { getUserRepository } from '@/app/repositories/user.repository';
import { notFoundError, validationError, serverError } from '@/app/lib/apiErrors';
import { getStorageService } from '@/app/lib/storage/storage.service';
import { AVATAR_MAX_FILE_SIZE, ALLOWED_IMAGE_TYPES } from '@/app/config';
import type { User, StorageFile } from '@/app/types';

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = authenticateRequest(request);
    if (auth.error) return auth.error;

    const formData = await request.formData();
    const file = formData.get('avatar') as File | null;

    if (!file || !(file instanceof File)) {
      return validationError(['ملف الصورة مطلوب.']);
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return validationError(['صيغة الملف غير مدعومة. الصيغ المسموحة: PNG, JPEG.']);
    }

    if (file.size > AVATAR_MAX_FILE_SIZE) {
      return validationError(['حجم الصورة يتجاوز الحد المسموح (2 ميجابايت).']);
    }

    await connectDB();
    const userRepo = getUserRepository();
    const storage = getStorageService();

    const foundUser = await userRepo.findById(auth.userId);
    if (!foundUser) return notFoundError('المستخدم غير موجود.');

    const buffer = Buffer.from(await file.arrayBuffer());
    const storageFile: StorageFile = {
      buffer,
      originalname: file.name,
      mimetype: file.type,
      size: file.size,
    };

    const result = await storage.uploadFile(storageFile);

    if (foundUser.avatarUrl) {
      await storage.deleteFile(foundUser.avatarUrl).catch(() => {});
    }

    const updated = await userRepo.update(auth.userId, { avatarUrl: result.url });
    if (!updated) return notFoundError('المستخدم غير موجود.');

    const user: User = {
      _id: updated._id.toString(),
      name: updated.name,
      email: updated.email,
      avatarUrl: updated.avatarUrl,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };

    return NextResponse.json(
      { data: user, message: 'تم تحديث صورة الملف الشخصي.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Avatar upload error:', error);
    return serverError();
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = authenticateRequest(request);
    if (auth.error) return auth.error;

    await connectDB();
    const userRepo = getUserRepository();
    const storage = getStorageService();

    const foundUser = await userRepo.findById(auth.userId);
    if (!foundUser) return notFoundError('المستخدم غير موجود.');

    if (foundUser.avatarUrl) {
      await storage.deleteFile(foundUser.avatarUrl).catch(() => {});
    }

    const updated = await userRepo.update(auth.userId, { avatarUrl: null as never });
    if (!updated) return notFoundError('المستخدم غير موجود.');

    const user: User = {
      _id: updated._id.toString(),
      name: updated.name,
      email: updated.email,
      avatarUrl: null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };

    return NextResponse.json({ data: user, message: 'تم حذف صورة الملف الشخصي.' }, { status: 200 });
  } catch (error) {
    console.error('Avatar deletion error:', error);
    return serverError();
  }
}
