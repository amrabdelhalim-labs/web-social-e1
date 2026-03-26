/**
 * HomePageFeed Component Tests
 *
 * Verifies the client-side interactive feed wrapper:
 *  - Renders initial SSR photos immediately (no loading flash)
 *  - Shows "تحميل المزيد" button when there are more pages
 *  - Hides the button when on the last page
 *  - Appends new photos after successful loadMore API call
 *  - Shows error alert when loadMore fails
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest';
import { HomePageFeed } from '@/app/components/photos/HomePageFeed';
import type { Photo } from '@/app/types';

// ─── Fixtures ────────────────────────────────────────────────────────────────

function makePhoto(id: string): Photo {
  return {
    _id: id,
    title: `صورة ${id}`,
    imageUrl: `/uploads/${id}.png`,
    user: { _id: 'u1', name: 'مستخدم', avatarUrl: null },
    likesCount: 0,
    isLiked: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

const INITIAL_PHOTOS = [makePhoto('p1'), makePhoto('p2')];
const PAGE2_PHOTOS = [makePhoto('p3'), makePhoto('p4')];

const PAGE1_PAGINATION = { page: 1, totalPages: 2, total: 4, limit: 2 };
const PAGE1_PAGINATION_LAST = { page: 1, totalPages: 1, total: 2, limit: 2 };

// ─── Setup ───────────────────────────────────────────────────────────────────

const globalFetch = vi.fn() as MockedFunction<typeof fetch>;

beforeEach(() => {
  vi.stubGlobal('fetch', globalFetch);
  globalFetch.mockReset();
});

function makeJsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('HomePageFeed', () => {
  it('يعرض الصور الأولية فوراً بدون حالة تحميل', () => {
    render(<HomePageFeed initialPhotos={INITIAL_PHOTOS} initialPagination={PAGE1_PAGINATION} />);

    expect(screen.getByText('صورة p1')).toBeInTheDocument();
    expect(screen.getByText('صورة p2')).toBeInTheDocument();
  });

  it('يُظهر زر "تحميل المزيد" عند وجود صفحات إضافية', () => {
    render(<HomePageFeed initialPhotos={INITIAL_PHOTOS} initialPagination={PAGE1_PAGINATION} />);

    expect(screen.getByRole('button', { name: /تحميل المزيد/i })).toBeInTheDocument();
  });

  it('لا يُظهر زر "تحميل المزيد" في الصفحة الأخيرة', () => {
    render(
      <HomePageFeed initialPhotos={INITIAL_PHOTOS} initialPagination={PAGE1_PAGINATION_LAST} />
    );

    expect(screen.queryByRole('button', { name: /تحميل المزيد/i })).toBeNull();
  });

  it('يُضيف الصور الجديدة بعد النقر على "تحميل المزيد"', async () => {
    globalFetch.mockResolvedValueOnce(
      makeJsonResponse({
        data: PAGE2_PHOTOS,
        pagination: { page: 2, totalPages: 2, total: 4, limit: 2 },
      })
    );

    render(<HomePageFeed initialPhotos={INITIAL_PHOTOS} initialPagination={PAGE1_PAGINATION} />);

    fireEvent.click(screen.getByRole('button', { name: /تحميل المزيد/i }));

    await waitFor(() => {
      expect(screen.getByText('صورة p3')).toBeInTheDocument();
      expect(screen.getByText('صورة p4')).toBeInTheDocument();
    });

    // Original photos remain
    expect(screen.getByText('صورة p1')).toBeInTheDocument();
  });

  it('يُظهر رسالة خطأ عند فشل "تحميل المزيد"', async () => {
    globalFetch.mockResolvedValueOnce(
      makeJsonResponse({ error: { message: 'خطأ في الخادم' } }, 500)
    );

    render(<HomePageFeed initialPhotos={INITIAL_PHOTOS} initialPagination={PAGE1_PAGINATION} />);

    fireEvent.click(screen.getByRole('button', { name: /تحميل المزيد/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('يُخفي زر التحميل بعد الوصول للصفحة الأخيرة', async () => {
    globalFetch.mockResolvedValueOnce(
      makeJsonResponse({
        data: PAGE2_PHOTOS,
        pagination: { page: 2, totalPages: 2, total: 4, limit: 2 },
      })
    );

    render(<HomePageFeed initialPhotos={INITIAL_PHOTOS} initialPagination={PAGE1_PAGINATION} />);

    fireEvent.click(screen.getByRole('button', { name: /تحميل المزيد/i }));

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /تحميل المزيد/i })).toBeNull();
    });
  });
});
