/**
 * Like Mongoose Model
 *
 * Junction document linking a user to a photo they liked.
 * The unique compound index {user, photo} enforces the one-like-per-user constraint
 * at the database level, preventing duplicates even under concurrent requests.
 *
 * updatedAt is disabled — likes are immutable after creation (toggle = delete + create).
 *
 * Indexes:
 *   - {user:1, photo:1} unique — prevents duplicate likes, enables fast isLiked checks
 *   - photo:1               — fast bulk deletion of likes when a photo is deleted
 */

import mongoose, { Model, Schema } from 'mongoose';
import type { ILike } from '@/app/types';

const likeSchema = new Schema<ILike>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    photo: {
      type: Schema.Types.ObjectId,
      ref: 'Photo',
      required: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

/** Enforces one like per user per photo at DB level */
likeSchema.index({ user: 1, photo: 1 }, { unique: true });
/** Supports bulk cascade deletion when a photo is removed */
likeSchema.index({ photo: 1 });

const Like: Model<ILike> = mongoose.models.Like ?? mongoose.model<ILike>('Like', likeSchema);

export default Like;
