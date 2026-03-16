'use client';

/**
 * PhotoDetailModal — Full Title and Description
 *
 * Dialog showing complete title, publisher, and description with close button at top.
 */

import { Dialog, DialogContent, IconButton, Typography, Box, Avatar } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { Photo } from '@/app/types';

type Publisher = Pick<Photo['user'], '_id' | 'name' | 'avatarUrl'>;

export interface PhotoDetailModalProps {
  open: boolean;
  title: string;
  description?: string;
  publisher?: Publisher | null;
  onClose: () => void;
}

export function PhotoDetailModal({
  open,
  title,
  description,
  publisher,
  onClose,
}: PhotoDetailModalProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          pt: 1,
          pr: 1,
        }}
      >
        <IconButton onClick={onClose} aria-label="إغلاق" size="small">
          <CloseIcon />
        </IconButton>
      </Box>
      <DialogContent sx={{ pt: 0, pb: 3 }}>
        <Typography variant="h6" component="h2" fontWeight={600} gutterBottom>
          {title}
        </Typography>
        {publisher?.name && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 1.5,
            }}
          >
            <Avatar
              src={publisher.avatarUrl ?? undefined}
              sx={{ width: 28, height: 28, fontSize: '0.85rem' }}
            >
              {publisher.name.charAt(0)}
            </Avatar>
            <Typography variant="body2" color="text.secondary">
              نشرها {publisher.name}
            </Typography>
          </Box>
        )}
        {description != null && description.trim() !== '' ? (
          <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
            {description}
          </Typography>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
