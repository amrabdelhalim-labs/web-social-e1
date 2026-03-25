'use client';

/**
 * ExpandableText — Truncated description with optional "show more" control
 *
 * Shows a truncated block. The expand action appears only when text exceeds
 * the line limit. Uses char threshold + scrollHeight check.
 */

import { useRef, useState, useEffect } from 'react';
import { Box, Typography, Link } from '@mui/material';
import { DESCRIPTION_PREVIEW_LINES, DESCRIPTION_TRUNCATE_MIN_CHARS } from '@/app/config';

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
    if (!el || !text || text.length < DESCRIPTION_TRUNCATE_MIN_CHARS) {
      const resetId = requestAnimationFrame(() => {
        setIsTruncated(false);
      });
      return () => cancelAnimationFrame(resetId);
    }

    if (typeof ResizeObserver === 'undefined') {
      const fallbackId = requestAnimationFrame(() => {
        setIsTruncated(checkTruncated(el));
      });
      return () => cancelAnimationFrame(fallbackId);
    }

    const update = () => {
      setIsTruncated(checkTruncated(el));
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
