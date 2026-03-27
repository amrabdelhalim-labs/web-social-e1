/**
 * Photo Serializer
 *
 * Converts a plain object from `doc.toObject()` (Mongoose) into a
 * JSON-serializable Photo value safe for API responses and Server Component
 * → Client Component prop passing.
 *
 * Used by:
 *  - src/app/api/photos/route.ts        (public feed)
 *  - src/app/api/photos/mine/route.ts   (owner's photos)
 *  - src/app/page.tsx                   (SSR initial feed)
 */

import type { Photo } from '@/app/types';

/**
 * Serializes a plain photo object (from `doc.toObject()` or a lean query result)
 * into a type-safe Photo value.
 */
export function serializePhoto(doc: Record<string, unknown>, isLiked = false): Photo {
  const user = doc.user as Record<string, unknown> | undefined;

  return {
    _id: String(doc._id),
    title: String(doc.title),
    description: doc.description ? String(doc.description) : undefined,
    imageUrl: String(doc.imageUrl),
    user: {
      _id: user ? String(user._id) : '',
      name: user ? String(user.name) : '',
      avatarUrl: user ? (user.avatarUrl as string | null) : null,
    },
    likesCount: Number(doc.likesCount ?? 0),
    isLiked,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt),
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : String(doc.updatedAt),
  };
}
