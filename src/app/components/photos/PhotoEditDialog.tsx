'use client';

/**
 * PhotoEditDialog — Edit Photo Title and Description
 *
 * Dialog form for editing photo metadata.
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import type { Photo, UpdatePhotoInput } from '@/app/types';
import { validateUpdatePhotoInput } from '@/app/validators';
import { PhotoTitleDescriptionFields } from './PhotoTitleDescriptionFields';

export interface PhotoEditDialogProps {
  open: boolean;
  photo: Photo | null;
  onSave: (input: UpdatePhotoInput) => Promise<void>;
  onCancel: () => void;
}

export function PhotoEditDialog({ open, photo, onSave, onCancel }: PhotoEditDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (photo) {
      setTitle(photo.title);
      setDescription(photo.description ?? '');
      setError('');
    }
  }, [photo, open]);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    e.preventDefault();
    if (!photo) return;

    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();

    const errors = validateUpdatePhotoInput({
      title: trimmedTitle,
      description: trimmedDesc || undefined,
    });
    if (errors.length > 0) {
      setError(errors[0]);
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onSave({ title: trimmedTitle, description: trimmedDesc || undefined });
      onCancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في حفظ التعديلات.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>تعديل الصورة</DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}
          <PhotoTitleDescriptionFields
            title={title}
            description={description}
            onTitleChange={setTitle}
            onDescriptionChange={setDescription}
            descriptionRows={3}
            showCharCount
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onCancel} disabled={saving}>
            إلغاء
          </Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? 'جاري الحفظ...' : 'حفظ'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
