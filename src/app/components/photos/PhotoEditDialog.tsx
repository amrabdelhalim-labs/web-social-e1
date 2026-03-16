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
  TextField,
  Typography,
} from '@mui/material';
import { MAX_TITLE_LENGTH, MAX_DESCRIPTION_LENGTH } from '@/app/config';
import type { Photo, UpdatePhotoInput } from '@/app/types';

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
    if (!trimmedTitle) {
      setError('عنوان الصورة مطلوب.');
      return;
    }
    if (trimmedTitle.length > MAX_TITLE_LENGTH) {
      setError(`العنوان يجب ألا يتجاوز ${MAX_TITLE_LENGTH} حرفًا.`);
      return;
    }
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      setError(`الوصف يجب ألا يتجاوز ${MAX_DESCRIPTION_LENGTH} حرفًا.`);
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onSave({ title: trimmedTitle, description: description.trim() || undefined });
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
          <TextField
            label="العنوان"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
            slotProps={{ htmlInput: { maxLength: MAX_TITLE_LENGTH } }}
            helperText={`${title.length}/${MAX_TITLE_LENGTH}`}
          />
          <TextField
            label="الوصف"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
            slotProps={{ htmlInput: { maxLength: MAX_DESCRIPTION_LENGTH } }}
            helperText={`${description.length}/${MAX_DESCRIPTION_LENGTH}`}
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
