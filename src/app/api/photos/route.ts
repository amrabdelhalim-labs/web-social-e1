/**
 * GET  /api/photos — List public photos (paginated, newest first)
 * POST /api/photos — Upload a new photo (multipart/form-data, auth required)
 *
 * GET supports: ?page=1&limit=12
 */

import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { connectDB } from '@/app/lib/mongodb';
import { authenticateRequest } from '@/app/middlewares/auth.middleware';
import { getPhotoRepository } from '@/app/repositories/photo.repository';
import { getLikeRepository } from '@/app/repositories/like.repository';
import { validatePhotoInput } from '@/app/validators';
import { validationError, serverError } from '@/app/lib/apiErrors';
import { getStorageService } from '@/app/lib/storage/storage.service';
import { DEFAULT_PAGE_SIZE, MAX_FILE_SIZE, ALLOWED_IMAGE_TYPES } from '@/app/config';
import type { Photo, StorageFile } from '@/app/types';

function serializePhoto(doc: Record<string, unknown>, isLiked = false): Photo {
  const user = doc.user as Record<string, unknown> | undefined;

  return {
    _id: String(doc._id),
    title: String(doc.title),
    description: doc.description ? String(doc.description) : undefined,
    imageUrl: String(doc.imageUrl),
    user: {
      _id: user ? String(user._id) : '',
      name: user ? String(user.name) : '',
      avatarUrl: user ? (user.avatarUrl as string | null) : null,
    },
    likesCount: Number(doc.likesCount ?? 0),
    isLiked,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt),
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : String(doc.updatedAt),
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
    const limit = Math.min(
      50,
      Math.max(
        1,
        Number(searchParams.get('limit') ?? String(DEFAULT_PAGE_SIZE)) || DEFAULT_PAGE_SIZE
      )
    );

    const auth = authenticateRequest(request);
    const userId = auth.error ? null : auth.userId;

    await connectDB();
    const photoRepo = getPhotoRepository();
    const likeRepo = getLikeRepository();

    const result = await photoRepo.findPublicFeed(page, limit);

    let likedPhotoIds = new Set<string>();
    if (userId && result.rows.length > 0) {
      const photoIds = result.rows.map((p) => p._id.toString());
      const likes = await likeRepo.findAll({
        user: new Types.ObjectId(userId),
        photo: { $in: photoIds.map((id) => new Types.ObjectId(id)) },
      } as never);
      likedPhotoIds = new Set(likes.map((l) => l.photo.toString()));
    }

    const photos = result.rows.map((doc) => {
      const raw = (doc._doc ?? doc) as unknown as Record<string, unknown>;
      return serializePhoto(raw, likedPhotoIds.has(doc._id.toString()));
    });

    return NextResponse.json(
      {
        data: photos,
        pagination: {
          page: result.page,
          totalPages: result.totalPages,
          total: result.count,
          limit,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Photos list error:', error);
    return serverError();
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let uploadedUrl: string | null = null;

  try {
    const auth = authenticateRequest(request);
    if (auth.error) return auth.error;

    const formData = await request.formData();
    const title = formData.get('title') as string | null;
    const description = (formData.get('description') as string | null) ?? '';
    const file = formData.get('photo') as File | null;

    const inputErrors = validatePhotoInput({ title: title ?? '', description });
    if (inputErrors.length > 0) return validationError(inputErrors);

    if (!file || !(file instanceof File)) {
      return validationError(['ملف الصورة مطلوب.']);
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return validationError(['صيغة الملف غير مدعومة. الصيغ المسموحة: PNG, JPEG.']);
    }

    if (file.size > MAX_FILE_SIZE) {
      return validationError(['حجم الصورة يتجاوز الحد المسموح (5 ميجابايت).']);
    }

    const storage = getStorageService();
    const buffer = Buffer.from(await file.arrayBuffer());
    const storageFile: StorageFile = {
      buffer,
      originalname: file.name,
      mimetype: file.type,
      size: file.size,
    };

    const result = await storage.uploadFile(storageFile);
    uploadedUrl = result.url;

    await connectDB();
    const photoRepo = getPhotoRepository();

    const photo = await photoRepo.create({
      title: title!.trim(),
      description: description.trim() || undefined,
      imageUrl: result.url,
      user: new Types.ObjectId(auth.userId),
    } as never);

    const serialized = serializePhoto({
      ...photo._doc,
      user: { _id: auth.userId, name: '', avatarUrl: null },
    });

    return NextResponse.json(
      { data: serialized, message: 'تم رفع الصورة بنجاح.' },
      { status: 201 }
    );
  } catch (error) {
    if (uploadedUrl) {
      const storage = getStorageService();
      await storage.deleteFile(uploadedUrl).catch(() => {});
    }
    console.error('Photo upload error:', error);
    return serverError();
  }
}
