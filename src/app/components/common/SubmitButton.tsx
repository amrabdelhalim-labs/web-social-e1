'use client';

/**
 * SubmitButton — Primary button with loading state
 */

import { Button, CircularProgress } from '@mui/material';

export interface SubmitButtonProps {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
}

export function SubmitButton({ children, loading = false, disabled = false }: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      variant="contained"
      fullWidth
      disabled={disabled || loading}
      sx={{ mt: 2.5, py: 1.25, minHeight: 48, fontSize: '1rem' }}
    >
      {loading ? <CircularProgress size={22} color="inherit" /> : children}
    </Button>
  );
}
