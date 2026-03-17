'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { DEFAULT_PAGE_SIZE } from '@/app/config';
import type { PaginatedApiResponse, Photo } from '@/app/types';

export interface PhotosPagination {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
}

interface UsePaginatedPhotosParams {
  fetchPage: (page: number, limit: number) => Promise<PaginatedApiResponse<Photo>>;
  errorMessage?: string;
}

interface UsePaginatedPhotosResult {
  photos: Photo[];
  setPhotos: Dispatch<SetStateAction<Photo[]>>;
  loading: boolean;
  error: string | null;
  pagination: PhotosPagination;
  setPagination: Dispatch<SetStateAction<PhotosPagination>>;
  loadMore: () => void;
  refresh: () => void;
}

export function usePaginatedPhotos({
  fetchPage,
  errorMessage = 'فشل تحميل الصور.',
}: UsePaginatedPhotosParams): UsePaginatedPhotosResult {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PhotosPagination>({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: DEFAULT_PAGE_SIZE,
  });

  const fetchPhotos = useCallback(
    async (page = 1, append = false) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchPage(page, DEFAULT_PAGE_SIZE);
        setPhotos((prev) => (append ? [...prev, ...res.data] : res.data));
        setPagination(res.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : errorMessage);
        if (!append) setPhotos([]);
      } finally {
        setLoading(false);
      }
    },
    [errorMessage, fetchPage]
  );

  useEffect(() => {
    fetchPhotos(1, false);
  }, [fetchPhotos]);

  const loadMore = useCallback(() => {
    const { page, totalPages } = pagination;
    if (page >= totalPages || loading) return;
    fetchPhotos(page + 1, true);
  }, [fetchPhotos, loading, pagination]);

  const refresh = useCallback(() => {
    fetchPhotos(1, false);
  }, [fetchPhotos]);

  return {
    photos,
    setPhotos,
    loading,
    error,
    pagination,
    setPagination,
    loadMore,
    refresh,
  };
}
