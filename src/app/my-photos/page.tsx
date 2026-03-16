'use client';

/**
 * My Photos Page — User's Photo Gallery
 *
 * Protected route. FAB to upload, grid of user's photos with edit/delete.
 */

import { useState } from 'react';
import { Box, Button, Typography, Alert, Fab } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { MainLayout } from '@/app/components/layout/MainLayout';
import { ProtectedRoute } from '@/app/components/auth/ProtectedRoute';
import { PhotoUploadForm } from '@/app/components/photos/PhotoUploadForm';
import { PhotoGrid } from '@/app/components/photos/PhotoGrid';
import { PhotoGridSkeleton } from '@/app/components/photos/PhotoGridSkeleton';
import { useMyPhotos } from '@/app/hooks/useMyPhotos';

function MyPhotosContent() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const { photos, loading, error, pagination, loadMore, upload, update, remove } = useMyPhotos();

  const hasMore = pagination.page < pagination.totalPages;

  const handleUpload = async (file: File, title: string, description?: string) => {
    await upload(file, title, description);
  };

  return (
    <MainLayout>
      <Box sx={{ py: { xs: 1, sm: 2 }, pb: { xs: 10, sm: 12 } }}>
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
            لا توجد صور لديك. ارفع صورة جديدة.
          </Typography>
        ) : (
          <>
            <PhotoGrid photos={photos} variant="owner" onEdit={update} onDelete={remove} />
            {hasMore && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
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

        <Fab
          color="primary"
          aria-label="رفع صورة"
          sx={{
            position: 'fixed',
            bottom: { xs: 16, sm: 24 },
            right: { xs: 16, sm: 24 },
            width: 56,
            height: 56,
          }}
          onClick={() => setUploadOpen(true)}
        >
          <AddIcon />
        </Fab>

        <PhotoUploadForm
          open={uploadOpen}
          onClose={() => setUploadOpen(false)}
          onUpload={handleUpload}
        />
      </Box>
    </MainLayout>
  );
}

export default function MyPhotosPage() {
  return (
    <ProtectedRoute>
      <MyPhotosContent />
    </ProtectedRoute>
  );
}
