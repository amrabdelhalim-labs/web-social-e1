/**
 * POST /api/photos/[id]/like
 *
 * Toggles like/unlike for the authenticated user on a specific photo.
 * Updates the photo's cached likesCount accordingly.
 *
 * Response: { data: { liked: boolean, likesCount: number } }
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import { authenticateRequest } from '@/app/middlewares/auth.middleware';
import { getPhotoRepository } from '@/app/repositories/photo.repository';
import { getLikeRepository } from '@/app/repositories/like.repository';
import { notFoundError, serverError } from '@/app/lib/apiErrors';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const auth = authenticateRequest(request);
    if (auth.error) return auth.error;

    const { id: photoId } = await context.params;

    await connectDB();
    const photoRepo = getPhotoRepository();
    const likeRepo = getLikeRepository();

    const photo = await photoRepo.findById(photoId);
    if (!photo) return notFoundError('الصورة غير موجودة.');

    const result = await likeRepo.toggleLike(auth.userId, photoId);

    const delta = result.liked ? 1 : -1;
    const updatedPhoto = await photoRepo.updateLikesCount(photoId, delta);
    const likesCount = updatedPhoto?.likesCount ?? Math.max(0, photo.likesCount + delta);

    return NextResponse.json({ data: { liked: result.liked, likesCount } }, { status: 200 });
  } catch (error) {
    console.error('Like toggle error:', error);
    return serverError();
  }
}
