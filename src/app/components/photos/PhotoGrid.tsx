'use client';

/**
 * PhotoGrid — Responsive Photo Grid
 *
 * xs: 1 column, sm: 2, md: 3, lg: 4
 * variant: public (LikeButton) | owner (edit/delete menu)
 */

import { Grid } from '@mui/material';
import type { Photo } from '@/app/types';
import { PhotoCard, type PhotoCardVariant } from './PhotoCard';

export interface PhotoGridProps {
  photos: Photo[];
  /** public: feed with likes | owner: my photos with edit/delete */
  variant?: PhotoCardVariant;
  onEdit?: (id: string, input: { title?: string; description?: string }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export function PhotoGrid({ photos, variant = 'public', onEdit, onDelete }: PhotoGridProps) {
  return (
    <Grid container spacing={{ xs: 1.5, sm: 2 }}>
      {photos.map((photo, index) => (
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={photo._id}>
          <PhotoCard
            photo={photo}
            variant={variant}
            priority={index === 0}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </Grid>
      ))}
    </Grid>
  );
}
