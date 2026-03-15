/**
 * Photo Mongoose Model
 *
 * Represents a user-uploaded photo with a title and optional description.
 * imageUrl points to the file in the active storage backend (local/Cloudinary/S3).
 *
 * likesCount is a denormalized cached counter updated with $inc on every toggle
 * to avoid an expensive COUNT query on the Like collection when listing photos.
 *
 * Indexes:
 *   - user:1      — fast lookup of photos by owner (my-photos page)
 *   - createdAt:-1 — newest-first ordering for public feed
 */

import mongoose, { Model, Schema } from 'mongoose';
import type { IPhoto } from '@/app/types';

const photoSchema = new Schema<IPhoto>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    /** Full URL or path returned by the Storage Service */
    imageUrl: {
      type: String,
      required: true,
      trim: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    /** Cached like count — updated via $inc; avoids COUNT on every feed query */
    likesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

photoSchema.index({ user: 1 });
photoSchema.index({ createdAt: -1 });

const Photo: Model<IPhoto> = mongoose.models.Photo ?? mongoose.model<IPhoto>('Photo', photoSchema);

export default Photo;
