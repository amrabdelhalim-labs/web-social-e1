'use client';

/**
 * Home Page — Public Photo Feed
 *
 * Displays a grid of photos with lightbox, likes, and pagination.
 */

import { Box, Button, Typography, Alert } from '@mui/material';
import { MainLayout } from '@/app/components/layout/MainLayout';
import { PhotoGrid } from '@/app/components/photos/PhotoGrid';
import { PhotoGridSkeleton } from '@/app/components/photos/PhotoGridSkeleton';
import { usePhotos } from '@/app/hooks/usePhotos';

export default function HomePage() {
  const { photos, loading, error, pagination, loadMore } = usePhotos();
  const hasMore = pagination.page < pagination.totalPages;

  return (
    <MainLayout>
      <Box sx={{ py: { xs: 1, sm: 2 } }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} role="alert">
            {error}
          </Alert>
        )}

        {loading && photos.length === 0 ? (
          <PhotoGridSkeleton />
        ) : photos.length === 0 ? (
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ py: { xs: 6, sm: 8 }, textAlign: 'center' }}
          >
            لا توجد صور لعرضها بعد.
          </Typography>
        ) : (
          <>
            <PhotoGrid photos={photos} />
            {hasMore && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 2, sm: 3 } }}>
                <Button
                  variant="outlined"
                  onClick={loadMore}
                  disabled={loading}
                  aria-busy={loading}
                  aria-label={loading ? 'جاري التحميل' : 'تحميل المزيد'}
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
