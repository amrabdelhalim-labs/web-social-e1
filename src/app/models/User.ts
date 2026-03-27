/**
 * User Mongoose Model
 *
 * Represents a registered user. Passwords are stored as bcrypt hashes (never plain text).
 * avatarUrl is null by default — a null value causes the UI to render an auto-generated
 * initials avatar instead of an image.
 *
 * HMR safety: mongoose.models.User is reused on hot reloads to prevent
 * "Cannot overwrite model once compiled" errors in Next.js development mode.
 */

import mongoose, { Model, Schema } from 'mongoose';
import type { IUser } from '@/app/types';

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    /** bcrypt hash — never store plain text */
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    /** URL from storage service. null = show MUI Avatar initials fallback */
    avatarUrl: {
      type: String,
      default: null,
      trim: true,
    },
    /**
     * Session version used to revoke previously-issued JWTs.
     * Incrementing this value invalidates all older tokens immediately.
     */
    sessionVersion: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

const User: Model<IUser> = mongoose.models.User ?? mongoose.model<IUser>('User', userSchema);

export default User;
