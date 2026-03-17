'use client';

/**
 * usePhotos — Hook for Public Photo Feed
 *
 * Fetches photos with pagination, supports toggle like with optimistic update.
 */

import { useCallback } from 'react';
import { getPhotosApi, toggleLikeApi } from '@/app/lib/api';
import type { Photo } from '@/app/types';
import { usePaginatedPhotos, type PhotosPagination } from './usePaginatedPhotos';

export interface UsePhotosReturn {
  photos: Photo[];
  loading: boolean;
  error: string | null;
  pagination: PhotosPagination;
  loadMore: () => void;
  refresh: () => void;
  toggleLike: (photoId: string) => Promise<void>;
}

export function usePhotos(): UsePhotosReturn {
  const fetchPublicPhotos = useCallback(
    (page: number, limit: number) => getPhotosApi(page, limit),
    []
  );

  const { photos, setPhotos, loading, error, pagination, loadMore, refresh } = usePaginatedPhotos({
    fetchPage: fetchPublicPhotos,
  });

  const toggleLike = useCallback(
    async (photoId: string) => {
      let prevLiked = false;
      let prevCount = 0;
      let found = false;

      setPhotos((prev) =>
        prev.map((p) => {
          if (p._id !== photoId) return p;
          found = true;
          prevLiked = p.isLiked ?? false;
          prevCount = p.likesCount;
          return {
            ...p,
            isLiked: !prevLiked,
            likesCount: prevLiked ? p.likesCount - 1 : p.likesCount + 1,
          };
        })
      );

      if (!found) return;

      try {
        const res = await toggleLikeApi(photoId);
        if (res.data) {
          setPhotos((prev) =>
            prev.map((p) =>
              p._id === photoId
                ? { ...p, isLiked: res.data!.liked, likesCount: res.data!.likesCount }
                : p
            )
          );
        }
      } catch {
        setPhotos((prev) =>
          prev.map((p) =>
            p._id === photoId ? { ...p, isLiked: prevLiked, likesCount: prevCount } : p
          )
        );
      }
    },
    [setPhotos]
  );

  return {
    photos,
    loading,
    error,
    pagination,
    loadMore,
    refresh,
    toggleLike,
  };
}
