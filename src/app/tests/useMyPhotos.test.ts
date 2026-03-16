/**
 * useMyPhotos Hook Tests
 *
 * يختبر جلب صور المستخدم، الرفع، التعديل، والحذف.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMyPhotos } from '@/app/hooks/useMyPhotos';
import * as api from '@/app/lib/api';

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
  user: { _id: 'u1', name: 'علي' },
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
});
