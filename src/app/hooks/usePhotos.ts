'use client';

/**
 * usePhotos — Hook for Public Photo Feed
 *
 * Fetches photos with pagination, supports toggle like with optimistic update.
 */

import { useState, useCallback, useEffect } from 'react';
import { getPhotosApi, toggleLikeApi } from '@/app/lib/api';
import { DEFAULT_PAGE_SIZE } from '@/app/config';
import type { Photo } from '@/app/types';

export interface UsePhotosReturn {
  photos: Photo[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    totalPages: number;
    total: number;
    limit: number;
  };
  loadMore: () => void;
  refresh: () => void;
  toggleLike: (photoId: string) => Promise<void>;
}

export function usePhotos(): UsePhotosReturn {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: DEFAULT_PAGE_SIZE,
  });

  const fetchPhotos = useCallback(async (page = 1, append = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPhotosApi(page, DEFAULT_PAGE_SIZE);
      setPhotos((prev) => (append ? [...prev, ...res.data] : res.data));
      setPagination(res.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحميل الصور.');
      if (!append) setPhotos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPhotos(1, false);
  }, [fetchPhotos]);

  const loadMore = useCallback(() => {
    const { page, totalPages } = pagination;
    if (page >= totalPages || loading) return;
    fetchPhotos(page + 1, true);
  }, [pagination, loading, fetchPhotos]);

  const refresh = useCallback(() => {
    fetchPhotos(1, false);
  }, [fetchPhotos]);

  const toggleLike = useCallback(async (photoId: string) => {
    const photo = photos.find((p) => p._id === photoId);
    if (!photo) return;

    const prevLiked = photo.isLiked ?? false;
    const prevCount = photo.likesCount;

    setPhotos((prev) =>
      prev.map((p) =>
        p._id === photoId
          ? {
              ...p,
              isLiked: !prevLiked,
              likesCount: prevLiked ? p.likesCount - 1 : p.likesCount + 1,
            }
          : p
      )
    );

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
  }, [photos]);

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
