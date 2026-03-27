'use client';

/**
 * useMyPhotos -- Hook for User's Photo Gallery
 *
 * Fetches user's photos with pagination, supports upload, edit, delete.
 * When any request returns 401 (expired or missing session), automatically
 * calls logout() and redirects to /login so the user can re-authenticate.
 */

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getMyPhotosApi, uploadPhotoApi, updatePhotoApi, deletePhotoApi } from '@/app/lib/api';
import { useAuth } from '@/app/hooks/useAuth';
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
  const { logout } = useAuth();
  const router = useRouter();

  /** Re-directs to /login after clearing the session when any request returns 401. */
  const handleUnauthorized = useCallback(async () => {
    await logout();
    router.replace('/login');
  }, [logout, router]);

  const fetchMine = useCallback(
    async (page: number, limit: number) => {
      try {
        return await getMyPhotosApi(page, limit);
      } catch (err) {
        const status = (err as Error & { status?: number }).status;
        if (status === 401) {
          handleUnauthorized();
        }
        throw err;
      }
    },
    [handleUnauthorized]
  );

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
