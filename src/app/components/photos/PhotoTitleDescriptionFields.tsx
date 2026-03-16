'use client';

/**
 * PhotoTitleDescriptionFields — Shared title and description inputs
 *
 * Used in PhotoUploadForm and PhotoEditDialog.
 */

import { TextField } from '@mui/material';
import { MAX_TITLE_LENGTH, MAX_DESCRIPTION_LENGTH } from '@/app/config';

export interface PhotoTitleDescriptionFieldsProps {
  title: string;
  description: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  descriptionRows?: number;
  showCharCount?: boolean;
}

export function PhotoTitleDescriptionFields({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  descriptionRows = 3,
  showCharCount = false,
}: PhotoTitleDescriptionFieldsProps) {
  return (
    <>
      <TextField
        label="العنوان"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        fullWidth
        required
        slotProps={{ htmlInput: { maxLength: MAX_TITLE_LENGTH } }}
        helperText={showCharCount ? `${title.length}/${MAX_TITLE_LENGTH}` : undefined}
      />
      <TextField
        label="الوصف"
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        fullWidth
        multiline
        rows={descriptionRows}
        slotProps={{ htmlInput: { maxLength: MAX_DESCRIPTION_LENGTH } }}
        helperText={showCharCount ? `${description.length}/${MAX_DESCRIPTION_LENGTH}` : undefined}
      />
    </>
  );
}
