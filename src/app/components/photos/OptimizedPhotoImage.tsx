'use client';

/**
 * OptimizedPhotoImage — next/image for supported URLs, img fallback
 *
 * Uses next/image for same-origin (/uploads/) and Cloudinary.
 * Falls back to img for S3 or other external URLs.
 */

import Image from 'next/image';
import { Box } from '@mui/material';

export interface OptimizedPhotoImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  /** Mark as LCP candidate (above-the-fold). Uses priority + loading="eager". */
  priority?: boolean;
  sx?: object;
}

const CLOUDINARY_HOST = 'res.cloudinary.com';

function useNextImage(src: string): boolean {
  if (typeof src !== 'string') return false;
  if (src.startsWith('/')) return true;
  try {
    const url = new URL(src);
    return url.hostname === CLOUDINARY_HOST;
  } catch {
    return false;
  }
}

export function OptimizedPhotoImage({
  src,
  alt,
  fill = false,
  priority = false,
  sx,
}: OptimizedPhotoImageProps) {
  const useNext = useNextImage(src);

  if (useNext) {
    return (
      <Image
        src={src}
        alt={alt}
        fill={fill}
        priority={priority}
        sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, (max-width: 1200px) 33vw, 25vw"
        style={{ objectFit: 'cover' }}
      />
    );
  }

  return (
    <Box
      component="img"
      src={src}
      alt={alt}
      sx={{ width: '100%', height: '100%', objectFit: 'cover', ...sx }}
    />
  );
}
