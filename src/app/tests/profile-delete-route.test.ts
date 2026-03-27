/**
 * Profile DELETE Route Tests
 *
 * Tests the account deletion API logic with mocked dependencies.
 * Verifies validation, password check, and cascade deletion flow.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFindById = vi.fn();
const mockDeleteUserCascade = vi.fn();

vi.mock('@/app/lib/mongodb', () => ({ connectDB: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/app/middlewares/auth.middleware', () => ({
  authenticateRequest: vi.fn(() => ({ userId: 'user-1', error: null })),
}));
vi.mock('@/app/repositories/user.repository', () => ({
  getUserRepository: vi.fn(() => ({
    findById: mockFindById,
    deleteUserCascade: mockDeleteUserCascade,
  })),
}));
vi.mock('@/app/repositories/photo.repository', () => ({
  getPhotoRepository: vi.fn(() => ({
    findAll: vi.fn().mockResolvedValue([]),
  })),
}));
vi.mock('@/app/lib/storage/storage.service', () => ({
  getStorageService: vi.fn(() => ({
    deleteFiles: vi.fn().mockResolvedValue({ success: [], failed: [] }),
  })),
}));
vi.mock('@/app/lib/auth', () => ({
  comparePassword: vi.fn().mockResolvedValue(true),
}));

const { comparePassword } = await import('@/app/lib/auth');

beforeEach(() => {
  vi.clearAllMocks();
  mockFindById.mockResolvedValue({
    _id: 'user-1',
    password: '$2a$12$hashed',
    avatarUrl: null,
  });
  mockDeleteUserCascade.mockResolvedValue({});
  (comparePassword as ReturnType<typeof vi.fn>).mockResolvedValue(true);
});

async function callDeleteProfile(body: unknown): Promise<Response> {
  const { DELETE } = await import('@/app/api/profile/route');
  const request = new Request('http://localhost/api/profile', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
  return DELETE(request as never);
}

describe('DELETE /api/profile', () => {
  it('rejects request without password', async () => {
    const res = await callDeleteProfile({});
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error?.message).toMatch(/كلمة المرور مطلوبة/);
  });

  it('rejects empty password', async () => {
    const res = await callDeleteProfile({ password: '   ' });
    expect(res.status).toBe(400);
  });

  it('rejects invalid JSON body', async () => {
    const res = await callDeleteProfile('invalid json');
    expect(res.status).toBe(400);
  });

  it('rejects wrong password', async () => {
    (comparePassword as ReturnType<typeof vi.fn>).mockResolvedValueOnce(false);

    const res = await callDeleteProfile({ password: 'wrongpass' });
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error?.message).toMatch(/كلمة المرور غير صحيحة/);
  });

  it('deletes account successfully with correct password', async () => {
    const res = await callDeleteProfile({ password: 'correctpass' });
    expect(res.status).toBe(200);

    expect(mockDeleteUserCascade).toHaveBeenCalledWith('user-1');
  });

  it('clears auth cookie on successful deletion', async () => {
    const res = await callDeleteProfile({ password: 'correctpass' });
    expect(res.status).toBe(200);

    const setCookie = res.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('auth-token=');
    expect(setCookie).toMatch(/Max-Age=0|max-age=0/i);
  });

  it('calls comparePassword with trimmed password', async () => {
    await callDeleteProfile({ password: '  mypass  ' });
    expect(comparePassword).toHaveBeenCalledWith('mypass', expect.any(String));
  });
});
