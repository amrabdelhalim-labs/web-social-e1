'use client';

/**
 * MyPhotoCard — User's Photo Card with Edit/Delete
 *
 * Displays a photo with edit and delete buttons for the owner.
 */

import { useState } from 'react';
import {
  Box,
  Card,
  CardMedia,
  CardContent,
  Typography,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { Photo } from '@/app/types';
import { ExpandableText } from './ExpandableText';
import { PhotoLightbox } from './PhotoLightbox';
import { PhotoEditDialog } from './PhotoEditDialog';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';

export interface MyPhotoCardProps {
  photo: Photo;
  onEdit: (id: string, input: { title?: string; description?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function MyPhotoCard({ photo, onEdit, onDelete }: MyPhotoCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setLightboxOpen(true);
  };

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
    await onEdit(photo._id, input);
    setEditOpen(false);
  };

  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await onDelete(photo._id);
      setDeleteOpen(false);
    } finally {
      setDeleteLoading(false);
    }
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
        <Box sx={{ position: 'relative' }}>
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
          <IconButton
            onClick={handleMenuOpen}
            sx={{
              position: 'absolute',
              top: 4,
              left: 4,
              backgroundColor: 'rgba(255,255,255,0.8)',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.95)' },
            }}
            size="small"
            aria-label="المزيد"
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>
        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            {photo.title}
          </Typography>
          <ExpandableText text={photo.description} />
        </CardContent>
      </Card>

      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={handleMenuClose}>
        <MenuItem onClick={handleEditClick}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          تعديل
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          حذف
        </MenuItem>
      </Menu>

      <PhotoLightbox
        open={lightboxOpen}
        imageUrl={photo.imageUrl}
        alt={photo.title}
        onClose={() => setLightboxOpen(false)}
      />

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
  );
}
