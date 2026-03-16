'use client';

/**
 * ExpandableText — Truncated Text with "عرض المزيد"
 *
 * Shows a limited number of lines; expands on click to show full text.
 */

import { useState } from 'react';
import { Typography, Link } from '@mui/material';
import { DESCRIPTION_PREVIEW_LINES } from '@/app/config';

export interface ExpandableTextProps {
  text?: string;
  maxLines?: number;
}

export function ExpandableText({ text, maxLines = DESCRIPTION_PREVIEW_LINES }: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);

  if (!text || text.trim() === '') return null;

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setExpanded((prev) => !prev);
  };

  return (
    <Typography
      variant="body2"
      color="text.secondary"
      sx={{
        display: '-webkit-box',
        WebkitLineClamp: expanded ? 'unset' : maxLines,
        WebkitBoxOrient: 'vertical',
        overflow: expanded ? 'visible' : 'hidden',
      }}
    >
      {text}
      {text.length > 100 && (
        <Link
          component="button"
          variant="body2"
          onClick={handleToggle}
          sx={{ ml: 0.5, cursor: 'pointer' }}
        >
          {expanded ? 'عرض أقل' : 'عرض المزيد'}
        </Link>
      )}
    </Typography>
  );
}
