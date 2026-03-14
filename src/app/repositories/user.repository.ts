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

  async findByEmail(email: string): Promise<IUser | null> {
    return this.findOne({ email: email.toLowerCase().trim() });
  }

  async emailExists(email: string): Promise<boolean> {
    return this.exists({ email: email.toLowerCase().trim() });
  }

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

export function getUserRepository(): UserRepository {
  if (!instance) instance = new UserRepository();
  return instance;
}

export { UserRepository };
