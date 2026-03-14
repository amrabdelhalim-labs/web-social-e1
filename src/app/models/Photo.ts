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
