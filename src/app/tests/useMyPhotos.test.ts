/**
 * useMyPhotos Hook Tests
 *
 * Tests current user's photos: list, upload, update, and remove.
 * Covers the 401 handler: on Unauthorized, logout() is called and
 * the user is redirected to /login.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMyPhotos } from '@/app/hooks/useMyPhotos';
import * as api from '@/app/lib/api';

// ─── Stable mock functions via vi.hoisted ─────────────────────────────────────
// All functions AND the router object itself must be hoisted so they are the
// same reference across every render of the hook. Otherwise useCallback deps
// change on every render and usePaginatedPhotos useEffect re-fires infinitely.

const { mockReplace, mockPush, mockRouter, mockLogout } = vi.hoisted(() => {
  const mockReplace = vi.fn();
  const mockPush = vi.fn();
  return {
    mockReplace,
    mockPush,
    mockRouter: { replace: mockReplace, push: mockPush },
    mockLogout: vi.fn().mockResolvedValue(undefined),
  };
});

// ─── Router mock ─────────────────────────────────────────────────────────────

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/my-photos',
  useSearchParams: () => new URLSearchParams(),
}));

// ─── Auth mock ────────────────────────────────────────────────────────────────

vi.mock('@/app/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { _id: 'u1', name: 'علي', email: 'ali@test.com', avatarUrl: null },
    loading: false,
    logout: mockLogout,
    login: vi.fn(),
    register: vi.fn(),
    refreshUser: vi.fn(),
    updateUser: vi.fn(),
  }),
}));

// ─── API mock ─────────────────────────────────────────────────────────────────

vi.mock('@/app/lib/api', () => ({
  getMyPhotosApi: vi.fn(),
  uploadPhotoApi: vi.fn(),
  updatePhotoApi: vi.fn(),
  deletePhotoApi: vi.fn(),
}));

const mockPhoto = {
  _id: 'p1',
  title: 'صورة',
  description: 'وصف',
  imageUrl: '/img.jpg',
  user: { _id: 'u1', name: 'علي', avatarUrl: null },
  likesCount: 0,
  isLiked: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('useMyPhotos', () => {
  beforeEach(() => {
    vi.mocked(api.getMyPhotosApi).mockResolvedValue({
      data: [mockPhoto],
      pagination: { page: 1, totalPages: 1, total: 1, limit: 12 },
    });
    mockLogout.mockClear();
    mockReplace.mockClear();
    mockPush.mockClear();
  });

  it('fetches user photos on load', async () => {
    const { result } = renderHook(() => useMyPhotos());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.photos).toHaveLength(1);
    expect(api.getMyPhotosApi).toHaveBeenCalledWith(1, 12);
  });

  it('upload يضيف الصورة للقائمة', async () => {
    const newPhoto = { ...mockPhoto, _id: 'p2', title: 'جديدة' };
    vi.mocked(api.uploadPhotoApi).mockResolvedValue({ data: newPhoto });

    const { result } = renderHook(() => useMyPhotos());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' });
    await act(async () => {
      await result.current.upload(file, 'جديدة');
    });

    expect(result.current.photos[0].title).toBe('جديدة');
  });

  it('remove يحذف الصورة من القائمة', async () => {
    vi.mocked(api.deletePhotoApi).mockResolvedValue({ data: null });

    const { result } = renderHook(() => useMyPhotos());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.remove('p1');
    });

    expect(result.current.photos).toHaveLength(0);
  });

  it('calls logout and redirects to /login when photos API returns 401', async () => {
    const unauthorizedError = Object.assign(new Error('رمز المصادقة غير صالح أو منتهي الصلاحية.'), {
      status: 401,
    });
    vi.mocked(api.getMyPhotosApi).mockRejectedValue(unauthorizedError);

    renderHook(() => useMyPhotos());

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });
});
