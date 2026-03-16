'use client';

/**
 * Home Page — Public Photo Feed
 *
 * Displays a grid of photos with lightbox, likes, and pagination.
 */

import { Box, Button, Typography, Alert, CircularProgress } from '@mui/material';
import { MainLayout } from '@/app/components/layout/MainLayout';
import { PhotoGrid } from '@/app/components/photos/PhotoGrid';
import { usePhotos } from '@/app/hooks/usePhotos';
import { APP_NAME } from './config';

export default function HomePage() {
  const { photos, loading, error, pagination, loadMore } = usePhotos();
  const hasMore = pagination.page < pagination.totalPages;

  return (
    <MainLayout>
      <Box sx={{ py: 2 }}>
        <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
          {APP_NAME}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading && photos.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={40} />
          </Box>
        ) : photos.length === 0 ? (
          <Typography variant="body1" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            لا توجد صور لعرضها بعد.
          </Typography>
        ) : (
          <>
            <PhotoGrid photos={photos} />
            {hasMore && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={loadMore}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {loading ? 'جاري التحميل...' : 'تحميل المزيد'}
                </Button>
              </Box>
            )}
          </>
        )}
      </Box>
    </MainLayout>
  );
}
