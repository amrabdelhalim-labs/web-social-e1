'use client';

/**
 * PhotoUploadForm — Upload Photo (File or Camera)
 *
 * Tabs: "رفع من الجهاز" (file picker) | "التقاط بالكاميرا" (CameraCapture)
 */

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Tabs,
  Tab,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { CameraCapture } from '@/app/components/camera/CameraCapture';
import { MAX_TITLE_LENGTH, MAX_DESCRIPTION_LENGTH, MAX_FILE_SIZE, ALLOWED_IMAGE_TYPES } from '@/app/config';

export interface PhotoUploadFormProps {
  open: boolean;
  onClose: () => void;
  onUpload: (file: File, title: string, description?: string) => Promise<void>;
}

type TabValue = 'file' | 'camera';

export function PhotoUploadForm({ open, onClose, onUpload }: PhotoUploadFormProps) {
  const [tab, setTab] = useState<TabValue>('file');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setTab('file');
    setTitle('');
    setDescription('');
    setFile(null);
    setError('');
    setSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!ALLOWED_IMAGE_TYPES.includes(selected.type)) {
      setError('صيغة الملف غير مدعومة. الصيغ المسموحة: PNG, JPEG.');
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      setError('حجم الصورة يتجاوز الحد المسموح (5 ميجابايت).');
      return;
    }

    setFile(selected);
    setError('');
    e.target.value = '';
  };

  const handleCapture = (capturedFile: File) => {
    setFile(capturedFile);
    setError('');
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    e.preventDefault();
    if (!file) {
      setError(tab === 'camera' ? 'التقط صورة أولاً.' : 'اختر صورة من الجهاز.');
      return;
    }

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('عنوان الصورة مطلوب.');
      return;
    }
    if (trimmedTitle.length > MAX_TITLE_LENGTH) {
      setError(`العنوان يجب ألا يتجاوز ${MAX_TITLE_LENGTH} حرفًا.`);
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await onUpload(file, trimmedTitle, description.trim() || undefined);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في رفع الصورة.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>رفع صورة جديدة</DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <Tabs value={tab} onChange={(_, v: TabValue) => { setTab(v); setFile(null); setError(''); }}>
          <Tab value="file" label="رفع من الجهاز" icon={<UploadFileIcon />} iconPosition="start" />
          <Tab value="camera" label="التقاط بالكاميرا" icon={<CameraAltIcon />} iconPosition="start" />
        </Tabs>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, minHeight: 200 }}>
          {error && <Alert severity="error">{error}</Alert>}

          {!file && tab === 'file' && (
            <Box>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <Button
                variant="outlined"
                startIcon={<UploadFileIcon />}
                onClick={() => fileInputRef.current?.click()}
                fullWidth
              >
                اختر صورة
              </Button>
            </Box>
          )}

          {!file && tab === 'camera' && (
            <CameraCapture onCapture={handleCapture} onCancel={handleClose} />
          )}

          {file && (
            <>
              <Typography variant="body2" color="text.secondary">
                {file.name}
              </Typography>
              <TextField
                label="العنوان"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                fullWidth
                required
                slotProps={{ htmlInput: { maxLength: MAX_TITLE_LENGTH } }}
              />
              <TextField
                label="الوصف"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                multiline
                rows={2}
                slotProps={{ htmlInput: { maxLength: MAX_DESCRIPTION_LENGTH } }}
              />
              <Button variant="text" size="small" onClick={() => setFile(null)}>
                تغيير الصورة
              </Button>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={submitting}>
            إلغاء
          </Button>
          <Button type="submit" variant="contained" disabled={!file || submitting}>
            {submitting ? 'جاري الرفع...' : 'رفع'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
