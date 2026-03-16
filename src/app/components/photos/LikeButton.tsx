'use client';

/**
 * LikeButton — Optimistic Like Toggle
 *
 * Updates UI immediately (optimistic), rolls back on API error.
 */

import { useState } from 'react';
import { IconButton, Typography, Box } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { toggleLikeApi } from '@/app/lib/api';
import { useAuth } from '@/app/hooks/useAuth';

export interface LikeButtonProps {
  photoId: string;
  liked: boolean;
  likesCount: number;
  onToggle?: (liked: boolean, likesCount: number) => void;
}

export function LikeButton({
  photoId,
  liked: initialLiked,
  likesCount: initialCount,
  onToggle,
}: LikeButtonProps) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || loading) return;

    const prevLiked = liked;
    const prevCount = likesCount;

    setLiked(!liked);
    setLikesCount(liked ? likesCount - 1 : likesCount + 1);
    setLoading(true);

    try {
      const res = await toggleLikeApi(photoId);
      if (res.data) {
        setLiked(res.data.liked);
        setLikesCount(res.data.likesCount);
        onToggle?.(res.data.liked, res.data.likesCount);
      }
    } catch {
      setLiked(prevLiked);
      setLikesCount(prevCount);
      onToggle?.(prevLiked, prevCount);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <IconButton
        onClick={handleClick}
        disabled={!user || loading}
        size="small"
        aria-label={liked ? 'إلغاء الإعجاب' : 'إعجاب'}
        sx={{ color: liked ? 'error.main' : 'text.secondary' }}
      >
        {liked ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
      </IconButton>
      <Typography variant="body2" color="text.secondary">
        {likesCount}
      </Typography>
    </Box>
  );
}
