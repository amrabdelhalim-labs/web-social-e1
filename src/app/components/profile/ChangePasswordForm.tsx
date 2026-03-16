'use client';

/**
 * ChangePasswordForm — Current + New + Confirm Password
 *
 * 3 fields, client-side validation, submit to PUT /api/profile/password.
 */

import { useState } from 'react';
import { Box, Button, Paper, Typography, CircularProgress } from '@mui/material';
import { PasswordField } from '@/app/components/common/PasswordField';
import { changePasswordApi } from '@/app/lib/api';
import { validateChangePasswordInput } from '@/app/validators';

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const errors = validateChangePasswordInput({
      currentPassword,
      newPassword,
      confirmPassword,
    });
    if (errors.length > 0) {
      setMessage({ type: 'error', text: errors[0] });
      return;
    }

    setSubmitting(true);
    try {
      await changePasswordApi({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setMessage({ type: 'success', text: 'تم تغيير كلمة المرور بنجاح.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'فشل في تغيير كلمة المرور.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Paper component="form" onSubmit={handleSubmit} sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        تغيير كلمة المرور
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <PasswordField
          label="كلمة المرور الحالية"
          value={currentPassword}
          onChange={setCurrentPassword}
          showPassword={showCurrent}
          onToggleShow={() => setShowCurrent((p) => !p)}
          autoComplete="current-password"
        />
        <PasswordField
          label="كلمة المرور الجديدة"
          value={newPassword}
          onChange={setNewPassword}
          showPassword={showNew}
          onToggleShow={() => setShowNew((p) => !p)}
          autoComplete="new-password"
        />
        <PasswordField
          label="تأكيد كلمة المرور الجديدة"
          value={confirmPassword}
          onChange={setConfirmPassword}
          showPassword={showConfirm}
          onToggleShow={() => setShowConfirm((p) => !p)}
          autoComplete="new-password"
        />

        {message && (
          <Typography
            variant="body2"
            color={message.type === 'success' ? 'success.main' : 'error.main'}
          >
            {message.text}
          </Typography>
        )}

        <Button
          type="submit"
          variant="contained"
          disabled={submitting}
          fullWidth
          sx={{ py: 1.25, minHeight: 48 }}
        >
          {submitting ? <CircularProgress size={22} color="inherit" /> : 'تغيير كلمة المرور'}
        </Button>
      </Box>
    </Paper>
  );
}
