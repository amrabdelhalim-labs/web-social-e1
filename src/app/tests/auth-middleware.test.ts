import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { generateToken } from '@/app/lib/auth';
import { authenticateRequest } from '@/app/middlewares/auth.middleware';

describe('authenticateRequest', () => {
  it('يعيد userId عند توكن Bearer صالح', () => {
    const token = generateToken('user-42');
    const request = new NextRequest('http://localhost:3000/api/test', {
      headers: { authorization: `Bearer ${token}` },
    });

    const result = authenticateRequest(request);
    if (result.error) throw new Error('Expected success');
    expect(result.userId).toBe('user-42');
  });

  it('يُرجع userId صحيح لمعرّفات مختلفة', () => {
    const ids = ['mongo-id-1', 'abc123', '507f1f77bcf86cd799439011'];

    for (const id of ids) {
      const token = generateToken(id);
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { authorization: `Bearer ${token}` },
      });
      const result = authenticateRequest(request);
      if (result.error) throw new Error(`Expected success for id: ${id}`);
      expect(result.userId).toBe(id);
    }
  });

  it('يرفض الطلب بدون Authorization header — 401', async () => {
    const request = new NextRequest('http://localhost:3000/api/test');
    const result = authenticateRequest(request);

    expect(result.error).toBeDefined();
    expect(result.error?.status).toBe(401);
    await expect(result.error?.json()).resolves.toMatchObject({
      error: { code: 'UNAUTHORIZED' },
    });
  });

  it('يرفض التوكن غير الصالح — 401', async () => {
    const request = new NextRequest('http://localhost:3000/api/test', {
      headers: { authorization: 'Bearer invalid-token-xyz' },
    });
    const result = authenticateRequest(request);

    expect(result.error).toBeDefined();
    expect(result.error?.status).toBe(401);
  });

  it('يرفض صيغة Authorization غير Bearer (مثل Basic) — 401', async () => {
    const request = new NextRequest('http://localhost:3000/api/test', {
      headers: { authorization: 'Basic dXNlcjpwYXNz' },
    });
    const result = authenticateRequest(request);

    expect(result.error).toBeDefined();
    expect(result.error?.status).toBe(401);
  });

  it('يرفض "Bearer " بدون توكن بعده — 401', async () => {
    const request = new NextRequest('http://localhost:3000/api/test', {
      headers: { authorization: 'Bearer ' },
    });
    const result = authenticateRequest(request);

    expect(result.error).toBeDefined();
    expect(result.error?.status).toBe(401);
  });

  it('لا يُرجع error عند النجاح', () => {
    const token = generateToken('test-user');
    const request = new NextRequest('http://localhost:3000/api/test', {
      headers: { authorization: `Bearer ${token}` },
    });
    const result = authenticateRequest(request);
    expect(result.error).toBeUndefined();
  });
});
