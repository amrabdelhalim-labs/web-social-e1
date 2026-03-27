/**
 * Profile Password Route Tests
 *
 * Tests the password change API: validation, old-password check,
 * hash update, and session invalidation (cookie cleared).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFindById = vi.fn();
const mockUpdate = vi.fn();
const mockBumpSessionVersion = vi.fn();

vi.mock('@/app/lib/mongodb', () => ({ connectDB: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/app/middlewares/auth.middleware', () => ({
  authenticateRequest: vi.fn(() => ({ userId: 'user-1', error: null })),
}));
vi.mock('@/app/repositories/user.repository', () => ({
  getUserRepository: vi.fn(() => ({
    findById: mockFindById,
    update: mockUpdate,
    bumpSessionVersion: mockBumpSessionVersion,
  })),
}));
vi.mock('@/app/lib/auth', () => ({
  comparePassword: vi.fn().mockResolvedValue(true),
  hashPassword: vi.fn().mockResolvedValue('$2a$12$newhash'),
}));

const { comparePassword } = await import('@/app/lib/auth');

beforeEach(() => {
  vi.clearAllMocks();
  mockFindById.mockResolvedValue({
    _id: 'user-1',
    password: '$2a$12$oldhash',
  });
  mockUpdate.mockResolvedValue({});
  mockBumpSessionVersion.mockResolvedValue(1);
  (comparePassword as ReturnType<typeof vi.fn>).mockResolvedValue(true);
});

async function callChangePassword(body: unknown): Promise<Response> {
  const { PUT } = await import('@/app/api/profile/password/route');
  const request = new Request('http://localhost/api/profile/password', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return PUT(request as never);
}

const validBody = {
  currentPassword: 'OldPass123!',
  newPassword: 'NewPass456!',
  confirmPassword: 'NewPass456!',
};

describe('PUT /api/profile/password', () => {
  it('changes password and clears auth cookie', async () => {
    const res = await callChangePassword(validBody);
    expect(res.status).toBe(200);

    const setCookie = res.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('auth-token=');
    expect(setCookie).toMatch(/Max-Age=0|max-age=0/i);
  });

  it('rejects wrong current password', async () => {
    (comparePassword as ReturnType<typeof vi.fn>).mockResolvedValueOnce(false);

    const res = await callChangePassword(validBody);
    expect(res.status).toBe(401);
  });

  it('rejects when user not found', async () => {
    mockFindById.mockResolvedValueOnce(null);

    const res = await callChangePassword(validBody);
    expect(res.status).toBe(404);
  });

  it('returns success message in Arabic', async () => {
    const res = await callChangePassword(validBody);
    const json = await res.json();
    expect(json.message).toMatch(/تم تغيير كلمة المرور/);
  });

  it('invalidates sessions before updating password', async () => {
    await callChangePassword(validBody);

    const bumpOrder = mockBumpSessionVersion.mock.invocationCallOrder[0];
    const updateOrder = mockUpdate.mock.invocationCallOrder[0];
    expect(bumpOrder).toBeLessThan(updateOrder);
  });
});
