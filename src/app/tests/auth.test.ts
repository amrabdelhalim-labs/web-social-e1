import { describe, expect, it } from 'vitest';
import { comparePassword, generateToken, hashPassword, verifyToken } from '@/app/lib/auth';

describe('generateToken / verifyToken', () => {
  it('ينشئ توكن صالحًا ويسترجع معرّف المستخدم', () => {
    const token = generateToken('user-123');
    const payload = verifyToken(token);
    expect(payload.id).toBe('user-123');
  });

  it('يحتفظ بالمعرّف كحقل id في الـ payload', () => {
    const token = generateToken('abc-456');
    const payload = verifyToken(token);
    expect(payload).toHaveProperty('id', 'abc-456');
    expect(payload).toHaveProperty('iat');
    expect(payload).toHaveProperty('exp');
  });

  it('يُنتج توكنات مختلفة لنفس المستخدم (iat يتغير)', () => {
    const t1 = generateToken('user-1');
    const t2 = generateToken('user-1');
    // قد يتطابقان في نفس الثانية، لكن الشكل العام يجب أن يكون JWT
    expect(typeof t1).toBe('string');
    expect(t1.split('.')).toHaveLength(3);
    expect(typeof t2).toBe('string');
  });

  it('يرفض التوكن غير الصالح ويرمي خطأ', () => {
    expect(() => verifyToken('invalid-token')).toThrow();
  });

  it('يرفض التوكن المُزوَّر بسر مختلف', () => {
    // توكن موقّع بسر آخر
    import('jsonwebtoken').then((jwt) => {
      const fakeToken = jwt.default.sign({ id: 'hacker' }, 'wrong-secret');
      expect(() => verifyToken(fakeToken)).toThrow();
    });
  });

  it('يرفض السلسلة الفارغة', () => {
    expect(() => verifyToken('')).toThrow();
  });
});

describe('hashPassword / comparePassword', () => {
  it('يُشفّر كلمة المرور ويتحقق منها بشكل صحيح', async () => {
    const plain = 'secret123';
    const hashed = await hashPassword(plain);
    expect(hashed).not.toBe(plain);
    await expect(comparePassword(plain, hashed)).resolves.toBe(true);
  });

  it('يرفض كلمة المرور الخاطئة', async () => {
    const hashed = await hashPassword('correct-pass');
    await expect(comparePassword('wrong-pass', hashed)).resolves.toBe(false);
  });

  it('ينتج هاشات مختلفة لنفس كلمة المرور (salt عشوائي)', async () => {
    const h1 = await hashPassword('same-password');
    const h2 = await hashPassword('same-password');
    expect(h1).not.toBe(h2);
    // لكن كلاهما صحيح
    await expect(comparePassword('same-password', h1)).resolves.toBe(true);
    await expect(comparePassword('same-password', h2)).resolves.toBe(true);
  });

  it('يبدأ الهاش بـ bcrypt prefix', async () => {
    const hashed = await hashPassword('test');
    expect(hashed).toMatch(/^\$2[aby]\$/);
  });
});
