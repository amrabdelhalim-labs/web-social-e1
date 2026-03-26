'use client';

/**
 * HomePageFeed — Interactive Client Component for the Public Photo Feed
 *
 * Receives server-rendered initial data as props (no loading flash on first paint),
 * then handles client-side interactions: load more pages.
 *
 * Like toggling is self-contained in LikeButton (per-card local state + API call).
 *
 * Architecture:
 *  - Parent (page.tsx, Server Component): fetches page 1 from DB, renders initial HTML
 *  - This component: manages pagination state, loads additional pages via client fetch
 */

import { useState, useCallback } from 'react';
import { Box, Button, Alert } from '@mui/material';
import { PhotoGrid } from './PhotoGrid';
import { getPhotosApi } from '@/app/lib/api';
import type { Photo, PaginatedApiResponse } from '@/app/types';

interface HomePageFeedProps {
  initialPhotos: Photo[];
  initialPagination: PaginatedApiResponse<Photo>['pagination'];
}

export function HomePageFeed({ initialPhotos, initialPagination }: HomePageFeedProps) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasMore = pagination.page < pagination.totalPages;

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getPhotosApi(pagination.page + 1, pagination.limit);
      setPhotos((prev) => [...prev, ...res.data]);
      setPagination(res.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحميل المزيد من الصور.');
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, pagination]);

  return (
    <Box sx={{ py: { xs: 1, sm: 2 } }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} role="alert">
          {error}
        </Alert>
      )}

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
    </Box>
  );
}
