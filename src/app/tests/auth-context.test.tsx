/**
 * Auth Context Tests
 *
 * Tests for AuthContext logic including:
 *  - Initial loading state
 *  - Token hydration from localStorage
 *  - login() stores token + user
 *  - register() stores token + user
 *  - logout() clears token + user
 *  - updateUser() updates in-memory user
 *  - loadUser: 401 clears token; network errors are silently swallowed
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

const MOCK_TOKEN = 'mock.jwt.token';

// ─── Setup ───────────────────────────────────────────────────────────────────

const globalFetch = vi.fn() as MockedFunction<typeof fetch>;

beforeEach(() => {
  vi.stubGlobal('fetch', globalFetch);
  globalFetch.mockReset();
  localStorage.clear();
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
  it('ends loading with no user when no token is stored', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    // useEffect runs asynchronously — wait for the loading flag to settle
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });

  it('loads user from stored token on mount', async () => {
    localStorage.setItem('auth-token', MOCK_TOKEN);
    globalFetch.mockResolvedValueOnce(makeJsonResponse({ data: MOCK_USER }));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user).toEqual(MOCK_USER);
    expect(result.current.token).toBe(MOCK_TOKEN);
    expect(globalFetch).toHaveBeenCalledWith(
      '/api/auth/me',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: `Bearer ${MOCK_TOKEN}` }),
      })
    );
  });

  it('clears token on 401 from /api/auth/me', async () => {
    localStorage.setItem('auth-token', MOCK_TOKEN);
    globalFetch.mockResolvedValueOnce(makeJsonResponse({ error: { message: 'غير مصرح' } }, 401));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(localStorage.getItem('auth-token')).toBeNull();
  });

  it('keeps user null on network failure (not PWA app)', async () => {
    localStorage.setItem('auth-token', MOCK_TOKEN);
    globalFetch.mockRejectedValueOnce(new TypeError('Network error'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Network failure does not restore any cache — user stays null
    expect(result.current.user).toBeNull();
    // Token is still present; only 401 clears the token
    expect(result.current.token).toBe(MOCK_TOKEN);
  });

  it('stores token and user after login', async () => {
    globalFetch.mockResolvedValueOnce(
      makeJsonResponse({ data: { token: MOCK_TOKEN, user: MOCK_USER } })
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.login('ahmed@example.com', 'password123');
    });

    expect(result.current.user).toEqual(MOCK_USER);
    expect(result.current.token).toBe(MOCK_TOKEN);
    expect(localStorage.getItem('auth-token')).toBe(MOCK_TOKEN);
  });

  it('throws on login failure', async () => {
    globalFetch.mockResolvedValueOnce(
      makeJsonResponse({ error: { message: 'كلمة المرور خاطئة' } }, 401)
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(
      act(async () => {
        await result.current.login('ahmed@example.com', 'wrong');
      })
    ).rejects.toThrow('كلمة المرور خاطئة');
  });

  it('stores token and user after registration', async () => {
    globalFetch.mockResolvedValueOnce(
      makeJsonResponse({ data: { token: MOCK_TOKEN, user: MOCK_USER } })
    );

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
    expect(result.current.token).toBe(MOCK_TOKEN);
    expect(localStorage.getItem('auth-token')).toBe(MOCK_TOKEN);
  });

  it('clears session after logout', async () => {
    localStorage.setItem('auth-token', MOCK_TOKEN);
    globalFetch.mockResolvedValueOnce(makeJsonResponse({ data: MOCK_USER }));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(localStorage.getItem('auth-token')).toBeNull();
  });

  it('updates user data in memory', async () => {
    localStorage.setItem('auth-token', MOCK_TOKEN);
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
