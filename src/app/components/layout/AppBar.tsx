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
 * Uses elevation=0 with a hairline bottom border for a clean look
 * that works in both light and dark modes.
 */

import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material';
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
      <Container maxWidth="lg" disableGutters>
        <Toolbar sx={{ gap: 1, px: { xs: 1.5, sm: 2 } }}>
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
      </Container>
    </AppBar>
  );
}
