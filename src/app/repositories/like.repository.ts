/**
 * LikeRepository
 *
 * Handles like/unlike operations for photos. The unique DB index on
 * {user, photo} acts as a second safety net, but the toggle logic
 * here uses a find-then-delete-or-create pattern to avoid relying
 * on error catching for normal control flow.
 *
 * toggleLike returns { liked: boolean } so the API route can update
 * the photo's likesCount with the correct delta (+1 or -1).
 */

import { Types } from 'mongoose';
import Like from '@/app/models/Like';
import type { ILike } from '@/app/types';
import { BaseRepository } from './base.repository';

class LikeRepository extends BaseRepository<ILike> {
  constructor() {
    super(Like);
  }

  /** Returns the like document if the user has liked the photo, null otherwise */
  async findByUserAndPhoto(userId: string, photoId: string): Promise<ILike | null> {
    return this.findOne({ user: userId, photo: photoId });
  }

  /** Lightweight check — uses Model.exists() instead of full document hydration */
  async isLiked(userId: string, photoId: string): Promise<boolean> {
    return this.exists({ user: userId, photo: photoId });
  }

  /**
   * Toggles the like status for a user/photo pair.
   *
   * Returns:
   *   { liked: true,  like: ILike }         — like was created
   *   { liked: false, like: null, removedId } — like was deleted
   *
   * ObjectId conversion is required because the Like schema declares user/photo
   * as ObjectId references — passing plain strings causes a TypeScript type error.
   */
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

/** Returns the singleton LikeRepository instance */
export function getLikeRepository(): LikeRepository {
  if (!instance) instance = new LikeRepository();
  return instance;
}

export { LikeRepository };
