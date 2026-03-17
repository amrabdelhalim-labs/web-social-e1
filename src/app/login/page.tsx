'use client';

/**
 * Login Page
 *
 * Renders the sign-in form for guests only.
 *
 * Flow:
 *   1. Client-side validation via validateLoginInput (Arabic error messages)
 *   2. Call login() from AuthContext — throws on server error
 *   3. On success → router.push('/')
 *   4. On failure → display the server error in an Alert
 */

import { useState } from 'react';
import { Box, TextField } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';
import { validateLoginInput } from '@/app/validators';
import { GuestRoute } from '@/app/components/auth/GuestRoute';
import { MainLayout } from '@/app/components/layout/MainLayout';
import { AuthFormLayout } from '@/app/components/auth/AuthFormLayout';
import { PasswordField } from '@/app/components/common/PasswordField';
import { SubmitButton } from '@/app/components/common/SubmitButton';
import { APP_NAME } from '@/app/config';

function LoginPageContent() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    e.preventDefault();
    setServerError('');

    const errors = validateLoginInput({ email: email.trim(), password });
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors([]);

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.push('/');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'فشل تسجيل الدخول، حاول مرة أخرى.');
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
        subtitle="أهلاً بك، سجّل دخولك للمتابعة"
        errors={displayErrors}
        form={
          <Box component="form" onSubmit={handleSubmit} noValidate>
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
              autoComplete="current-password"
            />
            <SubmitButton loading={submitting}>تسجيل الدخول</SubmitButton>
          </Box>
        }
        footer={
          <>
            ليس لديك حساب؟{' '}
            <Link href="/register" style={{ fontWeight: 600 }}>
              إنشاء حساب جديد
            </Link>
          </>
        }
      />
    </MainLayout>
  );
}

export default function LoginPage() {
  return (
    <GuestRoute>
      <LoginPageContent />
    </GuestRoute>
  );
}
