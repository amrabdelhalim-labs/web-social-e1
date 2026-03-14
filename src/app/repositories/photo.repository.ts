import type { QueryFilter } from 'mongoose';
import Photo from '@/app/models/Photo';
import type { IPhoto, PaginatedResult } from '@/app/types';
import { BaseRepository } from './base.repository';

class PhotoRepository extends BaseRepository<IPhoto> {
  constructor() {
    super(Photo);
  }

  async findByUser(userId: string, page: number, limit: number): Promise<PaginatedResult<IPhoto>> {
    return this.findPaginated(page, limit, { user: userId } as QueryFilter<IPhoto>, {
      sort: { createdAt: -1 },
    });
  }

  async findPublicFeed(page: number, limit: number): Promise<PaginatedResult<IPhoto>> {
    return this.findPaginated(page, limit, {} as QueryFilter<IPhoto>, {
      sort: { createdAt: -1 },
      populate: { path: 'user', select: 'name avatarUrl' },
    });
  }

  async updateLikesCount(photoId: string, delta: 1 | -1): Promise<IPhoto | null> {
    return this.update(photoId, { $inc: { likesCount: delta } });
  }
}

let instance: PhotoRepository | null = null;

export function getPhotoRepository(): PhotoRepository {
  if (!instance) instance = new PhotoRepository();
  return instance;
}

export { PhotoRepository };
