import { describe, expect, it } from 'vitest';
import {
  validateChangePasswordInput,
  validateLoginInput,
  validatePhotoInput,
  validateRegisterInput,
  validateUpdatePhotoInput,
  validateUpdateUserInput,
} from '@/app/validators';

describe('Validators', () => {
  it('يجب أن يقبل بيانات التسجيل الصحيحة', () => {
    const errors = validateRegisterInput({
      name: 'أحمد محمد',
      email: 'ahmed@example.com',
      password: 'secret123',
      confirmPassword: 'secret123',
    });
    expect(errors).toHaveLength(0);
  });

  it('يجب أن يرفض بيانات التسجيل غير الصحيحة مع تجميع الأخطاء', () => {
    const errors = validateRegisterInput({
      name: 'ab',
      email: 'invalid',
      password: '123',
      confirmPassword: '321',
    });
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });

  it('يجب أن يرفض تسجيل الدخول ببريد غير صالح', () => {
    const errors = validateLoginInput({ email: 'invalid-email', password: 'secret123' });
    expect(errors).toContain('صيغة البريد الإلكتروني غير صحيحة.');
  });

  it('يجب أن يتحقق من قيود الصورة الجديدة', () => {
    const errors = validatePhotoInput({
      title: '',
      description: 'x'.repeat(2500),
    });
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });

  it('يجب أن يرفض تحديث الصورة بدون أي بيانات', () => {
    const errors = validateUpdatePhotoInput({});
    expect(errors).toContain('لا توجد بيانات لتحديث الصورة.');
  });

  it('يجب أن يرفض تحديث المستخدم بدون بيانات', () => {
    const errors = validateUpdateUserInput({});
    expect(errors).toContain('لا توجد بيانات لتحديث الملف الشخصي.');
  });

  it('يجب أن يرفض تغيير كلمة المرور غير الصحيح', () => {
    const errors = validateChangePasswordInput({
      currentPassword: '123456',
      newPassword: '123',
      confirmPassword: '1234',
    });
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });
});
