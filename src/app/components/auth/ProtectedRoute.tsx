'use client';

/**
 * ProtectedRoute — Authenticated-Only Page Guard
 *
 * Redirects unauthenticated users to /login for pages that require authentication
 * (my-photos, profile, etc.). Shows a loading spinner during the initial auth check
 * to avoid a flash of the protected content before the redirect fires.
 *
 * Usage:
 *   export default function MyPhotosPage() {
 *     return (
 *       <ProtectedRoute>
 *         <MyPhotosContent />
 *       </ProtectedRoute>
 *     );
 *   }
 */

import { useEffect, type ReactNode } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Where to redirect unauthenticated users (default: '/login') */
  redirectTo?: string;
}

export function ProtectedRoute({ children, redirectTo = '/login' }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(redirectTo);
    }
  }, [loading, user, router, redirectTo]);

  if (loading || !user) {
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
