'use client';

/**
 * AuthFormLayout — Shared layout for login/register forms
 *
 * Paper wrapper with header, error area, form slot, and footer link.
 */

import { Box, Paper, Typography, Alert } from '@mui/material';

export interface AuthFormLayoutProps {
  title: string;
  subtitle: string;
  errors: string[];
  form: React.ReactNode;
  footer: React.ReactNode;
}

export function AuthFormLayout({ title, subtitle, errors, form, footer }: AuthFormLayoutProps) {
  return (
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
        <Typography variant="h5" component="h1" fontWeight={700} mb={0.5} textAlign="center">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3} textAlign="center">
          {subtitle}
        </Typography>

        {errors.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.map((err, i) => (
              <span key={i} style={{ display: 'block' }}>
                {err}
              </span>
            ))}
          </Alert>
        )}

        {form}

        <Typography variant="body2" color="text.secondary" textAlign="center" mt={2.5}>
          {footer}
        </Typography>
      </Paper>
    </Box>
  );
}
