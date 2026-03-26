/**
 * Route Guard Tests — ProtectedRoute and GuestRoute
 *
 * Verifies that:
 *  ProtectedRoute:
 *   - Shows spinner while auth is loading
 *   - Shows children when user is authenticated
 *   - Redirects to /login when not authenticated (after loading)
 *
 *  GuestRoute:
 *   - Shows spinner while auth is loading
 *   - Shows children when user is NOT authenticated (after loading)
 *   - Redirects to / when user IS authenticated
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest';
import { ProtectedRoute } from '@/app/components/auth/ProtectedRoute';
import { GuestRoute } from '@/app/components/auth/GuestRoute';
import { AuthProvider } from '@/app/context/AuthContext';
import type { User } from '@/app/types';

// ─── Router mock ─────────────────────────────────────────────────────────────

const { mockReplace } = vi.hoisted(() => ({ mockReplace: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace, push: mockReplace }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// ─── Fixtures ────────────────────────────────────────────────────────────────

const MOCK_USER: User = {
  _id: 'user-1',
  name: 'تيست',
  email: 'test@example.com',
  avatarUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const globalFetch = vi.fn() as MockedFunction<typeof fetch>;

beforeEach(() => {
  vi.stubGlobal('fetch', globalFetch);
  globalFetch.mockReset();
  mockReplace.mockReset();
});

function makeResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

// ─── ProtectedRoute ───────────────────────────────────────────────────────────

describe('ProtectedRoute', () => {
  it('يعرض المحتوى عند تسجيل الدخول', async () => {
    globalFetch.mockResolvedValueOnce(makeResponse({ data: MOCK_USER }));

    render(
      <ProtectedRoute>
        <div>محتوى محمي</div>
      </ProtectedRoute>,
      { wrapper }
    );

    await waitFor(() => {
      expect(screen.getByText('محتوى محمي')).toBeInTheDocument();
    });
  });

  it('يُعيد التوجيه إلى /login عند عدم تسجيل الدخول', async () => {
    globalFetch
      .mockResolvedValueOnce(makeResponse({ error: { message: 'غير مصرح' } }, 401))
      .mockResolvedValueOnce(makeResponse({ message: 'تم تسجيل الخروج.' })); // logout call

    render(
      <ProtectedRoute>
        <div>محتوى محمي</div>
      </ProtectedRoute>,
      { wrapper }
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });

    expect(screen.queryByText('محتوى محمي')).toBeNull();
  });

  it('يعرض spinner أثناء التحقق من الجلسة', () => {
    // Never resolves during this test
    globalFetch.mockReturnValueOnce(new Promise(() => {}));

    render(
      <ProtectedRoute>
        <div>محتوى محمي</div>
      </ProtectedRoute>,
      { wrapper }
    );

    expect(screen.queryByText('محتوى محمي')).toBeNull();
    // CircularProgress renders via MUI — content is hidden, not "spinner" text
    expect(screen.queryByRole('progressbar')).toBeInTheDocument();
  });
});

// ─── GuestRoute ───────────────────────────────────────────────────────────────

describe('GuestRoute', () => {
  it('يعرض المحتوى عند عدم تسجيل الدخول', async () => {
    globalFetch
      .mockResolvedValueOnce(makeResponse({ error: { message: 'غير مصرح' } }, 401))
      .mockResolvedValueOnce(makeResponse({ message: 'تم تسجيل الخروج.' })); // logout call

    render(
      <GuestRoute>
        <div>صفحة الدخول</div>
      </GuestRoute>,
      { wrapper }
    );

    await waitFor(() => {
      expect(screen.getByText('صفحة الدخول')).toBeInTheDocument();
    });
  });

  it('يُعيد التوجيه إلى / عند تسجيل الدخول', async () => {
    globalFetch.mockResolvedValueOnce(makeResponse({ data: MOCK_USER }));

    render(
      <GuestRoute>
        <div>صفحة الدخول</div>
      </GuestRoute>,
      { wrapper }
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/');
    });

    expect(screen.queryByText('صفحة الدخول')).toBeNull();
  });

  it('يعرض spinner أثناء التحقق من الجلسة', () => {
    globalFetch.mockReturnValueOnce(new Promise(() => {}));

    render(
      <GuestRoute>
        <div>صفحة الدخول</div>
      </GuestRoute>,
      { wrapper }
    );

    expect(screen.queryByText('صفحة الدخول')).toBeNull();
  });
});
