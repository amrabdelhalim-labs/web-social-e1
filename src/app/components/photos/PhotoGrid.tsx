'use client';

/**
 * PhotoGrid — Responsive Photo Grid
 *
 * xs: 1 column, sm: 2, md: 3, lg: 4
 */

import { Grid } from '@mui/material';
import type { Photo } from '@/app/types';
import { PhotoCard } from './PhotoCard';

export interface PhotoGridProps {
  photos: Photo[];
}

export function PhotoGrid({ photos }: PhotoGridProps) {
  return (
    <Grid container spacing={2}>
      {photos.map((photo) => (
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={photo._id}>
          <PhotoCard photo={photo} />
        </Grid>
      ))}
    </Grid>
  );
}
