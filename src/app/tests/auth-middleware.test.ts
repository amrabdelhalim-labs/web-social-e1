import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { generateToken } from '@/app/lib/auth';
import { authenticateRequest } from '@/app/middlewares/auth.middleware';
import { AUTH_COOKIE_NAME } from '@/app/lib/authCookie';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeRequestWithCookie(token: string): NextRequest {
  return new NextRequest('http://localhost:3000/api/test', {
    headers: { cookie: `${AUTH_COOKIE_NAME}=${token}` },
  });
}

function makeRequestWithBearer(token: string): NextRequest {
  return new NextRequest('http://localhost:3000/api/test', {
    headers: { authorization: `Bearer ${token}` },
  });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('authenticateRequest', () => {
  // ── Cookie-based auth (primary) ────────────────────────────────────────────

  it('يعيد userId عند cookie صالح', () => {
    const token = generateToken('user-42');
    const request = makeRequestWithCookie(token);

    const result = authenticateRequest(request);
    if (result.error) throw new Error('Expected success');
    expect(result.userId).toBe('user-42');
  });

  it('يُرجع userId صحيح لمعرّفات مختلفة عبر cookie', () => {
    const ids = ['mongo-id-1', 'abc123', '507f1f77bcf86cd799439011'];

    for (const id of ids) {
      const token = generateToken(id);
      const request = makeRequestWithCookie(token);
      const result = authenticateRequest(request);
      if (result.error) throw new Error(`Expected success for id: ${id}`);
      expect(result.userId).toBe(id);
    }
  });

  it('يرفض cookie غير صالح — 401', async () => {
    const request = makeRequestWithCookie('invalid-token-xyz');
    const result = authenticateRequest(request);

    expect(result.error).toBeDefined();
    expect(result.error?.status).toBe(401);
    await expect(result.error?.json()).resolves.toMatchObject({
      error: { code: 'UNAUTHORIZED' },
    });
  });

  // ── Bearer header fallback ─────────────────────────────────────────────────

  it('يعيد userId عند توكن Bearer صالح (fallback)', () => {
    const token = generateToken('user-42');
    const request = makeRequestWithBearer(token);

    const result = authenticateRequest(request);
    if (result.error) throw new Error('Expected success');
    expect(result.userId).toBe('user-42');
  });

  it('يُرجع userId صحيح لمعرّفات مختلفة عبر Bearer', () => {
    const ids = ['mongo-id-1', 'abc123', '507f1f77bcf86cd799439011'];

    for (const id of ids) {
      const token = generateToken(id);
      const request = makeRequestWithBearer(token);
      const result = authenticateRequest(request);
      if (result.error) throw new Error(`Expected success for id: ${id}`);
      expect(result.userId).toBe(id);
    }
  });

  // ── Missing auth ───────────────────────────────────────────────────────────

  it('يرفض الطلب بدون أي مصادقة — 401', async () => {
    const request = new NextRequest('http://localhost:3000/api/test');
    const result = authenticateRequest(request);

    expect(result.error).toBeDefined();
    expect(result.error?.status).toBe(401);
    await expect(result.error?.json()).resolves.toMatchObject({
      error: { code: 'UNAUTHORIZED' },
    });
  });

  it('يرفض التوكن غير الصالح في Bearer — 401', async () => {
    const request = makeRequestWithBearer('invalid-token-xyz');
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
    const request = makeRequestWithBearer('');
    const result = authenticateRequest(request);

    expect(result.error).toBeDefined();
    expect(result.error?.status).toBe(401);
  });

  it('لا يُرجع error عند النجاح', () => {
    const token = generateToken('test-user');
    const request = makeRequestWithCookie(token);
    const result = authenticateRequest(request);
    expect(result.error).toBeUndefined();
  });

  // ── Cookie takes priority over Bearer ─────────────────────────────────────

  it('يستخدم cookie عند وجود كليهما (cookie له الأولوية)', () => {
    const cookieToken = generateToken('from-cookie');
    const bearerToken = generateToken('from-bearer');

    const request = new NextRequest('http://localhost:3000/api/test', {
      headers: {
        cookie: `${AUTH_COOKIE_NAME}=${cookieToken}`,
        authorization: `Bearer ${bearerToken}`,
      },
    });

    const result = authenticateRequest(request);
    if (result.error) throw new Error('Expected success');
    expect(result.userId).toBe('from-cookie');
  });
});
