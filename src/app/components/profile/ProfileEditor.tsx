'use client';

/**
 * ProfileEditor — Inline Editing for Name and Email
 *
 * Each field: display mode with edit icon → edit mode with confirm/cancel.
 * Success/error message per field.
 */

import { useState } from 'react';
import { Box, TextField, IconButton, Typography, Paper, InputAdornment } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '@/app/hooks/useAuth';
import { updateProfileApi } from '@/app/lib/api';
import { validateUpdateUserInput } from '@/app/validators';

type Field = 'name' | 'email';

export function ProfileEditor() {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState<Field | null>(null);
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleStartEdit = (field: Field) => {
    setEditing(field);
    setMessage(null);
    if (field === 'name') setName(user?.name ?? '');
    if (field === 'email') setEmail(user?.email ?? '');
  };

  const handleCancel = () => {
    setEditing(null);
    setMessage(null);
    setName(user?.name ?? '');
    setEmail(user?.email ?? '');
  };

  const handleSave = async (field: Field) => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    const input =
      field === 'name' ? { name: trimmedName } : field === 'email' ? { email: trimmedEmail } : {};

    const errors = validateUpdateUserInput(input);
    if (errors.length > 0) {
      setMessage({ type: 'error', text: errors[0] });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const res = await updateProfileApi(input);
      if (res.data) updateUser(res.data);
      setMessage({
        type: 'success',
        text: field === 'name' ? 'تم تحديث الاسم.' : 'تم تحديث البريد.',
      });
      setEditing(null);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'فشل في حفظ التعديلات.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <Paper sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        البيانات الشخصية
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Name field */}
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            الاسم
          </Typography>
          {editing === 'name' ? (
            <TextField
              value={name}
              onChange={(e) => setName(e.target.value)}
              size="small"
              fullWidth
              disabled={saving}
              slotProps={{
                htmlInput: { maxLength: 50 },
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => handleSave('name')}
                        disabled={saving}
                        aria-label="حفظ"
                      >
                        <CheckIcon color="primary" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={handleCancel}
                        disabled={saving}
                        aria-label="إلغاء"
                      >
                        <CloseIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              autoFocus
            />
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="body1">{user.name}</Typography>
              <IconButton
                size="small"
                onClick={() => handleStartEdit('name')}
                aria-label="تعديل الاسم"
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Box>

        {/* Email field */}
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            البريد الإلكتروني
          </Typography>
          {editing === 'email' ? (
            <TextField
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              size="small"
              fullWidth
              type="email"
              disabled={saving}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => handleSave('email')}
                        disabled={saving}
                        aria-label="حفظ"
                      >
                        <CheckIcon color="primary" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={handleCancel}
                        disabled={saving}
                        aria-label="إلغاء"
                      >
                        <CloseIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              autoFocus
            />
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="body1">{user.email}</Typography>
              <IconButton
                size="small"
                onClick={() => handleStartEdit('email')}
                aria-label="تعديل البريد"
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Box>

        {message && (
          <Typography
            variant="body2"
            color={message.type === 'success' ? 'success.main' : 'error.main'}
          >
            {message.text}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}
