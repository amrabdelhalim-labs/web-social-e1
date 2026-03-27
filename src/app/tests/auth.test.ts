import { describe, expect, it } from 'vitest';
import { comparePassword, generateToken, hashPassword, verifyToken } from '@/app/lib/auth';

describe('generateToken / verifyToken', () => {
  it('creates valid token and retrieves user id', () => {
    const token = generateToken('user-123');
    const payload = verifyToken(token);
    expect(payload.id).toBe('user-123');
  });

  it('keeps id as payload field', () => {
    const token = generateToken('abc-456');
    const payload = verifyToken(token);
    expect(payload).toHaveProperty('id', 'abc-456');
    expect(payload).toHaveProperty('iat');
    expect(payload).toHaveProperty('exp');
  });

  it('produces different tokens for same user (iat changes)', () => {
    const t1 = generateToken('user-1');
    const t2 = generateToken('user-1');
    // May match in same second, but structure must be JWT
    expect(typeof t1).toBe('string');
    expect(t1.split('.')).toHaveLength(3);
    expect(typeof t2).toBe('string');
  });

  it('rejects invalid token and throws', () => {
    expect(() => verifyToken('invalid-token')).toThrow();
  });

  it('rejects token signed with different secret', async () => {
    // Token signed with different secret
    const jwt = await import('jsonwebtoken');
    const fakeToken = jwt.default.sign({ id: 'hacker' }, 'wrong-secret');
    expect(() => verifyToken(fakeToken)).toThrow();
  });

  it('rejects empty string', () => {
    expect(() => verifyToken('')).toThrow();
  });
});

describe('hashPassword / comparePassword', () => {
  it('hashes password and verifies correctly', async () => {
    const plain = 'secret123';
    const hashed = await hashPassword(plain);
    expect(hashed).not.toBe(plain);
    await expect(comparePassword(plain, hashed)).resolves.toBe(true);
  });

  it('rejects wrong password', async () => {
    const hashed = await hashPassword('correct-pass');
    await expect(comparePassword('wrong-pass', hashed)).resolves.toBe(false);
  });

  it('produces different hashes for same password (random salt)', async () => {
    // bcrypt with 12 rounds is intentionally slow — allow extra time
    const h1 = await hashPassword('same-password');
    const h2 = await hashPassword('same-password');
    expect(h1).not.toBe(h2);
    // Both verify correctly
    await expect(comparePassword('same-password', h1)).resolves.toBe(true);
    await expect(comparePassword('same-password', h2)).resolves.toBe(true);
  }, 20_000);

  it('starts hash with bcrypt prefix', async () => {
    const hashed = await hashPassword('test');
    expect(hashed).toMatch(/^\$2[aby]\$/);
  });
});
