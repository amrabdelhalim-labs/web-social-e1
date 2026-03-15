'use client';

/**
 * MainLayout — Page Wrapper Component
 *
 * Renders the SiteAppBar above the page content.
 * The main element has appropriate padding and a minimum height
 * so the footer (if added later) is pushed to the bottom.
 *
 * Usage:
 *   <MainLayout>
 *     <MyPageContent />
 *   </MainLayout>
 *
 * Pages that need a full-width hero section can opt out of the Container
 * by wrapping their own content with `Container` instead.
 */

import { Box, Container } from '@mui/material';
import { SiteAppBar } from './AppBar';

interface MainLayoutProps {
  children: React.ReactNode;
  /** Set to true for pages that manage their own Container (e.g. hero sections) */
  fullWidth?: boolean;
}

export function MainLayout({ children, fullWidth = false }: MainLayoutProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <SiteAppBar />
      <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
        {fullWidth ? children : <Container maxWidth="lg">{children}</Container>}
      </Box>
    </Box>
  );
}
