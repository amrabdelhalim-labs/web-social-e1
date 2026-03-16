'use client';

/**
 * PhotoLightbox — Full-Size Image Overlay
 *
 * Displays image in a modal overlay. Click outside or close button to dismiss.
 */

import { Box, Dialog, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export interface PhotoLightboxProps {
  open: boolean;
  imageUrl: string;
  alt?: string;
  onClose: () => void;
}

export function PhotoLightbox({ open, imageUrl, alt = 'صورة', onClose }: PhotoLightboxProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      slotProps={{
        paper: {
          sx: {
            maxWidth: '95vw',
            maxHeight: '95vh',
            backgroundColor: 'transparent',
            boxShadow: 'none',
          },
        },
        backdrop: { sx: { backgroundColor: 'rgba(0,0,0,0.9)' } },
      }}
    >
      <IconButton
        onClick={onClose}
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          color: 'white',
          zIndex: 1,
          '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
        }}
        aria-label="إغلاق"
      >
        <CloseIcon />
      </IconButton>
      <Box
        component="img"
        src={imageUrl}
        alt={alt}
        sx={{
          maxWidth: '95vw',
          maxHeight: '95vh',
          objectFit: 'contain',
        }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      />
    </Dialog>
  );
}
