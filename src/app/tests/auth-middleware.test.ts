import { NextRequest } from 'next/server';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { generateToken } from '@/app/lib/auth';
import { authenticateRequest } from '@/app/middlewares/auth.middleware';
import { AUTH_COOKIE_NAME } from '@/app/lib/authCookie';
import type { IUser } from '@/app/types';

const mockFindById = vi.fn();

vi.mock('@/app/lib/mongodb', () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/app/repositories/user.repository', () => ({
  getUserRepository: vi.fn(() => ({
    findById: mockFindById,
  })),
}));

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

function makeUser(id: string, sessionVersion = 0): IUser {
  return {
    _id: id,
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashed',
    avatarUrl: null,
    sessionVersion,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as IUser;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('authenticateRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindById.mockResolvedValue(makeUser('user-42', 0));
  });

  // ── Cookie-based auth (primary) ────────────────────────────────────────────

  it('يعيد userId عند cookie صالح', async () => {
    const token = generateToken('user-42');
    const request = makeRequestWithCookie(token);

    const result = await authenticateRequest(request);
    if (result.error) throw new Error('Expected success');
    expect(result.userId).toBe('user-42');
  });

  it('يُرجع userId صحيح لمعرّفات مختلفة عبر cookie', async () => {
    const ids = ['mongo-id-1', 'abc123', '507f1f77bcf86cd799439011'];

    for (const id of ids) {
      const token = generateToken(id);
      const request = makeRequestWithCookie(token);
      mockFindById.mockResolvedValueOnce(makeUser(id, 0));
      const result = await authenticateRequest(request);
      if (result.error) throw new Error(`Expected success for id: ${id}`);
      expect(result.userId).toBe(id);
    }
  });

  it('يرفض cookie غير صالح — 401', async () => {
    const request = makeRequestWithCookie('invalid-token-xyz');
    const result = await authenticateRequest(request);

    expect(result.error).toBeDefined();
    expect(result.error?.status).toBe(401);
    await expect(result.error?.json()).resolves.toMatchObject({
      error: { code: 'UNAUTHORIZED' },
    });
  });

  // ── Bearer header fallback ─────────────────────────────────────────────────

  it('يعيد userId عند توكن Bearer صالح (fallback)', async () => {
    const token = generateToken('user-42');
    const request = makeRequestWithBearer(token);

    const result = await authenticateRequest(request);
    if (result.error) throw new Error('Expected success');
    expect(result.userId).toBe('user-42');
  });

  it('يُرجع userId صحيح لمعرّفات مختلفة عبر Bearer', async () => {
    const ids = ['mongo-id-1', 'abc123', '507f1f77bcf86cd799439011'];

    for (const id of ids) {
      const token = generateToken(id);
      const request = makeRequestWithBearer(token);
      mockFindById.mockResolvedValueOnce(makeUser(id, 0));
      const result = await authenticateRequest(request);
      if (result.error) throw new Error(`Expected success for id: ${id}`);
      expect(result.userId).toBe(id);
    }
  });

  // ── Missing auth ───────────────────────────────────────────────────────────

  it('يرفض الطلب بدون أي مصادقة — 401', async () => {
    const request = new NextRequest('http://localhost:3000/api/test');
    const result = await authenticateRequest(request);

    expect(result.error).toBeDefined();
    expect(result.error?.status).toBe(401);
    await expect(result.error?.json()).resolves.toMatchObject({
      error: { code: 'UNAUTHORIZED' },
    });
  });

  it('يرفض التوكن غير الصالح في Bearer — 401', async () => {
    const request = makeRequestWithBearer('invalid-token-xyz');
    const result = await authenticateRequest(request);

    expect(result.error).toBeDefined();
    expect(result.error?.status).toBe(401);
  });

  it('يرفض صيغة Authorization غير Bearer (مثل Basic) — 401', async () => {
    const request = new NextRequest('http://localhost:3000/api/test', {
      headers: { authorization: 'Basic dXNlcjpwYXNz' },
    });
    const result = await authenticateRequest(request);

    expect(result.error).toBeDefined();
    expect(result.error?.status).toBe(401);
  });

  it('يرفض "Bearer " بدون توكن بعده — 401', async () => {
    const request = makeRequestWithBearer('');
    const result = await authenticateRequest(request);

    expect(result.error).toBeDefined();
    expect(result.error?.status).toBe(401);
  });

  it('لا يُرجع error عند النجاح', async () => {
    const token = generateToken('test-user');
    const request = makeRequestWithCookie(token);
    mockFindById.mockResolvedValueOnce(makeUser('test-user', 0));
    const result = await authenticateRequest(request);
    expect(result.error).toBeUndefined();
  });

  // ── Cookie takes priority over Bearer ─────────────────────────────────────

  it('يستخدم cookie عند وجود كليهما (cookie له الأولوية)', async () => {
    const cookieToken = generateToken('from-cookie');
    const bearerToken = generateToken('from-bearer');

    const request = new NextRequest('http://localhost:3000/api/test', {
      headers: {
        cookie: `${AUTH_COOKIE_NAME}=${cookieToken}`,
        authorization: `Bearer ${bearerToken}`,
      },
    });

    mockFindById.mockResolvedValueOnce(makeUser('from-cookie', 0));
    const result = await authenticateRequest(request);
    if (result.error) throw new Error('Expected success');
    expect(result.userId).toBe('from-cookie');
  });

  it('يرفض الجلسة عند اختلاف sessionVersion بين التوكن والمستخدم', async () => {
    const token = generateToken('user-42', 0);
    mockFindById.mockResolvedValueOnce(makeUser('user-42', 1));

    const result = await authenticateRequest(makeRequestWithCookie(token));
    expect(result.error?.status).toBe(401);
  });

  it('يرفض الجلسة عندما لا يكون المستخدم موجودًا', async () => {
    const token = generateToken('ghost-user', 0);
    mockFindById.mockResolvedValueOnce(null);

    const result = await authenticateRequest(makeRequestWithCookie(token));
    expect(result.error?.status).toBe(401);
  });
});
