'use client';

import { Box, Typography } from '@mui/material';
import { MainLayout } from '@/app/components/layout/MainLayout';
import { APP_NAME } from './config';

export default function HomePage() {
  return (
    <MainLayout>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: { xs: '50vh', md: '60vh' },
          gap: 2,
        }}
      >
        <Typography variant="h2" component="h1" fontWeight={700}>
          {APP_NAME}
        </Typography>
        <Typography variant="h6" color="text.secondary">
          موقع مشاركة الصور — قيد التطوير
        </Typography>
      </Box>
    </MainLayout>
  );
}
