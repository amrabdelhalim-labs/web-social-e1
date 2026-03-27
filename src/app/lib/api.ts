'use client';

/**
 * API Client — Centralized HTTP Layer
 *
 * Provides a generic fetch wrapper and typed helpers for every API endpoint.
 *
 * Authentication is cookie-based: the HttpOnly `auth-token` cookie is sent
 * automatically by the browser for all same-origin requests. No manual token
 * injection is needed or performed here.
 *
 * Two base functions:
 *  - fetchApi<T>()     → JSON endpoints (sets Content-Type: application/json)
 *  - fetchFormApi<T>() → multipart/form-data endpoints (browser sets boundary)
 *
 * All helpers throw an Error with the Arabic message from the server on non-2xx.
 *
 * Usage:
 *   import { loginApi, uploadPhotoApi } from '@/app/lib/api';
 *   const { data } = await loginApi({ email, password });
 */

import type {
  User,
  Photo,
  LoginInput,
  RegisterInput,
  UpdateUserInput,
  ChangePasswordInput,
  UpdatePhotoInput,
  ApiResponse,
  PaginatedApiResponse,
} from '@/app/types';

// ─── Base Fetchers ────────────────────────────────────────────────────────────

/**
 * Generic JSON API caller.
 * The auth cookie is sent automatically — no Authorization header needed.
 * Throws an Error (with the server's Arabic message) on any non-2xx response.
 */
export async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  // credentials: 'same-origin' sends the auth cookie for same-origin requests (the default,
  // but stated explicitly so behaviour is clear and not accidentally overridden).
  const res = await fetch(path, { credentials: 'same-origin', ...options, headers });
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(json?.error?.message ?? 'خطأ غير متوقع من الخادم.');
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }
  return json as T;
}

/**
 * Multipart form-data API caller (for file uploads).
 * Does NOT set Content-Type — the browser sets it automatically with the correct boundary.
 */
export async function fetchFormApi<T>(
  path: string,
  formData: FormData,
  method: 'POST' | 'PUT' = 'POST'
): Promise<T> {
  const res = await fetch(path, { method, body: formData, credentials: 'same-origin' });
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(json?.error?.message ?? 'خطأ غير متوقع من الخادم.');
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }
  return json as T;
}

// ─── Auth Endpoints ───────────────────────────────────────────────────────────

export function loginApi(input: LoginInput) {
  return fetchApi<ApiResponse<{ user: User }>>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function registerApi(input: RegisterInput) {
  return fetchApi<ApiResponse<{ user: User }>>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function getMeApi() {
  return fetchApi<ApiResponse<User>>('/api/auth/me');
}

export function logoutApi() {
  return fetchApi<ApiResponse<null>>('/api/auth/logout', { method: 'POST' });
}

// ─── Profile Endpoints ────────────────────────────────────────────────────────

export function updateProfileApi(input: UpdateUserInput) {
  return fetchApi<ApiResponse<User>>('/api/profile', {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function changePasswordApi(input: ChangePasswordInput) {
  return fetchApi<ApiResponse<null>>('/api/profile/password', {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function uploadAvatarApi(file: File) {
  const form = new FormData();
  form.append('avatar', file);
  return fetchFormApi<ApiResponse<User>>('/api/profile/avatar', form, 'PUT');
}

export function deleteAvatarApi() {
  return fetchApi<ApiResponse<User>>('/api/profile/avatar', { method: 'DELETE' });
}

/**
 * Permanently deletes the account. Requires password confirmation from the user.
 * After success, the server clears the cookie; client should redirect to home.
 */
export function deleteAccountApi(password: string) {
  return fetchApi<ApiResponse<null>>('/api/profile', {
    method: 'DELETE',
    body: JSON.stringify({ password }),
  });
}

// ─── Photos Endpoints ─────────────────────────────────────────────────────────

export function getPhotosApi(page = 1, limit = 12) {
  return fetchApi<PaginatedApiResponse<Photo>>(`/api/photos?page=${page}&limit=${limit}`);
}

export function getMyPhotosApi(page = 1, limit = 12) {
  return fetchApi<PaginatedApiResponse<Photo>>(`/api/photos/mine?page=${page}&limit=${limit}`);
}

export function uploadPhotoApi(file: File, title: string, description?: string) {
  const form = new FormData();
  form.append('photo', file);
  form.append('title', title);
  if (description) form.append('description', description);
  return fetchFormApi<ApiResponse<Photo>>('/api/photos', form, 'POST');
}

export function updatePhotoApi(id: string, input: UpdatePhotoInput) {
  return fetchApi<ApiResponse<Photo>>(`/api/photos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function deletePhotoApi(id: string) {
  return fetchApi<ApiResponse<null>>(`/api/photos/${id}`, { method: 'DELETE' });
}

export function toggleLikeApi(photoId: string) {
  return fetchApi<ApiResponse<{ liked: boolean; likesCount: number }>>(
    `/api/photos/${photoId}/like`,
    { method: 'POST' }
  );
}
