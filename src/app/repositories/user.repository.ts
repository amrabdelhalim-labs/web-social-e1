/**
 * UserRepository
 *
 * Encapsulates all data access for the User model.
 * Extends BaseRepository with user-specific queries and cascade deletion.
 *
 * deleteUserCascade runs inside a MongoDB transaction to guarantee atomicity:
 * if any step fails, the entire deletion is rolled back. File cleanup (storage)
 * must be handled by the caller after the transaction succeeds.
 */

import mongoose from 'mongoose';
import User from '@/app/models/User';
import Photo from '@/app/models/Photo';
import Like from '@/app/models/Like';
import type { IUser } from '@/app/types';
import { BaseRepository } from './base.repository';

class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(User);
  }

  /** Finds a user by email (case-insensitive, trimmed) */
  async findByEmail(email: string): Promise<IUser | null> {
    return this.findOne({ email: email.toLowerCase().trim() });
  }

  /** Lightweight check — does not hydrate the full user document */
  async emailExists(email: string): Promise<boolean> {
    return this.exists({ email: email.toLowerCase().trim() });
  }

  /**
   * Atomically deletes the user and all related data in a MongoDB transaction.
   *
   * Deletion order (preserves referential consistency):
   *   1. Likes on the user's photos (must go before photos)
   *   2. Likes placed by the user (their own likes on others' photos)
   *   3. The user's photos
   *   4. The user document itself
   *
   * Note: Storage file cleanup (avatarUrl, imageUrls) must happen in the caller
   * after this method returns successfully — file deletion is not transactional.
   */
  async deleteUserCascade(userId: string): Promise<IUser | null> {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const photos = await Photo.find({ user: userId }, '_id imageUrl', { session });
      const photoIds = photos.map((photo) => photo._id);

      if (photoIds.length > 0) {
        await Like.deleteMany({ photo: { $in: photoIds } }, { session });
      }

      await Like.deleteMany({ user: userId }, { session });
      await Photo.deleteMany({ user: userId }, { session });

      const deletedUser = await User.findByIdAndDelete(userId, { session });

      await session.commitTransaction();
      return deletedUser;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

let instance: UserRepository | null = null;

/** Returns the singleton UserRepository instance */
export function getUserRepository(): UserRepository {
  if (!instance) instance = new UserRepository();
  return instance;
}

export { UserRepository };
