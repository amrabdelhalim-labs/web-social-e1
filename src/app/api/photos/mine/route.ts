/**
 * GET /api/photos/mine
 *
 * Returns the authenticated user's photos (paginated, newest first).
 *
 * Query: ?page=1&limit=12
 * Response: { data: Photo[], pagination }
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import { authenticateRequest } from '@/app/middlewares/auth.middleware';
import { getPhotoRepository } from '@/app/repositories/photo.repository';
import { serverError } from '@/app/lib/apiErrors';
import { serializePhoto } from '@/app/lib/photoSerializer';
import { DEFAULT_PAGE_SIZE } from '@/app/config';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await authenticateRequest(request);
    if (auth.error) return auth.error;

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
    const limit = Math.min(
      50,
      Math.max(
        1,
        Number(searchParams.get('limit') ?? String(DEFAULT_PAGE_SIZE)) || DEFAULT_PAGE_SIZE
      )
    );

    await connectDB();
    const photoRepo = getPhotoRepository();

    const result = await photoRepo.findByUser(auth.userId, page, limit);

    const photos = result.rows.map((doc) =>
      serializePhoto({
        ...doc.toObject(),
        // User populate is omitted for own photos — owner knows their own identity.
        // The user section is hidden in PhotoCard when name is empty.
        user: { _id: auth.userId, name: '', avatarUrl: null },
      })
    );

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
    console.error('My photos error:', error);
    return serverError();
  }
}
