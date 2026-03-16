'use client';

/**
 * 404 — Page Not Found
 */

import { Box, Typography, Button } from '@mui/material';
import Link from 'next/link';
import { MainLayout } from '@/app/components/layout/MainLayout';

export default function NotFound() {
  return (
    <MainLayout>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center',
          px: 2,
        }}
      >
        <Typography
          variant="h1"
          component="h1"
          fontWeight={700}
          color="text.secondary"
          sx={{ fontSize: '4rem', mb: 1 }}
        >
          404
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          الصفحة غير موجودة
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 360 }}>
          عذراً، لم نتمكن من العثور على الصفحة التي تبحث عنها.
        </Typography>
        <Button component={Link} href="/" variant="contained" size="large">
          العودة للرئيسية
        </Button>
      </Box>
    </MainLayout>
  );
}
