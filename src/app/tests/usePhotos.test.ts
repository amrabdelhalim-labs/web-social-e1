/**
 * usePhotos Hook Tests
 *
 * يختبر جلب الصور، التصفح، والإعجاب.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePhotos } from '@/app/hooks/usePhotos';
import * as api from '@/app/lib/api';

vi.mock('@/app/lib/api', () => ({
  getPhotosApi: vi.fn(),
  toggleLikeApi: vi.fn(),
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
};

describe('usePhotos', () => {
  beforeEach(() => {
    vi.mocked(api.getPhotosApi).mockResolvedValue({
      data: [mockPhoto],
      pagination: { page: 1, totalPages: 2, total: 2, limit: 12 },
    });
  });

  it('يجلب الصور عند التحميل', async () => {
    const { result } = renderHook(() => usePhotos());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.photos).toHaveLength(1);
    expect(result.current.photos[0].title).toBe('صورة');
    expect(api.getPhotosApi).toHaveBeenCalledWith(1, 12);
  });

  it('loadMore يجلب الصفحة التالية', async () => {
    vi.mocked(api.getPhotosApi)
      .mockResolvedValueOnce({
        data: [mockPhoto],
        pagination: { page: 1, totalPages: 2, total: 2, limit: 12 },
      })
      .mockResolvedValueOnce({
        data: [{ ...mockPhoto, _id: 'p2' }],
        pagination: { page: 2, totalPages: 2, total: 2, limit: 12 },
      });

    const { result } = renderHook(() => usePhotos());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      result.current.loadMore();
    });

    await waitFor(() => {
      expect(api.getPhotosApi).toHaveBeenCalledWith(2, 12);
    });
    expect(result.current.photos).toHaveLength(2);
  });

  it('toggleLike يحدّث الحالة بشكل تفاؤلي', async () => {
    vi.mocked(api.toggleLikeApi).mockResolvedValue({
      data: { liked: true, likesCount: 1 },
    });

    const { result } = renderHook(() => usePhotos());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      result.current.toggleLike('p1');
    });

    await waitFor(() => {
      expect(result.current.photos[0].isLiked).toBe(true);
      expect(result.current.photos[0].likesCount).toBe(1);
    });
  });
});
