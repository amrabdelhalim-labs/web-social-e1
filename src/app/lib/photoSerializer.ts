/**
 * Photo Serializer
 *
 * Converts a raw Mongoose document (or its _doc object) into a plain,
 * JSON-serializable Photo object safe for use in both API responses and
 * Server Component → Client Component prop passing.
 *
 * Used by:
 *  - src/app/api/photos/route.ts
 *  - src/app/page.tsx (server-side initial data fetch)
 */

import type { Photo } from '@/app/types';

/**
 * Serializes a raw photo document (plain object from Mongoose _doc or lean query)
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
