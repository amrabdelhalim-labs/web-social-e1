/**
 * Home Page — Server Component
 *
 * Fetches the first page of public photos directly from the database,
 * renders the initial HTML on the server (SSR), and hands off to
 * HomePageFeed (client component) for interactive pagination and likes.
 *
 * Benefits over the previous 'use client' approach:
 *  - Initial content is SSR → better SEO and faster First Contentful Paint
 *  - No loading flash for the first page of photos
 *  - Liked status is computed server-side for authenticated users
 */

import { cookies } from 'next/headers';
import { Typography } from '@mui/material';
import { Types } from 'mongoose';
import { MainLayout } from '@/app/components/layout/MainLayout';
import { HomePageFeed } from '@/app/components/photos/HomePageFeed';
import { connectDB } from '@/app/lib/mongodb';
import { getPhotoRepository } from '@/app/repositories/photo.repository';
import { getLikeRepository } from '@/app/repositories/like.repository';
import { verifyToken } from '@/app/lib/auth';
import { serializePhoto } from '@/app/lib/photoSerializer';
import { AUTH_COOKIE_NAME } from '@/app/lib/authCookie';
import { DEFAULT_PAGE_SIZE } from '@/app/config';
import type { Photo } from '@/app/types';

/** DB-backed home feed — skip static prerender at build time (Docker/CI has no MongoDB). */
export const dynamic = 'force-dynamic';

async function fetchInitialPhotos(): Promise<{
  photos: Photo[];
  pagination: { page: number; totalPages: number; total: number; limit: number };
}> {
  // Determine authenticated user from cookie for liked-status calculation
  let userId: string | null = null;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (token) {
      const payload = verifyToken(token);
      userId = payload.id;
    }
  } catch {
    // Invalid/expired cookie — treat as guest
  }

  await connectDB();
  const photoRepo = getPhotoRepository();
  const likeRepo = getLikeRepository();

  const result = await photoRepo.findPublicFeed(1, DEFAULT_PAGE_SIZE);

  let likedPhotoIds = new Set<string>();
  if (userId && result.rows.length > 0) {
    const photoIds = result.rows.map((p) => p._id.toString());
    const likes = await likeRepo.findAll({
      user: new Types.ObjectId(userId),
      photo: { $in: photoIds.map((id) => new Types.ObjectId(id)) },
    } as never);
    likedPhotoIds = new Set(likes.map((l) => l.photo.toString()));
  }

  const photos = result.rows.map((doc) =>
    serializePhoto(doc.toObject(), likedPhotoIds.has(doc._id.toString()))
  );

  return {
    photos,
    pagination: {
      page: result.page,
      totalPages: result.totalPages,
      total: result.count,
      limit: DEFAULT_PAGE_SIZE,
    },
  };
}

export default async function HomePage() {
  let photos: Photo[] = [];
  let pagination = { page: 1, totalPages: 1, total: 0, limit: DEFAULT_PAGE_SIZE };

  try {
    const result = await fetchInitialPhotos();
    photos = result.photos;
    pagination = result.pagination;
  } catch {
    // DB unavailable at render time — show empty feed; client-side load-more still works
  }

  return (
    <MainLayout>
      {photos.length === 0 ? (
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ py: { xs: 6, sm: 8 }, textAlign: 'center' }}
        >
          لا توجد صور لعرضها بعد.
        </Typography>
      ) : (
        <HomePageFeed initialPhotos={photos} initialPagination={pagination} />
      )}
    </MainLayout>
  );
}
