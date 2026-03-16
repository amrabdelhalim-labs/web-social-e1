'use client';

/**
 * Profile Page — User Account Management
 *
 * Protected route. Avatar upload (camera/device), inline edit (name/email),
 * change password, and delete account.
 */

import { useState } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { MainLayout } from '@/app/components/layout/MainLayout';
import { ProtectedRoute } from '@/app/components/auth/ProtectedRoute';
import { AvatarUploader } from '@/app/components/profile/AvatarUploader';
import { ProfileEditor } from '@/app/components/profile/ProfileEditor';
import { ChangePasswordForm } from '@/app/components/profile/ChangePasswordForm';
import { DeleteAccountDialog } from '@/app/components/profile/DeleteAccountDialog';

function ProfileContent() {
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <MainLayout>
      <Box sx={{ py: { xs: 2, sm: 3 }, maxWidth: 560, mx: 'auto' }}>
        <Typography variant="h5" component="h1" fontWeight={700} sx={{ mb: 3 }}>
          الملف الشخصي
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Avatar section */}
          <Paper sx={{ p: { xs: 2, sm: 3 }, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              صورتي الشخصية
            </Typography>
            <AvatarUploader />
          </Paper>

          {/* Profile editor */}
          <ProfileEditor />

          {/* Change password */}
          <ChangePasswordForm />

          {/* Danger zone */}
          <Paper
            sx={{
              p: { xs: 2, sm: 3 },
              borderColor: 'error.main',
              borderWidth: 1,
              borderStyle: 'solid',
            }}
          >
            <Typography variant="h6" fontWeight={600} color="error" sx={{ mb: 1 }}>
              منطقة الخطر
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              حذف الحساب نهائيًا. سيتم حذف جميع بياناتك وصورك ولا يمكن التراجع.
            </Typography>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteForeverIcon />}
              onClick={() => setDeleteOpen(true)}
            >
              حذف حسابي نهائيًا
            </Button>
          </Paper>
        </Box>

        <DeleteAccountDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} />
      </Box>
    </MainLayout>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
