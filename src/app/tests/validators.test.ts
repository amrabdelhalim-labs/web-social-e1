import { describe, expect, it } from 'vitest';
import {
  validateChangePasswordInput,
  validateLoginInput,
  validatePhotoInput,
  validateRegisterInput,
  validateUpdatePhotoInput,
  validateUpdateUserInput,
} from '@/app/validators';

// ─── validateRegisterInput ────────────────────────────────────────────────────

describe('validateRegisterInput', () => {
  it('يقبل البيانات الصحيحة', () => {
    expect(
      validateRegisterInput({
        name: 'أحمد محمد',
        email: 'ahmed@example.com',
        password: 'secret123',
        confirmPassword: 'secret123',
      })
    ).toHaveLength(0);
  });

  it('يرفض الاسم القصير (أقل من 3)', () => {
    const errors = validateRegisterInput({
      name: 'ab',
      email: 'a@b.com',
      password: 'pass123',
      confirmPassword: 'pass123',
    });
    expect(errors).toContain('الاسم يجب أن يكون 3 أحرف على الأقل.');
  });

  it('يرفض الاسم الطويل (أكثر من 50)', () => {
    const errors = validateRegisterInput({
      name: 'أ'.repeat(51),
      email: 'a@b.com',
      password: 'pass123',
      confirmPassword: 'pass123',
    });
    expect(errors).toContain('الاسم يجب ألا يتجاوز 50 حرفًا.');
  });

  it('يرفض البريد غير الصالح', () => {
    const errors = validateRegisterInput({
      name: 'أحمد',
      email: 'invalid-email',
      password: 'pass123',
      confirmPassword: 'pass123',
    });
    expect(errors).toContain('صيغة البريد الإلكتروني غير صحيحة.');
  });

  it('يرفض كلمة المرور القصيرة (أقل من 6)', () => {
    const errors = validateRegisterInput({
      name: 'أحمد',
      email: 'a@b.com',
      password: '123',
      confirmPassword: '123',
    });
    expect(errors).toContain('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
  });

  it('يرفض عدم تطابق تأكيد كلمة المرور', () => {
    const errors = validateRegisterInput({
      name: 'أحمد',
      email: 'a@b.com',
      password: 'pass123',
      confirmPassword: 'different',
    });
    expect(errors).toContain('تأكيد كلمة المرور غير متطابق.');
  });

  it('يجمّع جميع الأخطاء في طلب فاشل كليًا', () => {
    const errors = validateRegisterInput({
      name: 'ab',
      email: 'bad',
      password: '123',
      confirmPassword: '321',
    });
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });
});

// ─── validateLoginInput ───────────────────────────────────────────────────────

describe('validateLoginInput', () => {
  it('يقبل البيانات الصحيحة', () => {
    expect(validateLoginInput({ email: 'user@example.com', password: 'pass123' })).toHaveLength(0);
  });

  it('يرفض البريد غير الصالح', () => {
    const errors = validateLoginInput({ email: 'not-email', password: 'pass123' });
    expect(errors).toContain('صيغة البريد الإلكتروني غير صحيحة.');
  });

  it('يرفض كلمة المرور القصيرة', () => {
    const errors = validateLoginInput({ email: 'a@b.com', password: '123' });
    expect(errors).toContain('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
  });

  it('يجمّع خطأي البريد وكلمة المرور معًا', () => {
    const errors = validateLoginInput({ email: 'bad', password: '1' });
    expect(errors).toHaveLength(2);
  });
});

// ─── validatePhotoInput ───────────────────────────────────────────────────────

describe('validatePhotoInput', () => {
  it('يقبل العنوان مع وصف اختياري', () => {
    expect(validatePhotoInput({ title: 'صورة جميلة', description: 'وصف مختصر' })).toHaveLength(0);
  });

  it('يقبل العنوان بدون وصف', () => {
    expect(validatePhotoInput({ title: 'صورة' })).toHaveLength(0);
  });

  it('يرفض العنوان الفارغ', () => {
    const errors = validatePhotoInput({ title: '' });
    expect(errors).toContain('عنوان الصورة مطلوب.');
  });

  it('يرفض العنوان الطويل جداً (> 200)', () => {
    const errors = validatePhotoInput({ title: 'أ'.repeat(201) });
    expect(errors).toContain('عنوان الصورة يجب ألا يتجاوز 200 حرفًا.');
  });

  it('يرفض الوصف الطويل جداً (> 2000)', () => {
    const errors = validatePhotoInput({ title: 'عنوان', description: 'x'.repeat(2001) });
    expect(errors).toContain('وصف الصورة يجب ألا يتجاوز 2000 حرفًا.');
  });

  it('يجمّع خطأي العنوان والوصف', () => {
    const errors = validatePhotoInput({ title: '', description: 'x'.repeat(2500) });
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });
});

// ─── validateUpdatePhotoInput ─────────────────────────────────────────────────

describe('validateUpdatePhotoInput', () => {
  it('يقبل تحديث العنوان وحده', () => {
    expect(validateUpdatePhotoInput({ title: 'عنوان جديد' })).toHaveLength(0);
  });

  it('يقبل تحديث الوصف وحده', () => {
    expect(validateUpdatePhotoInput({ description: 'وصف جديد' })).toHaveLength(0);
  });

  it('يرفض الطلب الفارغ تمامًا', () => {
    expect(validateUpdatePhotoInput({})).toContain('لا توجد بيانات لتحديث الصورة.');
  });

  it('يرفض العنوان الفارغ عند تقديمه', () => {
    const errors = validateUpdatePhotoInput({ title: '   ' });
    expect(errors).toContain('عنوان الصورة مطلوب.');
  });

  it('يرفض العنوان الطويل جداً', () => {
    const errors = validateUpdatePhotoInput({ title: 'أ'.repeat(201) });
    expect(errors).toContain('عنوان الصورة يجب ألا يتجاوز 200 حرفًا.');
  });

  it('يرفض الوصف الطويل جداً', () => {
    const errors = validateUpdatePhotoInput({ description: 'x'.repeat(2001) });
    expect(errors).toContain('وصف الصورة يجب ألا يتجاوز 2000 حرفًا.');
  });
});

// ─── validateUpdateUserInput ──────────────────────────────────────────────────

describe('validateUpdateUserInput', () => {
  it('يقبل تحديث الاسم وحده', () => {
    expect(validateUpdateUserInput({ name: 'اسم جديد' })).toHaveLength(0);
  });

  it('يقبل تحديث البريد وحده', () => {
    expect(validateUpdateUserInput({ email: 'new@example.com' })).toHaveLength(0);
  });

  it('يرفض الطلب الفارغ تمامًا', () => {
    expect(validateUpdateUserInput({})).toContain('لا توجد بيانات لتحديث الملف الشخصي.');
  });

  it('يرفض الاسم القصير', () => {
    const errors = validateUpdateUserInput({ name: 'أب' });
    expect(errors).toContain('الاسم يجب أن يكون 3 أحرف على الأقل.');
  });

  it('يرفض الاسم الطويل جداً', () => {
    const errors = validateUpdateUserInput({ name: 'أ'.repeat(51) });
    expect(errors).toContain('الاسم يجب ألا يتجاوز 50 حرفًا.');
  });

  it('يرفض البريد غير الصالح', () => {
    const errors = validateUpdateUserInput({ email: 'bad-email' });
    expect(errors).toContain('صيغة البريد الإلكتروني غير صحيحة.');
  });
});

// ─── validateChangePasswordInput ─────────────────────────────────────────────

describe('validateChangePasswordInput', () => {
  it('يقبل المدخلات الصحيحة', () => {
    expect(
      validateChangePasswordInput({
        currentPassword: 'oldPass1',
        newPassword: 'newPass1',
        confirmPassword: 'newPass1',
      })
    ).toHaveLength(0);
  });

  it('يرفض كلمة المرور الحالية المفقودة', () => {
    const errors = validateChangePasswordInput({
      currentPassword: '',
      newPassword: 'newPass1',
      confirmPassword: 'newPass1',
    });
    expect(errors).toContain('كلمة المرور الحالية مطلوبة.');
  });

  it('يرفض كلمة المرور الجديدة القصيرة', () => {
    const errors = validateChangePasswordInput({
      currentPassword: 'oldPass1',
      newPassword: '12345',
      confirmPassword: '12345',
    });
    expect(errors).toContain('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل.');
  });

  it('يرفض عدم تطابق تأكيد كلمة المرور الجديدة', () => {
    const errors = validateChangePasswordInput({
      currentPassword: 'oldPass1',
      newPassword: 'newPass1',
      confirmPassword: 'different',
    });
    expect(errors).toContain('تأكيد كلمة المرور الجديدة غير متطابق.');
  });

  it('يرفض كلمة المرور الجديدة المطابقة للحالية', () => {
    const errors = validateChangePasswordInput({
      currentPassword: 'samePass1',
      newPassword: 'samePass1',
      confirmPassword: 'samePass1',
    });
    expect(errors).toContain('كلمة المرور الجديدة يجب أن تختلف عن الحالية.');
  });

  it('يجمّع أخطاء متعددة', () => {
    const errors = validateChangePasswordInput({
      currentPassword: 'oldPass1',
      newPassword: '123',
      confirmPassword: '999',
    });
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });
});
