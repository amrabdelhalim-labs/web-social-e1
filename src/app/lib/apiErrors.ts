/**
 * API Error Response Helpers
 *
 * All API error responses share a consistent shape:
 *   { error: { code: string, message: string } }
 *
 * Error codes are machine-readable uppercase strings for client-side handling.
 * Messages are in Arabic for end-user display.
 *
 * Usage in route handlers:
 *   if (!user) return notFoundError('المستخدم غير موجود.');
 *   if (errors.length) return validationError(errors);
 */

import { NextResponse } from 'next/server';
import type { ApiResponse } from '@/app/types';

/** Base factory — prefer the named helpers below for clarity */
export function apiError(
  code: string,
  message: string,
  status: number = 400
): NextResponse<ApiResponse<null>> {
  return NextResponse.json({ error: { code, message } }, { status });
}

/** 400 — input failed validation; joins multiple messages with an Arabic separator */
export function validationError(messages: string[]): NextResponse<ApiResponse<null>> {
  return apiError('VALIDATION_ERROR', messages.join('، '), 400);
}

/** 401 — missing or invalid authentication token */
export function unauthorizedError(
  message: string = 'غير مصرح. يرجى تسجيل الدخول أولًا.'
): NextResponse<ApiResponse<null>> {
  return apiError('UNAUTHORIZED', message, 401);
}

/** 403 — authenticated but not allowed to perform this action */
export function forbiddenError(
  message: string = 'ليس لديك صلاحية لتنفيذ هذا الإجراء.'
): NextResponse<ApiResponse<null>> {
  return apiError('FORBIDDEN', message, 403);
}

/** 404 — requested resource does not exist */
export function notFoundError(
  message: string = 'العنصر المطلوب غير موجود.'
): NextResponse<ApiResponse<null>> {
  return apiError('NOT_FOUND', message, 404);
}

/** 409 — unique constraint violation (e.g. duplicate email) */
export function conflictError(
  message: string = 'حدث تعارض في البيانات المدخلة.'
): NextResponse<ApiResponse<null>> {
  return apiError('CONFLICT', message, 409);
}

/** 500 — unexpected server error; log the actual error before calling this */
export function serverError(
  message: string = 'حدث خطأ غير متوقع في الخادم.'
): NextResponse<ApiResponse<null>> {
  return apiError('SERVER_ERROR', message, 500);
}
