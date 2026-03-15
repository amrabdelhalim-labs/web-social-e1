'use client';

/**
 * Login Page
 *
 * Renders the sign-in form. Auth guard: if the user is already authenticated,
 * redirects to the home page and returns null (no flash of the form).
 *
 * Flow:
 *   1. Client-side validation via validateLoginInput (Arabic error messages)
 *   2. Call login() from AuthContext — throws on server error
 *   3. On success → router.push('/')
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
import { validateLoginInput } from '@/app/validators';
import { MainLayout } from '@/app/components/layout/MainLayout';
import { APP_NAME } from '@/app/config';

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
            أهلاً بك، سجّل دخولك للمتابعة
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
              autoComplete="current-password"
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

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={submitting}
              sx={{ mt: 2.5, py: 1.25, fontSize: '1rem' }}
            >
              {submitting ? <CircularProgress size={22} color="inherit" /> : 'تسجيل الدخول'}
            </Button>
          </Box>

          {/* Switch to register */}
          <Typography variant="body2" color="text.secondary" textAlign="center" mt={2.5}>
            ليس لديك حساب؟{' '}
            <MuiLink component={Link} href="/register" fontWeight={600}>
              إنشاء حساب جديد
            </MuiLink>
          </Typography>
        </Paper>
      </Box>
    </MainLayout>
  );
}
