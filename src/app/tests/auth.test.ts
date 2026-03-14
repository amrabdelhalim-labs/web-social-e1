import { describe, expect, it } from 'vitest';
import { comparePassword, generateToken, hashPassword, verifyToken } from '@/app/lib/auth';

describe('Auth Utilities', () => {
  it('يجب أن ينشئ توكن صالحًا ويستعيد معرّف المستخدم', () => {
    const token = generateToken('user-123');
    const payload = verifyToken(token);

    expect(payload.id).toBe('user-123');
  });

  it('يجب أن يفشل التحقق عند استخدام توكن غير صالح', () => {
    expect(() => verifyToken('invalid-token')).toThrow();
  });

  it('يجب أن يشفّر كلمة المرور ويطابقها بشكل صحيح', async () => {
    const plain = 'secret123';
    const hashed = await hashPassword(plain);

    expect(hashed).not.toBe(plain);
    await expect(comparePassword(plain, hashed)).resolves.toBe(true);
    await expect(comparePassword('wrong-pass', hashed)).resolves.toBe(false);
  });
});
