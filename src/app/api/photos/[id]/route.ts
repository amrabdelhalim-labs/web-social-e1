/**
 * PUT    /api/photos/[id] — Update photo title and/or description (owner only)
 * DELETE /api/photos/[id] — Delete a photo + its file + associated likes (owner only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import { authenticateRequest } from '@/app/middlewares/auth.middleware';
import { getPhotoRepository } from '@/app/repositories/photo.repository';
import { getLikeRepository } from '@/app/repositories/like.repository';
import { validateUpdatePhotoInput } from '@/app/validators';
import { validationError, notFoundError, forbiddenError, serverError } from '@/app/lib/apiErrors';
import { getStorageService } from '@/app/lib/storage/storage.service';
import type { Photo } from '@/app/types';

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const auth = authenticateRequest(request);
    if (auth.error) return auth.error;

    const { id } = await context.params;
    const body = await request.json();

    const errors = validateUpdatePhotoInput(body);
    if (errors.length > 0) return validationError(errors);

    await connectDB();
    const photoRepo = getPhotoRepository();

    const photo = await photoRepo.findById(id);
    if (!photo) return notFoundError('الصورة غير موجودة.');

    if (photo.user.toString() !== auth.userId) {
      return forbiddenError('لا يمكنك تعديل صورة لا تملكها.');
    }

    const updateData: Record<string, string | undefined> = {};
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.description !== undefined)
      updateData.description = body.description.trim() || undefined;

    const updated = await photoRepo.update(id, updateData);
    if (!updated) return notFoundError('الصورة غير موجودة.');

    const result: Photo = {
      _id: updated._id.toString(),
      title: updated.title,
      description: updated.description,
      imageUrl: updated.imageUrl,
      user: { _id: auth.userId, name: '', avatarUrl: null },
      likesCount: updated.likesCount,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };

    return NextResponse.json({ data: result, message: 'تم تحديث الصورة بنجاح.' }, { status: 200 });
  } catch (error) {
    console.error('Photo update error:', error);
    return serverError();
  }
}

export async function DELETE(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const auth = authenticateRequest(request);
    if (auth.error) return auth.error;

    const { id } = await context.params;

    await connectDB();
    const photoRepo = getPhotoRepository();
    const likeRepo = getLikeRepository();

    const photo = await photoRepo.findById(id);
    if (!photo) return notFoundError('الصورة غير موجودة.');

    if (photo.user.toString() !== auth.userId) {
      return forbiddenError('لا يمكنك حذف صورة لا تملكها.');
    }

    await likeRepo.deleteWhere({ photo: photo._id } as never);

    const storage = getStorageService();
    await storage.deleteFile(photo.imageUrl).catch(() => {});

    await photoRepo.delete(id);

    return NextResponse.json({ message: 'تم حذف الصورة بنجاح.' }, { status: 200 });
  } catch (error) {
    console.error('Photo deletion error:', error);
    return serverError();
  }
}
