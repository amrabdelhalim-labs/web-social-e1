'use client';

/**
 * DeleteConfirmDialog — Confirm Delete Action
 *
 * Dialog with confirm/cancel buttons. Used for photo delete confirmation.
 */

import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';

export interface DeleteConfirmDialogProps {
  open: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function DeleteConfirmDialog({
  open,
  title = 'تأكيد الحذف',
  message = 'هل أنت متأكد من حذف هذا العنصر؟',
  confirmLabel = 'حذف',
  cancelLabel = 'إلغاء',
  onConfirm,
  onCancel,
  loading = false,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{message}</DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained" disabled={loading}>
          {loading ? 'جاري الحذف...' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
