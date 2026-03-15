'use client';

/**
 * SiteAppBar — Main Application Header
 *
 * Contains:
 *  - App logo/name linking to the home page
 *  - ThemeToggle (always visible)
 *  - For authenticated users: UserMenu
 *  - For guests: "تسجيل الدخول" and "إنشاء حساب" buttons
 *
 * Layout: Full-width toolbar with responsive padding (xs: 16px, sm+: 24px).
 * No max-width constraint — follows Material Design and common app patterns.
 * Uses elevation=0 with a hairline bottom border for a clean look.
 */

import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material';
import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';
import { useAuth } from '@/app/hooks/useAuth';
import { APP_NAME } from '@/app/config';

export function SiteAppBar() {
  const { user, loading } = useAuth();

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        color: 'text.primary',
      }}
    >
      <Toolbar sx={{ gap: 1, px: { xs: 2, sm: 3 } }}>
        {/* Logo / App name */}
        <Typography
          variant="h6"
          component={Link}
          href="/"
          fontWeight={800}
          color="primary"
          sx={{ textDecoration: 'none', flexGrow: 1, letterSpacing: '-0.02em' }}
        >
          {APP_NAME}
        </Typography>

        {/* Theme toggle — always visible */}
        <ThemeToggle />

        {/* Auth actions — hide during initial loading to avoid flash */}
        {!loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {user ? (
              <UserMenu />
            ) : (
              <>
                <Button
                  component={Link}
                  href="/login"
                  variant="text"
                  size="small"
                  color="inherit"
                >
                  تسجيل الدخول
                </Button>
                <Button
                  component={Link}
                  href="/register"
                  variant="contained"
                  size="small"
                  disableElevation
                >
                  إنشاء حساب
                </Button>
              </>
            )}
          </Box>
        )}
        </Toolbar>
    </AppBar>
  );
}
