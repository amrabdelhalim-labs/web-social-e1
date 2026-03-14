import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { generateToken } from '@/app/lib/auth';
import { authenticateRequest } from '@/app/middlewares/auth.middleware';

describe('authenticateRequest', () => {
  it('يجب أن يعيد userId عند وجود Bearer token صالح', () => {
    const token = generateToken('user-42');
    const request = new NextRequest('http://localhost:3000/api/test', {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    const result = authenticateRequest(request);

    if (result.error) {
      throw new Error('Expected success auth result');
    }

    expect(result.userId).toBe('user-42');
  });

  it('يجب أن يعيد خطأ 401 عند غياب التوكن', async () => {
    const request = new NextRequest('http://localhost:3000/api/test');
    const result = authenticateRequest(request);

    expect(result.error).toBeDefined();
    expect(result.error?.status).toBe(401);
    await expect(result.error?.json()).resolves.toMatchObject({
      error: { code: 'UNAUTHORIZED' },
    });
  });

  it('يجب أن يعيد خطأ 401 عند توكن غير صالح', async () => {
    const request = new NextRequest('http://localhost:3000/api/test', {
      headers: {
        authorization: 'Bearer invalid-token',
      },
    });
    const result = authenticateRequest(request);

    expect(result.error).toBeDefined();
    expect(result.error?.status).toBe(401);
  });
});
