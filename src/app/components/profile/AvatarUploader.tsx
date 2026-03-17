'use client';

/**
 * AvatarUploader — Profile Picture with Upload/Capture/Delete
 *
 * - Avatar display (initials fallback when no avatarUrl)
 * - Camera overlay on hover
 * - Menu on click: "رفع من الجهاز" | "التقاط بالكاميرا"
 * - Optimistic preview before server save
 * - "حذف الصورة الحالية" when avatar exists
 */

import { useState, useRef } from 'react';
import {
  Avatar,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogContent,
  Typography,
  CircularProgress,
} from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import { CameraCapture } from '@/app/components/camera/CameraCapture';
import { useAuth } from '@/app/hooks/useAuth';
import { uploadAvatarApi, deleteAvatarApi } from '@/app/lib/api';
import { ALLOWED_IMAGE_TYPES, AVATAR_MAX_FILE_SIZE } from '@/app/config';

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function AvatarUploader() {
  const { user, updateUser } = useAuth();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [optimisticUrl, setOptimisticUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayUrl = optimisticUrl ?? user?.avatarUrl ?? null;
  const hasAvatar = Boolean(displayUrl);

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
    setError('');
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setError('');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError('صيغة الملف غير مدعومة. الصيغ المسموحة: PNG, JPEG.');
      return;
    }
    if (file.size > AVATAR_MAX_FILE_SIZE) {
      setError('حجم الصورة يتجاوز الحد المسموح (2 ميجابايت).');
      return;
    }

    handleMenuClose();
    setUploading(true);
    setError('');
    const objectUrl = URL.createObjectURL(file);
    setOptimisticUrl(objectUrl);

    try {
      const res = await uploadAvatarApi(file);
      if (res.data) updateUser(res.data);
      setOptimisticUrl(null);
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setOptimisticUrl(null);
      URL.revokeObjectURL(objectUrl);
      setError(err instanceof Error ? err.message : 'فشل في رفع الصورة.');
    } finally {
      setUploading(false);
    }
  };

  const handleCapture = async (file: File) => {
    setCameraOpen(false);
    handleMenuClose();
    setUploading(true);
    setError('');
    const objectUrl = URL.createObjectURL(file);
    setOptimisticUrl(objectUrl);

    try {
      const res = await uploadAvatarApi(file);
      if (res.data) updateUser(res.data);
      setOptimisticUrl(null);
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setOptimisticUrl(null);
      URL.revokeObjectURL(objectUrl);
      setError(err instanceof Error ? err.message : 'فشل في رفع الصورة.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!hasAvatar) return;
    handleMenuClose();
    setDeleting(true);
    setError('');
    const previousUrl = displayUrl;
    setOptimisticUrl(null);

    try {
      const res = await deleteAvatarApi();
      if (res.data) updateUser(res.data);
    } catch (err) {
      setOptimisticUrl(previousUrl);
      setError(err instanceof Error ? err.message : 'فشل في حذف الصورة.');
    } finally {
      setDeleting(false);
    }
  };

  if (!user) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <Box
        sx={{
          position: 'relative',
          '&:hover .avatar-overlay': { opacity: 1 },
        }}
      >
        <IconButton
          onClick={handleMenuOpen}
          sx={{
            p: 0,
            '&:hover': { backgroundColor: 'transparent' },
          }}
          aria-label="تغيير صورة الملف الشخصي"
          disabled={uploading || deleting}
        >
          <Avatar
            src={displayUrl ?? undefined}
            sx={{
              width: 120,
              height: 120,
              fontSize: '2.5rem',
              bgcolor: 'primary.main',
            }}
          >
            {getInitials(user.name)}
          </Avatar>
        </IconButton>
        <Box
          className="avatar-overlay"
          sx={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            bgcolor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0,
            transition: 'opacity 0.2s',
            pointerEvents: 'none',
          }}
        >
          <CameraAltIcon sx={{ color: 'white', fontSize: 40 }} />
        </Box>
        {(uploading || deleting) && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              bgcolor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CircularProgress size={36} sx={{ color: 'white' }} />
          </Box>
        )}
      </Box>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <MenuItem
          onClick={() => {
            fileInputRef.current?.click();
          }}
        >
          <UploadFileIcon fontSize="small" sx={{ mr: 1 }} />
          رفع من الجهاز
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            setCameraOpen(true);
          }}
        >
          <CameraAltIcon fontSize="small" sx={{ mr: 1 }} />
          التقاط بالكاميرا
        </MenuItem>
        {hasAvatar && (
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            حذف الصورة الحالية
          </MenuItem>
        )}
      </Menu>

      <Dialog open={cameraOpen} onClose={() => setCameraOpen(false)} maxWidth="sm" fullWidth>
        <DialogContent sx={{ p: 0, minHeight: 320 }}>
          <CameraCapture onCapture={handleCapture} onCancel={() => setCameraOpen(false)} />
        </DialogContent>
      </Dialog>

      {error && (
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      )}
    </Box>
  );
}
