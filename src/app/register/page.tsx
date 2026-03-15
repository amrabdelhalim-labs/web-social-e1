'use client';

/**
 * Register Page
 *
 * Renders the account creation form. Auth guard: if the user is already
 * authenticated, redirects to the home page and returns null.
 *
 * Flow:
 *   1. Client-side validation via validateRegisterInput (Arabic error messages)
 *   2. Call register() from AuthContext — auto-logs in on success
 *   3. On success → router.push('/') (user is already set in AuthContext)
 *   4. On failure → display the server error in an Alert
 */

import { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Link as MuiLink,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';
import { validateRegisterInput } from '@/app/validators';
import { MainLayout } from '@/app/components/layout/MainLayout';
import { APP_NAME } from '@/app/config';

export default function RegisterPage() {
  const { user, loading, register } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Redirect authenticated users away from this page
  useEffect(() => {
    if (!loading && user) {
      router.replace('/');
    }
  }, [loading, user, router]);

  // Return null during redirect to avoid a flash of the form
  if (loading || user) return null;

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
      // AuthContext.register() sets token + user — navigate to home
      router.push('/');
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
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          py: { xs: 4, sm: 8 },
          px: 2,
        }}
      >
        <Paper
          elevation={2}
          sx={{
            p: { xs: 3, sm: 4 },
            width: '100%',
            maxWidth: 420,
            borderRadius: 2,
          }}
        >
          {/* Header */}
          <Typography variant="h5" component="h1" fontWeight={700} mb={0.5} textAlign="center">
            {APP_NAME}
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3} textAlign="center">
            أنشئ حسابك وابدأ مشاركة صورك
          </Typography>

          {/* Validation / server errors */}
          {displayErrors.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {displayErrors.map((err, i) => (
                <span key={i} style={{ display: 'block' }}>
                  {err}
                </span>
              ))}
            </Alert>
          )}

          {/* Form */}
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
              inputProps={{ 'aria-label': 'الاسم' }}
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
              inputProps={{ 'aria-label': 'البريد الإلكتروني' }}
            />

            <TextField
              label="كلمة المرور"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              required
              margin="normal"
              autoComplete="new-password"
              inputProps={{ 'aria-label': 'كلمة المرور' }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((prev) => !prev)}
                      edge="end"
                      aria-label={showPassword ? 'إخفاء كلمة المرور' : 'عرض كلمة المرور'}
                      size="small"
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
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
              inputProps={{ 'aria-label': 'تأكيد كلمة المرور' }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={submitting}
              sx={{ mt: 2.5, py: 1.25, fontSize: '1rem' }}
            >
              {submitting ? <CircularProgress size={22} color="inherit" /> : 'إنشاء الحساب'}
            </Button>
          </Box>

          {/* Switch to login */}
          <Typography variant="body2" color="text.secondary" textAlign="center" mt={2.5}>
            لديك حساب بالفعل؟{' '}
            <MuiLink component={Link} href="/login" fontWeight={600}>
              تسجيل الدخول
            </MuiLink>
          </Typography>
        </Paper>
      </Box>
    </MainLayout>
  );
}
