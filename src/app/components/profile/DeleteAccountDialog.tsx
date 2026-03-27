'use client';

/**
 * DeleteAccountDialog — Password-Protected Account Deletion
 *
 * Red danger zone dialog. Requires password confirmation.
 * On success: logout + redirect to home.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { PasswordField } from '@/app/components/common/PasswordField';
import { useAuth } from '@/app/hooks/useAuth';
import { deleteAccountApi } from '@/app/lib/api';

export interface DeleteAccountDialogProps {
  open: boolean;
  onClose: () => void;
}

export function DeleteAccountDialog({ open, onClose }: DeleteAccountDialogProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    if (deleting) return;
    setPassword('');
    setError('');
    onClose();
  };

  const handleDelete = async () => {
    if (!password.trim()) {
      setError('أدخل كلمة المرور للتأكيد.');
      return;
    }

    setDeleting(true);
    setError('');
    try {
      await deleteAccountApi(password);
      await logout();
      handleClose();
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في حذف الحساب.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      disableEscapeKeyDown={deleting}
    >
      <Box
        sx={{
          bgcolor: '#b71c1c',
          color: '#ffffff',
          p: 2,
          '& .MuiTypography-root': { color: '#ffffff' },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <DeleteForeverIcon sx={{ color: 'inherit' }} />
          <DialogTitle sx={{ color: 'inherit', p: 0, fontSize: '1.25rem' }}>
            حذف الحساب نهائيًا
          </DialogTitle>
        </Box>
        <Typography variant="body2" sx={{ opacity: 0.95 }}>
          لا يمكن التراجع عن هذا الإجراء. سيتم حذف جميع بياناتك وصورك.
        </Typography>
      </Box>
      <DialogContent sx={{ pt: 2 }}>
        <PasswordField
          label="كلمة المرور للتأكيد"
          value={password}
          onChange={setPassword}
          showPassword={showPassword}
          onToggleShow={() => setShowPassword((p) => !p)}
          autoComplete="current-password"
          required
        />
        {error && (
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={deleting}>
          إلغاء
        </Button>
        <Button
          onClick={handleDelete}
          color="error"
          variant="contained"
          disabled={deleting || !password.trim()}
        >
          {deleting ? <CircularProgress size={22} color="inherit" /> : 'حذف حسابي'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
