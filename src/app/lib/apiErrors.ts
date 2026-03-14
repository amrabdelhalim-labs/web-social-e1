import { NextResponse } from 'next/server';
import type { ApiResponse } from '@/app/types';

export function apiError(
  code: string,
  message: string,
  status: number = 400
): NextResponse<ApiResponse<null>> {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function validationError(messages: string[]): NextResponse<ApiResponse<null>> {
  return apiError('VALIDATION_ERROR', messages.join('، '), 400);
}

export function unauthorizedError(
  message: string = 'غير مصرح. يرجى تسجيل الدخول أولًا.'
): NextResponse<ApiResponse<null>> {
  return apiError('UNAUTHORIZED', message, 401);
}

export function forbiddenError(
  message: string = 'ليس لديك صلاحية لتنفيذ هذا الإجراء.'
): NextResponse<ApiResponse<null>> {
  return apiError('FORBIDDEN', message, 403);
}

export function notFoundError(
  message: string = 'العنصر المطلوب غير موجود.'
): NextResponse<ApiResponse<null>> {
  return apiError('NOT_FOUND', message, 404);
}

export function conflictError(
  message: string = 'حدث تعارض في البيانات المدخلة.'
): NextResponse<ApiResponse<null>> {
  return apiError('CONFLICT', message, 409);
}

export function serverError(
  message: string = 'حدث خطأ غير متوقع في الخادم.'
): NextResponse<ApiResponse<null>> {
  return apiError('SERVER_ERROR', message, 500);
}
