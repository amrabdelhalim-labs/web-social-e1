import { MAX_DESCRIPTION_LENGTH, MAX_TITLE_LENGTH } from '@/app/config';
import type {
  ChangePasswordInput,
  LoginInput,
  PhotoInput,
  RegisterInput,
  UpdatePhotoInput,
  UpdateUserInput,
} from '@/app/types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export function validateRegisterInput(input: RegisterInput): string[] {
  const errors: string[] = [];

  if (!input.name || input.name.trim().length < 3) {
    errors.push('الاسم يجب أن يكون 3 أحرف على الأقل.');
  } else if (input.name.trim().length > 50) {
    errors.push('الاسم يجب ألا يتجاوز 50 حرفًا.');
  }

  if (!input.email || !isValidEmail(input.email.trim())) {
    errors.push('صيغة البريد الإلكتروني غير صحيحة.');
  }

  if (!input.password || input.password.length < 6) {
    errors.push('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
  }

  if (input.password !== input.confirmPassword) {
    errors.push('تأكيد كلمة المرور غير متطابق.');
  }

  return errors;
}

export function validateLoginInput(input: LoginInput): string[] {
  const errors: string[] = [];

  if (!input.email || !isValidEmail(input.email.trim())) {
    errors.push('صيغة البريد الإلكتروني غير صحيحة.');
  }

  if (!input.password || input.password.length < 6) {
    errors.push('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
  }

  return errors;
}

export function validatePhotoInput(input: PhotoInput): string[] {
  const errors: string[] = [];

  if (!input.title || input.title.trim().length < 1) {
    errors.push('عنوان الصورة مطلوب.');
  } else if (input.title.trim().length > MAX_TITLE_LENGTH) {
    errors.push(`عنوان الصورة يجب ألا يتجاوز ${MAX_TITLE_LENGTH} حرفًا.`);
  }

  if (input.description && input.description.trim().length > MAX_DESCRIPTION_LENGTH) {
    errors.push(`وصف الصورة يجب ألا يتجاوز ${MAX_DESCRIPTION_LENGTH} حرفًا.`);
  }

  return errors;
}

export function validateUpdatePhotoInput(input: UpdatePhotoInput): string[] {
  const errors: string[] = [];

  if (input.title === undefined && input.description === undefined) {
    errors.push('لا توجد بيانات لتحديث الصورة.');
    return errors;
  }

  if (input.title !== undefined) {
    if (input.title.trim().length < 1) {
      errors.push('عنوان الصورة مطلوب.');
    } else if (input.title.trim().length > MAX_TITLE_LENGTH) {
      errors.push(`عنوان الصورة يجب ألا يتجاوز ${MAX_TITLE_LENGTH} حرفًا.`);
    }
  }

  if (input.description !== undefined && input.description.trim().length > MAX_DESCRIPTION_LENGTH) {
    errors.push(`وصف الصورة يجب ألا يتجاوز ${MAX_DESCRIPTION_LENGTH} حرفًا.`);
  }

  return errors;
}

export function validateUpdateUserInput(input: UpdateUserInput): string[] {
  const errors: string[] = [];

  if (input.name === undefined && input.email === undefined) {
    errors.push('لا توجد بيانات لتحديث الملف الشخصي.');
    return errors;
  }

  if (input.name !== undefined) {
    if (input.name.trim().length < 3) {
      errors.push('الاسم يجب أن يكون 3 أحرف على الأقل.');
    } else if (input.name.trim().length > 50) {
      errors.push('الاسم يجب ألا يتجاوز 50 حرفًا.');
    }
  }

  if (input.email !== undefined && !isValidEmail(input.email.trim())) {
    errors.push('صيغة البريد الإلكتروني غير صحيحة.');
  }

  return errors;
}

export function validateChangePasswordInput(input: ChangePasswordInput): string[] {
  const errors: string[] = [];

  if (!input.currentPassword || input.currentPassword.length < 1) {
    errors.push('كلمة المرور الحالية مطلوبة.');
  }

  if (!input.newPassword || input.newPassword.length < 6) {
    errors.push('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل.');
  }

  if (input.newPassword !== input.confirmPassword) {
    errors.push('تأكيد كلمة المرور الجديدة غير متطابق.');
  }

  if (input.currentPassword && input.newPassword && input.currentPassword === input.newPassword) {
    errors.push('كلمة المرور الجديدة يجب أن تختلف عن الحالية.');
  }

  return errors;
}
