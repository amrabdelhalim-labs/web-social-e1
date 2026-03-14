import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/app/lib/auth';
import { unauthorizedError } from '@/app/lib/apiErrors';
import type { ApiResponse } from '@/app/types';

interface AuthSuccess {
  userId: string;
  error?: undefined;
}

interface AuthFailure {
  userId?: undefined;
  error: NextResponse<ApiResponse<null>>;
}

export type AuthResult = AuthSuccess | AuthFailure;

export function authenticateRequest(request: NextRequest): AuthResult {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: unauthorizedError('رمز المصادقة مفقود.') };
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyToken(token);
    return { userId: payload.id };
  } catch {
    return { error: unauthorizedError('رمز المصادقة غير صالح أو منتهي الصلاحية.') };
  }
}
