'use client';

/**
 * Register Page
 *
 * Renders the account creation form for guests only.
 *
 * Flow:
 *   1. Client-side validation via validateRegisterInput (Arabic error messages)
 *   2. Call register() from AuthContext — auto-logs in on success
 *   3. On success → router.push('/') (user is already set in AuthContext)
 *   4. On failure → display the server error in an Alert
 */

import { useState, Suspense } from 'react';
import { Box, TextField } from '@mui/material';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';
import { validateRegisterInput } from '@/app/validators';
import { GuestRoute } from '@/app/components/auth/GuestRoute';
import { MainLayout } from '@/app/components/layout/MainLayout';
import { AuthFormLayout } from '@/app/components/auth/AuthFormLayout';
import { PasswordField } from '@/app/components/common/PasswordField';
import { SubmitButton } from '@/app/components/common/SubmitButton';
import { APP_NAME } from '@/app/config';

function RegisterPageContent() {
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  /** Redirect target after registration — default to home; only allow same-origin paths. */
  const next = (() => {
    const raw = searchParams.get('next') ?? '';
    return raw.startsWith('/') && !raw.startsWith('//') ? raw : '/';
  })();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    e.preventDefault();
    setServerError('');

    const errors = validateRegisterInput({
      name: name.trim(),
      email: email.trim(),
      password,
      confirmPassword,
    });
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors([]);

    setSubmitting(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password, confirmPassword });
      router.push(next);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'فشل إنشاء الحساب، حاول مرة أخرى.');
    } finally {
      setSubmitting(false);
    }
  };

  const displayErrors =
    validationErrors.length > 0 ? validationErrors : serverError ? [serverError] : [];

  return (
    <MainLayout>
      <AuthFormLayout
        title={APP_NAME}
        subtitle="أنشئ حسابك وابدأ مشاركة صورك"
        errors={displayErrors}
        form={
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              label="الاسم"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              required
              margin="normal"
              autoComplete="name"
              slotProps={{ htmlInput: { 'aria-label': 'الاسم' } }}
            />
            <TextField
              label="البريد الإلكتروني"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
              margin="normal"
              autoComplete="email"
              slotProps={{ htmlInput: { 'aria-label': 'البريد الإلكتروني' } }}
            />
            <PasswordField
              label="كلمة المرور"
              value={password}
              onChange={setPassword}
              showPassword={showPassword}
              onToggleShow={() => setShowPassword((p) => !p)}
              autoComplete="new-password"
            />
            <TextField
              label="تأكيد كلمة المرور"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              fullWidth
              required
              margin="normal"
              autoComplete="new-password"
              slotProps={{ htmlInput: { 'aria-label': 'تأكيد كلمة المرور' } }}
            />
            <SubmitButton loading={submitting}>إنشاء الحساب</SubmitButton>
          </Box>
        }
        footer={
          <>
            لديك حساب بالفعل؟{' '}
            <Link href="/login" style={{ fontWeight: 600 }}>
              تسجيل الدخول
            </Link>
          </>
        }
      />
    </MainLayout>
  );
}

export default function RegisterPage() {
  return (
    <GuestRoute>
      <Suspense>
        <RegisterPageContent />
      </Suspense>
    </GuestRoute>
  );
}
