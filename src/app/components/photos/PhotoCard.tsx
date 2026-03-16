'use client';

/**
 * PhotoCard — Image Card with Title, Description, Like
 *
 * Displays a photo with metadata. Click image to open lightbox.
 */

import { useState } from 'react';
import { Box, Card, CardMedia, CardContent, Typography } from '@mui/material';
import type { Photo } from '@/app/types';
import { ExpandableText } from './ExpandableText';
import { LikeButton } from './LikeButton';
import { PhotoLightbox } from './PhotoLightbox';

export interface PhotoCardProps {
  photo: Photo;
}

export function PhotoCard({ photo }: PhotoCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setLightboxOpen(true);
  };

  return (
    <>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <CardMedia
          component="div"
          sx={{
            cursor: 'pointer',
            aspectRatio: '4/3',
            backgroundColor: 'action.hover',
            '&:hover': { opacity: 0.95 },
          }}
          onClick={handleImageClick}
        >
          <Box
            component="img"
            src={photo.imageUrl}
            alt={photo.title}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </CardMedia>
        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            {photo.title}
          </Typography>
          <ExpandableText text={photo.description} />
          <LikeButton
            photoId={photo._id}
            liked={photo.isLiked ?? false}
            likesCount={photo.likesCount}
          />
        </CardContent>
      </Card>

      <PhotoLightbox
        open={lightboxOpen}
        imageUrl={photo.imageUrl}
        alt={photo.title}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
