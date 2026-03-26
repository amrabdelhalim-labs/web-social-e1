/**
 * Auth Context Tests
 *
 * Tests for AuthContext logic with cookie-based authentication:
 *  - Initial loading state
 *  - User hydration on mount via GET /api/auth/me (cookie sent automatically)
 *  - login() sets user in memory — cookie is set by the server (HttpOnly)
 *  - register() sets user in memory — same
 *  - logout() clears user and fires POST /api/auth/logout (server clears cookie)
 *  - updateUser() updates in-memory user
 *  - loadUser: 401 clears user; network errors are silently swallowed
 *
 * Note: HttpOnly cookies are not accessible in JS (by design), so tests
 * verify behaviour through the user state and API call patterns, not cookies.
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest';
import { AuthProvider } from '@/app/context/AuthContext';
import { useAuth } from '@/app/hooks/useAuth';
import type { User } from '@/app/types';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const MOCK_USER: User = {
  _id: 'user-1',
  name: 'أحمد',
  email: 'ahmed@example.com',
  avatarUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

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

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('AuthContext', () => {
  it('calls /api/auth/me on mount without Authorization header', async () => {
    globalFetch.mockResolvedValueOnce(makeJsonResponse({ error: { message: 'غير مصرح' } }, 401));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(globalFetch).toHaveBeenCalledWith(
      '/api/auth/me',
      expect.not.objectContaining({
        headers: expect.objectContaining({ Authorization: expect.any(String) }),
      })
    );
  });

  it('ends loading with no user when /api/auth/me returns 401', async () => {
    globalFetch.mockResolvedValueOnce(makeJsonResponse({ error: { message: 'غير مصرح' } }, 401));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user).toBeNull();
  });

  it('loads user when /api/auth/me returns valid session', async () => {
    globalFetch.mockResolvedValueOnce(makeJsonResponse({ data: MOCK_USER }));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user).toEqual(MOCK_USER);
  });

  it('sets user to null on 401 from /api/auth/me', async () => {
    globalFetch.mockResolvedValueOnce(makeJsonResponse({ error: { message: 'غير مصرح' } }, 401));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user).toBeNull();
  });

  it('keeps user null on network failure', async () => {
    globalFetch.mockRejectedValueOnce(new TypeError('Network error'));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user).toBeNull();
  });

  it('sets user after login — no localStorage access', async () => {
    // Hydration call returns 401, then login call returns user
    globalFetch
      .mockResolvedValueOnce(makeJsonResponse({ error: { message: 'غير مصرح' } }, 401))
      .mockResolvedValueOnce(makeJsonResponse({ data: { user: MOCK_USER } }));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.login('ahmed@example.com', 'password123');
    });

    expect(result.current.user).toEqual(MOCK_USER);
    // Cookie is set by server (HttpOnly) — localStorage must not be touched
    expect(localStorage.getItem('auth-token')).toBeNull();
  });

  it('throws on login failure', async () => {
    globalFetch
      .mockResolvedValueOnce(makeJsonResponse({ error: { message: 'غير مصرح' } }, 401))
      .mockResolvedValueOnce(makeJsonResponse({ error: { message: 'كلمة المرور خاطئة' } }, 401));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(
      act(async () => {
        await result.current.login('ahmed@example.com', 'wrong');
      })
    ).rejects.toThrow('كلمة المرور خاطئة');
  });

  it('sets user after registration — no localStorage access', async () => {
    globalFetch
      .mockResolvedValueOnce(makeJsonResponse({ error: { message: 'غير مصرح' } }, 401))
      .mockResolvedValueOnce(makeJsonResponse({ data: { user: MOCK_USER } }));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.register({
        name: 'أحمد',
        email: 'ahmed@example.com',
        password: 'pass1234',
        confirmPassword: 'pass1234',
      });
    });

    expect(result.current.user).toEqual(MOCK_USER);
    expect(localStorage.getItem('auth-token')).toBeNull();
  });

  it('clears user after logout and fires POST /api/auth/logout', async () => {
    globalFetch
      .mockResolvedValueOnce(makeJsonResponse({ data: MOCK_USER }))
      .mockResolvedValueOnce(makeJsonResponse({ message: 'تم تسجيل الخروج.' }));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toEqual(MOCK_USER);

    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();

    // Logout should call the logout API to clear the server-side cookie
    await waitFor(() => {
      const calls = globalFetch.mock.calls;
      const logoutCall = calls.find(
        ([path, options]) =>
          path === '/api/auth/logout' && (options as RequestInit)?.method === 'POST'
      );
      expect(logoutCall).toBeDefined();
    });
  });

  it('updates user data in memory', async () => {
    globalFetch.mockResolvedValueOnce(makeJsonResponse({ data: MOCK_USER }));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    const updated: User = { ...MOCK_USER, name: 'أحمد محمد' };

    act(() => {
      result.current.updateUser(updated);
    });

    expect(result.current.user?.name).toBe('أحمد محمد');
  });
});
