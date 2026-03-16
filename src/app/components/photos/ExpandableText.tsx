'use client';

/**
 * ExpandableText — Truncated Text with "عرض المزيد"
 *
 * Shows truncated description. "عرض المزيد" appears only when text exceeds
 * the line limit. Uses char threshold + scrollHeight check. Fixed-height block keeps card heights uniform.
 */

import { useRef, useState, useEffect } from 'react';
import { Box, Typography, Link } from '@mui/material';
import {
  DESCRIPTION_PREVIEW_LINES,
  DESCRIPTION_BLOCK_MIN_HEIGHT,
  DESCRIPTION_TRUNCATE_MIN_CHARS,
} from '@/app/config';

export interface ExpandableTextProps {
  text?: string;
  maxLines?: number;
  onShowMore?: () => void;
}

function checkTruncated(el: HTMLElement): boolean {
  return el.scrollHeight > el.clientHeight;
}

export function ExpandableText({
  text,
  maxLines = DESCRIPTION_PREVIEW_LINES,
  onShowMore,
}: ExpandableTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !text) {
      setIsTruncated(false);
      return;
    }
    if (text.length < DESCRIPTION_TRUNCATE_MIN_CHARS) {
      setIsTruncated(false);
      return;
    }
    const update = () => {
      if (el) setIsTruncated(checkTruncated(el));
    };
    const rafId = requestAnimationFrame(() => requestAnimationFrame(update));
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [text, maxLines]);

  if (!text || text.trim() === '') return null;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    onShowMore?.();
  };

  return (
    <Box
      sx={{
        minHeight: DESCRIPTION_BLOCK_MIN_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        ref={containerRef}
        sx={{
          display: '-webkit-box',
          WebkitLineClamp: maxLines,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          flex: '0 0 auto',
          minHeight: 0,
          maxHeight: `calc(0.875rem * 1.65 * ${maxLines})`,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {text}
        </Typography>
      </Box>
      <Box
        sx={{
          minHeight: '1.5rem',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'flex-start',
        }}
      >
        {isTruncated && onShowMore && (
          <Link
            component="button"
            variant="body2"
            onClick={handleClick}
            sx={{
              cursor: 'pointer',
              display: 'inline-block',
              p: 0,
              minWidth: 0,
            }}
          >
            عرض المزيد
          </Link>
        )}
      </Box>
    </Box>
  );
}
