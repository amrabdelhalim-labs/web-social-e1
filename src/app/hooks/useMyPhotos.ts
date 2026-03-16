'use client';

/**
 * useMyPhotos — Hook for User's Photo Gallery
 *
 * Fetches user's photos with pagination, supports upload, edit, delete.
 */

import { useState, useCallback, useEffect } from 'react';
import { getMyPhotosApi, uploadPhotoApi, updatePhotoApi, deletePhotoApi } from '@/app/lib/api';
import { DEFAULT_PAGE_SIZE } from '@/app/config';
import type { Photo, UpdatePhotoInput } from '@/app/types';

export interface UseMyPhotosReturn {
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
  upload: (file: File, title: string, description?: string) => Promise<void>;
  update: (id: string, input: UpdatePhotoInput) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export function useMyPhotos(): UseMyPhotosReturn {
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
      const res = await getMyPhotosApi(page, DEFAULT_PAGE_SIZE);
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

  const upload = useCallback(async (file: File, title: string, description?: string) => {
    const res = await uploadPhotoApi(file, title, description);
    if (res.data) {
      setPhotos((prev) => [res.data!, ...prev]);
      setPagination((p) => ({ ...p, total: p.total + 1 }));
    }
  }, []);

  const update = useCallback(async (id: string, input: UpdatePhotoInput) => {
    const res = await updatePhotoApi(id, input);
    if (res.data) {
      setPhotos((prev) => prev.map((p) => (p._id === id ? { ...p, ...res.data! } : p)));
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    await deletePhotoApi(id);
    setPhotos((prev) => prev.filter((p) => p._id !== id));
    setPagination((p) => ({ ...p, total: Math.max(0, p.total - 1) }));
  }, []);

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
