/**
 * API Client Tests
 *
 * Tests for the centralized fetchApi / fetchFormApi base functions and
 * selected typed endpoint helpers. Does NOT test actual HTTP — all fetch
 * calls are intercepted with vi.fn() mocks.
 *
 * Covers:
 *  - fetchApi: injects Authorization header when token is present
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
  localStorage.clear();
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
  it('يُرسل طلب JSON بدون توكن عندما لا يوجد توكن', async () => {
    globalFetch.mockResolvedValueOnce(makeResponse({ data: null }));

    await fetchApi('/api/auth/me');

    const [, options] = globalFetch.mock.calls[0];
    const headers = (options as RequestInit)?.headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['Authorization']).toBeUndefined();
  });

  it('يُضيف Authorization header عندما يوجد توكن في localStorage', async () => {
    localStorage.setItem('auth-token', 'my.jwt');
    globalFetch.mockResolvedValueOnce(makeResponse({ data: null }));

    await fetchApi('/api/auth/me');

    const [, options] = globalFetch.mock.calls[0];
    const headers = (options as RequestInit)?.headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer my.jwt');
  });

  it('يرمي خطأ برسالة الخادم العربية عند استجابة غير ناجحة', async () => {
    globalFetch.mockResolvedValueOnce(
      makeResponse({ error: { message: 'البريد مسجل مسبقاً' } }, 409)
    );

    await expect(fetchApi('/api/auth/register')).rejects.toThrow('البريد مسجل مسبقاً');
  });

  it('يرمي رسالة احتياطية عندما لا تحتوي الاستجابة على رسالة خطأ', async () => {
    globalFetch.mockResolvedValueOnce(makeResponse({}, 500));

    await expect(fetchApi('/api/health')).rejects.toThrow('خطأ غير متوقع من الخادم.');
  });

  it('يُعيد JSON body عند النجاح', async () => {
    const payload = { data: { id: '1', name: 'صورة' } };
    globalFetch.mockResolvedValueOnce(makeResponse(payload));

    const result = await fetchApi<typeof payload>('/api/photos');
    expect(result).toEqual(payload);
  });
});

describe('fetchFormApi', () => {
  it('لا يضع Content-Type header (البراوزر يضعه مع الحدود)', async () => {
    globalFetch.mockResolvedValueOnce(makeResponse({ data: null }));
    const form = new FormData();

    await fetchFormApi('/api/profile/avatar', form);

    const [, options] = globalFetch.mock.calls[0];
    const headers = (options as RequestInit)?.headers as Record<string, string>;
    expect(headers['Content-Type']).toBeUndefined();
  });

  it('يرسل طلب POST افتراضياً', async () => {
    globalFetch.mockResolvedValueOnce(makeResponse({ data: null }));

    await fetchFormApi('/api/photos', new FormData());

    const [, options] = globalFetch.mock.calls[0];
    expect((options as RequestInit)?.method).toBe('POST');
  });

  it('يرسل طلب PUT عند تحديده', async () => {
    globalFetch.mockResolvedValueOnce(makeResponse({ data: null }));

    await fetchFormApi('/api/profile/avatar', new FormData(), 'PUT');

    const [, options] = globalFetch.mock.calls[0];
    expect((options as RequestInit)?.method).toBe('PUT');
  });
});

describe('Endpoint helpers', () => {
  it('loginApi: ترسل POST /api/auth/login', async () => {
    globalFetch.mockResolvedValueOnce(makeResponse({ data: { token: 'tok', user: {} } }));

    await loginApi({ email: 'a@b.com', password: '123456' });

    const [path, options] = globalFetch.mock.calls[0];
    expect(path).toBe('/api/auth/login');
    expect((options as RequestInit)?.method).toBe('POST');
  });

  it('registerApi: ترسل POST /api/auth/register', async () => {
    globalFetch.mockResolvedValueOnce(makeResponse({ data: { token: 'tok', user: {} } }));

    await registerApi({
      name: 'علي',
      email: 'ali@example.com',
      password: 'pass1234',
      confirmPassword: 'pass1234',
    });

    const [path] = globalFetch.mock.calls[0];
    expect(path).toBe('/api/auth/register');
  });

  it('getMeApi: ترسل GET /api/auth/me', async () => {
    globalFetch.mockResolvedValueOnce(makeResponse({ data: {} }));

    await getMeApi();

    const [path] = globalFetch.mock.calls[0];
    expect(path).toBe('/api/auth/me');
  });

  it('uploadPhotoApi: تضع الملف والعنوان في FormData وترسل POST /api/photos', async () => {
    globalFetch.mockResolvedValueOnce(makeResponse({ data: {} }));
    const file = new File(['img'], 'photo.png', { type: 'image/png' });

    await uploadPhotoApi(file, 'منظر رائع', 'وصف');

    const [path, options] = globalFetch.mock.calls[0];
    expect(path).toBe('/api/photos');
    expect((options as RequestInit)?.method).toBe('POST');
    expect((options as RequestInit)?.body).toBeInstanceOf(FormData);
  });

  it('toggleLikeApi: ترسل POST /api/photos/:id/like', async () => {
    globalFetch.mockResolvedValueOnce(makeResponse({ data: { liked: true, likesCount: 1 } }));

    await toggleLikeApi('photo-123');

    const [path] = globalFetch.mock.calls[0];
    expect(path).toBe('/api/photos/photo-123/like');
  });

  it('deleteAccountApi: ترسل DELETE /api/profile مع كلمة المرور', async () => {
    globalFetch.mockResolvedValueOnce(makeResponse({ data: null }));

    await deleteAccountApi('mysecretpass');

    const [path, options] = globalFetch.mock.calls[0];
    expect(path).toBe('/api/profile');
    expect((options as RequestInit)?.method).toBe('DELETE');
    const body = JSON.parse((options as RequestInit)?.body as string);
    expect(body).toEqual({ password: 'mysecretpass' });
  });
});
