'use client';

/**
 * PhotoGridSkeleton — Loading placeholder for photo grid
 */

import { Grid, Skeleton } from '@mui/material';

export function PhotoGridSkeleton() {
  return (
    <Grid container spacing={{ xs: 1.5, sm: 2 }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={i}>
          <Skeleton variant="rounded" sx={{ aspectRatio: '4/3', width: '100%' }} animation="wave" />
          <Skeleton variant="text" width="60%" sx={{ mt: 1 }} />
          <Skeleton variant="text" width="90%" />
        </Grid>
      ))}
    </Grid>
  );
}
