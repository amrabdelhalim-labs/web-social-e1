'use client';

/**
 * PhotoCard — Unified Photo Card
 *
 * Displays a photo with metadata. Behavior depends on variant:
 * - public: Like button (feed/home)
 * - owner: Menu with edit/delete (my-photos)
 *
 * Click image → lightbox. Click title → detail modal.
 */

import { useState } from 'react';
import {
  Avatar,
  Box,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { Photo } from '@/app/types';
import { ExpandableText } from './ExpandableText';
import { DESCRIPTION_BLOCK_MIN_HEIGHT } from '@/app/config';
import { PhotoLightbox } from './PhotoLightbox';
import { PhotoDetailModal } from './PhotoDetailModal';
import { LikeButton } from './LikeButton';
import { PhotoEditDialog } from './PhotoEditDialog';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { OptimizedPhotoImage } from './OptimizedPhotoImage';

export type PhotoCardVariant = 'public' | 'owner';

export interface PhotoCardProps {
  photo: Photo;
  /** public: LikeButton | owner: Menu (edit/delete). Default: public */
  variant?: PhotoCardVariant;
  /** Mark image as LCP candidate (above-the-fold). Use for first photo in grid. */
  priority?: boolean;
  /** Required when variant='owner' */
  onEdit?: (id: string, input: { title?: string; description?: string }) => Promise<void>;
  /** Required when variant='owner' */
  onDelete?: (id: string) => Promise<void>;
}

const cardSx = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
} as const;

const cardMediaSx = {
  cursor: 'pointer',
  aspectRatio: '4/3',
  backgroundColor: 'action.hover',
  flexShrink: 0,
  position: 'relative',
  overflow: 'hidden',
  '&:hover': { opacity: 0.95 },
} as const;

const cardContentSx = {
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: 0.5,
  minHeight: 0,
  '&:last-child': { pb: 1.5 },
} as const;

const headerRowSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  flexShrink: 0,
  minWidth: 0,
} as const;

const titleButtonSx = {
  flex: 1,
  minWidth: 0,
  justifyContent: 'flex-start',
  textAlign: 'inherit',
  textTransform: 'none',
  color: 'primary.main',
  fontWeight: 600,
  fontSize: '1rem',
  '&:hover': {
    textDecoration: 'underline',
    backgroundColor: 'transparent',
  },
} as const;

export function PhotoCard({
  photo,
  variant = 'public',
  priority = false,
  onEdit,
  onDelete,
}: PhotoCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const isOwner = variant === 'owner';

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setLightboxOpen(true);
  };

  const handleShowDetail = () => setDetailOpen(true);

  const handleMenuOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
  };

  const handleMenuClose = () => setMenuAnchor(null);

  const handleEditClick = () => {
    handleMenuClose();
    setEditOpen(true);
  };

  const handleDeleteClick = () => {
    handleMenuClose();
    setDeleteOpen(true);
  };

  const handleSaveEdit = async (input: { title?: string; description?: string }) => {
    if (onEdit) await onEdit(photo._id, input);
    setEditOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!onDelete) return;
    setDeleteLoading(true);
    try {
      await onDelete(photo._id);
      setDeleteOpen(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  /** Same slot for both: LikeButton (public) or Menu (owner) — consistent position */
  const headerEndSlot =
    variant === 'public' ? (
      <LikeButton
        photoId={photo._id}
        liked={photo.isLiked ?? false}
        likesCount={photo.likesCount}
      />
    ) : (
      <IconButton
        onClick={handleMenuOpen}
        size="small"
        aria-label="خيارات الصورة"
        aria-haspopup="true"
        aria-controls={menuAnchor ? 'menu-options' : undefined}
        sx={{ minWidth: 40, minHeight: 40, flexShrink: 0 }}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
    );

  return (
    <>
      <Card sx={cardSx}>
        <CardMedia component="div" sx={cardMediaSx} onClick={handleImageClick}>
          <OptimizedPhotoImage src={photo.imageUrl} alt={photo.title} fill priority={priority} />
        </CardMedia>
        <CardContent sx={cardContentSx}>
          <Box sx={headerRowSx}>
            <Button onClick={handleShowDetail} sx={titleButtonSx}>
              <Typography
                variant="subtitle1"
                component="span"
                noWrap
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  width: '100%',
                }}
              >
                {photo.title}
              </Typography>
            </Button>
            {headerEndSlot}
          </Box>
          {photo.user?.name && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                flexShrink: 0,
              }}
            >
              <Avatar
                src={photo.user.avatarUrl ?? undefined}
                sx={{ width: 20, height: 20, fontSize: '0.7rem' }}
              >
                {photo.user.name.charAt(0)}
              </Avatar>
              <Typography variant="caption" color="text.secondary">
                نشرها {photo.user.name}
              </Typography>
            </Box>
          )}
          <Box
            sx={{
              flexGrow: 1,
              minHeight: DESCRIPTION_BLOCK_MIN_HEIGHT,
              minWidth: 0,
              overflow: 'hidden',
            }}
          >
            <ExpandableText text={photo.description} onShowMore={handleShowDetail} />
          </Box>
        </CardContent>
      </Card>

      <PhotoLightbox
        open={lightboxOpen}
        imageUrl={photo.imageUrl}
        alt={photo.title}
        onClose={() => setLightboxOpen(false)}
      />

      <PhotoDetailModal
        open={detailOpen}
        title={photo.title}
        description={photo.description}
        publisher={photo.user}
        onClose={() => setDetailOpen(false)}
      />

      {isOwner && (
        <>
          <Menu
            id="menu-options"
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={handleMenuClose}
            anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
            transformOrigin={{ horizontal: 'left', vertical: 'top' }}
          >
            <MenuItem onClick={handleEditClick}>
              <EditIcon fontSize="small" sx={{ mr: 1 }} />
              تعديل
            </MenuItem>
            <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
              حذف
            </MenuItem>
          </Menu>

          <PhotoEditDialog
            open={editOpen}
            photo={photo}
            onSave={handleSaveEdit}
            onCancel={() => setEditOpen(false)}
          />

          <DeleteConfirmDialog
            open={deleteOpen}
            title="حذف الصورة"
            message="هل أنت متأكد من حذف هذه الصورة؟ لا يمكن التراجع عن هذا الإجراء."
            confirmLabel="حذف"
            onConfirm={handleConfirmDelete}
            onCancel={() => setDeleteOpen(false)}
            loading={deleteLoading}
          />
        </>
      )}
    </>
  );
}
