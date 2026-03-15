'use client';

/**
 * GuestRoute — Guest-Only Page Guard
 *
 * Redirects authenticated users away from pages they should not see
 * (login, register). If the user is logged in, they are sent to the home page.
 *
 * Renders a blank screen while the initial auth check is in progress to
 * avoid a flash of the login form before the redirect fires.
 *
 * Usage:
 *   export default function LoginPage() {
 *     return (
 *       <GuestRoute>
 *         <LoginForm />
 *       </GuestRoute>
 *     );
 *   }
 */

import { useEffect, type ReactNode } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';

interface GuestRouteProps {
  children: ReactNode;
  /** Where to redirect authenticated users (default: '/') */
  redirectTo?: string;
}

export function GuestRoute({ children, redirectTo = '/' }: GuestRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace(redirectTo);
    }
  }, [loading, user, router, redirectTo]);

  if (loading || user) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress size={40} />
      </Box>
    );
  }

  return <>{children}</>;
}
