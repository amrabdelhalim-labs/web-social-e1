/**
 * API Client Tests
 *
 * Tests for the centralized fetchApi / fetchFormApi base functions and
 * selected typed endpoint helpers. Does NOT test actual HTTP — all fetch
 * calls are intercepted with vi.fn() mocks.
 *
 * Auth is now cookie-based (HttpOnly) — no Authorization header is injected
 * by the client. Cookies are sent automatically by the browser for same-origin
 * requests, which is invisible at the fetch-options level in these tests.
 *
 * Covers:
 *  - fetchApi: sends JSON request without Authorization header (cookie is automatic)
 *  - fetchApi: throws with Arabic server message on non-2xx
 *  - fetchApi: throws generic fallback when no error message
 *  - fetchFormApi: does NOT set Content-Type header (browser sets boundary)
 *  - loginApi, registerApi, getMeApi, uploadPhotoApi, toggleLikeApi
 */

import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest';
import {
  fetchApi,
  fetchFormApi,
  loginApi,
  registerApi,
  getMeApi,
  uploadPhotoApi,
  toggleLikeApi,
  deleteAccountApi,
} from '@/app/lib/api';

// ─── Setup ───────────────────────────────────────────────────────────────────

const globalFetch = vi.fn() as MockedFunction<typeof fetch>;

beforeEach(() => {
  vi.stubGlobal('fetch', globalFetch);
  globalFetch.mockReset();
});

function makeResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('fetchApi', () => {
  it('sends JSON request without Authorization header (cookie-based auth)', async () => {
    globalFetch.mockResolvedValueOnce(makeResponse({ data: null }));

    await fetchApi('/api/auth/me');

    const [, options] = globalFetch.mock.calls[0];
    const headers = (options as RequestInit)?.headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
    // No Authorization header — auth is via HttpOnly cookie (set by server)
    expect(headers['Authorization']).toBeUndefined();
  });

  it('throws with server message on non-2xx response', async () => {
    globalFetch.mockResolvedValueOnce(
      makeResponse({ error: { message: 'البريد مسجل مسبقاً' } }, 409)
    );

    await expect(fetchApi('/api/auth/register')).rejects.toThrow('البريد مسجل مسبقاً');
  });

  it('throws fallback message when response has no error message', async () => {
    globalFetch.mockResolvedValueOnce(makeResponse({}, 500));

    await expect(fetchApi('/api/health')).rejects.toThrow('خطأ غير متوقع من الخادم.');
  });

  it('returns JSON body on success', async () => {
    const payload = { data: { id: '1', name: 'صورة' } };
    globalFetch.mockResolvedValueOnce(makeResponse(payload));

    const result = await fetchApi<typeof payload>('/api/photos');
    expect(result).toEqual(payload);
  });
});

describe('fetchFormApi', () => {
  it('does not set Content-Type header (browser sets with boundary)', async () => {
    globalFetch.mockResolvedValueOnce(makeResponse({ data: null }));
    const form = new FormData();

    await fetchFormApi('/api/profile/avatar', form);

    const [, options] = globalFetch.mock.calls[0];
    const headers = (options as RequestInit)?.headers as Record<string, string> | undefined;
    expect(headers?.['Content-Type']).toBeUndefined();
  });

  it('sends POST request by default', async () => {
    globalFetch.mockResolvedValueOnce(makeResponse({ data: null }));

    await fetchFormApi('/api/photos', new FormData());

    const [, options] = globalFetch.mock.calls[0];
    expect((options as RequestInit)?.method).toBe('POST');
  });

  it('sends PUT request when specified', async () => {
    globalFetch.mockResolvedValueOnce(makeResponse({ data: null }));

    await fetchFormApi('/api/profile/avatar', new FormData(), 'PUT');

    const [, options] = globalFetch.mock.calls[0];
    expect((options as RequestInit)?.method).toBe('PUT');
  });
});

describe('Endpoint helpers', () => {
  it('loginApi: sends POST /api/auth/login', async () => {
    globalFetch.mockResolvedValueOnce(makeResponse({ data: { user: {} } }));

    await loginApi({ email: 'a@b.com', password: '123456' });

    const [path, options] = globalFetch.mock.calls[0];
    expect(path).toBe('/api/auth/login');
    expect((options as RequestInit)?.method).toBe('POST');
  });

  it('registerApi: sends POST /api/auth/register', async () => {
    globalFetch.mockResolvedValueOnce(makeResponse({ data: { user: {} } }));

    await registerApi({
      name: 'علي',
      email: 'ali@example.com',
      password: 'pass1234',
      confirmPassword: 'pass1234',
    });

    const [path] = globalFetch.mock.calls[0];
    expect(path).toBe('/api/auth/register');
  });

  it('getMeApi: sends GET /api/auth/me', async () => {
    globalFetch.mockResolvedValueOnce(makeResponse({ data: {} }));

    await getMeApi();

    const [path] = globalFetch.mock.calls[0];
    expect(path).toBe('/api/auth/me');
  });

  it('uploadPhotoApi: puts file and title in FormData and sends POST /api/photos', async () => {
    globalFetch.mockResolvedValueOnce(makeResponse({ data: {} }));
    const file = new File(['img'], 'photo.png', { type: 'image/png' });

    await uploadPhotoApi(file, 'منظر رائع', 'وصف');

    const [path, options] = globalFetch.mock.calls[0];
    expect(path).toBe('/api/photos');
    expect((options as RequestInit)?.method).toBe('POST');
    expect((options as RequestInit)?.body).toBeInstanceOf(FormData);
  });

  it('toggleLikeApi: sends POST /api/photos/:id/like', async () => {
    globalFetch.mockResolvedValueOnce(makeResponse({ data: { liked: true, likesCount: 1 } }));

    await toggleLikeApi('photo-123');

    const [path] = globalFetch.mock.calls[0];
    expect(path).toBe('/api/photos/photo-123/like');
  });

  it('deleteAccountApi: sends DELETE /api/profile with password', async () => {
    globalFetch.mockResolvedValueOnce(makeResponse({ data: null }));

    await deleteAccountApi('mysecretpass');

    const [path, options] = globalFetch.mock.calls[0];
    expect(path).toBe('/api/profile');
    expect((options as RequestInit)?.method).toBe('DELETE');
    const body = JSON.parse((options as RequestInit)?.body as string);
    expect(body).toEqual({ password: 'mysecretpass' });
  });
});
