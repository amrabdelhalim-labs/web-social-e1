'use client';

/**
 * My Photos Page — User's Photo Gallery
 *
 * Protected route. FAB to upload, grid of user's photos with edit/delete.
 */

import { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Fab,
  Grid,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { MainLayout } from '@/app/components/layout/MainLayout';
import { ProtectedRoute } from '@/app/components/auth/ProtectedRoute';
import { PhotoUploadForm } from '@/app/components/photos/PhotoUploadForm';
import { MyPhotoCard } from '@/app/components/photos/MyPhotoCard';
import { useMyPhotos } from '@/app/hooks/useMyPhotos';

function MyPhotosContent() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const {
    photos,
    loading,
    error,
    pagination,
    loadMore,
    upload,
    update,
    remove,
  } = useMyPhotos();

  const hasMore = pagination.page < pagination.totalPages;

  const handleUpload = async (file: File, title: string, description?: string) => {
    await upload(file, title, description);
  };

  return (
    <MainLayout>
      <Box sx={{ py: 2, pb: 10 }}>
        <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
          صوري
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
            لا توجد صور لديك بعد. ارفع صورة جديدة!
          </Typography>
        ) : (
          <>
            <Grid container spacing={2}>
              {photos.map((photo) => (
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={photo._id}>
                  <MyPhotoCard photo={photo} onEdit={update} onDelete={remove} />
                </Grid>
              ))}
            </Grid>
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

        <Fab
          color="primary"
          aria-label="رفع صورة"
          sx={{ position: 'fixed', bottom: 24, right: 24 }}
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
