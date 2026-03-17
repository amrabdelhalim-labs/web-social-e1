'use client';

/**
 * useMyPhotos — Hook for User's Photo Gallery
 *
 * Fetches user's photos with pagination, supports upload, edit, delete.
 */

import { useCallback } from 'react';
import { getMyPhotosApi, uploadPhotoApi, updatePhotoApi, deletePhotoApi } from '@/app/lib/api';
import type { Photo, UpdatePhotoInput } from '@/app/types';
import { usePaginatedPhotos, type PhotosPagination } from './usePaginatedPhotos';

export interface UseMyPhotosReturn {
  photos: Photo[];
  loading: boolean;
  error: string | null;
  pagination: PhotosPagination;
  loadMore: () => void;
  refresh: () => void;
  upload: (file: File, title: string, description?: string) => Promise<void>;
  update: (id: string, input: UpdatePhotoInput) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export function useMyPhotos(): UseMyPhotosReturn {
  const fetchMine = useCallback((page: number, limit: number) => getMyPhotosApi(page, limit), []);

  const { photos, setPhotos, loading, error, pagination, setPagination, loadMore, refresh } =
    usePaginatedPhotos({
      fetchPage: fetchMine,
    });

  const upload = useCallback(
    async (file: File, title: string, description?: string) => {
      const res = await uploadPhotoApi(file, title, description);
      if (res.data) {
        setPhotos((prev) => [res.data!, ...prev]);
        setPagination((p) => ({ ...p, total: p.total + 1 }));
      }
    },
    [setPagination, setPhotos]
  );

  const update = useCallback(
    async (id: string, input: UpdatePhotoInput) => {
      const res = await updatePhotoApi(id, input);
      if (res.data) {
        setPhotos((prev) => prev.map((p) => (p._id === id ? { ...p, ...res.data! } : p)));
      }
    },
    [setPhotos]
  );

  const remove = useCallback(
    async (id: string) => {
      await deletePhotoApi(id);
      setPhotos((prev) => prev.filter((p) => p._id !== id));
      setPagination((p) => ({ ...p, total: Math.max(0, p.total - 1) }));
    },
    [setPagination, setPhotos]
  );

  return {
    photos,
    loading,
    error,
    pagination,
    loadMore,
    refresh,
    upload,
    update,
    remove,
  };
}
