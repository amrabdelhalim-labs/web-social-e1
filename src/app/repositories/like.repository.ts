import { Types } from 'mongoose';
import Like from '@/app/models/Like';
import type { ILike } from '@/app/types';
import { BaseRepository } from './base.repository';

class LikeRepository extends BaseRepository<ILike> {
  constructor() {
    super(Like);
  }

  async findByUserAndPhoto(userId: string, photoId: string): Promise<ILike | null> {
    return this.findOne({ user: userId, photo: photoId });
  }

  async isLiked(userId: string, photoId: string): Promise<boolean> {
    return this.exists({ user: userId, photo: photoId });
  }

  async toggleLike(
    userId: string,
    photoId: string
  ): Promise<{ liked: boolean; like: ILike | null; removedId?: string }> {
    const existing = await this.findByUserAndPhoto(userId, photoId);

    if (existing) {
      await this.delete(existing._id.toString());
      return { liked: false, like: null, removedId: existing._id.toString() };
    }

    const like = await this.create({
      user: new Types.ObjectId(userId),
      photo: new Types.ObjectId(photoId),
    } as Partial<ILike>);
    return { liked: true, like };
  }
}

let instance: LikeRepository | null = null;

export function getLikeRepository(): LikeRepository {
  if (!instance) instance = new LikeRepository();
  return instance;
}

export { LikeRepository };
