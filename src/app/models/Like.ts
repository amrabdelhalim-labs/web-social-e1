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

likeSchema.index({ user: 1, photo: 1 }, { unique: true });
likeSchema.index({ photo: 1 });

const Like: Model<ILike> = mongoose.models.Like ?? mongoose.model<ILike>('Like', likeSchema);

export default Like;
