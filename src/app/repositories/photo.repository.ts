/**
 * PhotoRepository
 *
 * Encapsulates all data access for the Photo model.
 *
 * findPublicFeed populates the user sub-document (name + avatarUrl only)
 * to avoid a separate query per photo on the public feed page.
 *
 * updateLikesCount uses MongoDB's $inc operator for atomic increment/decrement
 * — safe under concurrent like/unlike requests without race conditions.
 */

import type { QueryFilter } from 'mongoose';
import Photo from '@/app/models/Photo';
import type { IPhoto, PaginatedResult } from '@/app/types';
import { BaseRepository } from './base.repository';

class PhotoRepository extends BaseRepository<IPhoto> {
  constructor() {
    super(Photo);
  }

  /** Returns paginated photos for a single user, newest first */
  async findByUser(userId: string, page: number, limit: number): Promise<PaginatedResult<IPhoto>> {
    return this.findPaginated(page, limit, { user: userId } as QueryFilter<IPhoto>, {
      sort: { createdAt: -1 },
    });
  }

  /**
   * Returns the public photo feed, newest first, with user info populated.
   * Only selects name and avatarUrl from the user document to minimize payload.
   */
  async findPublicFeed(page: number, limit: number): Promise<PaginatedResult<IPhoto>> {
    return this.findPaginated(page, limit, {} as QueryFilter<IPhoto>, {
      sort: { createdAt: -1 },
      populate: { path: 'user', select: 'name avatarUrl' },
    });
  }

  /**
   * Atomically increments (+1) or decrements (-1) the cached like counter.
   * Returns the updated photo document.
   */
  async updateLikesCount(photoId: string, delta: 1 | -1): Promise<IPhoto | null> {
    return this.update(photoId, { $inc: { likesCount: delta } });
  }
}

let instance: PhotoRepository | null = null;

/** Returns the singleton PhotoRepository instance */
export function getPhotoRepository(): PhotoRepository {
  if (!instance) instance = new PhotoRepository();
  return instance;
}

export { PhotoRepository };
