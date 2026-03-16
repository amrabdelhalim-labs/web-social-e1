'use client';

/**
 * PasswordField — TextField with show/hide toggle
 */

import { TextField, InputAdornment, IconButton } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

export interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  showPassword: boolean;
  onToggleShow: () => void;
  autoComplete?: string;
  required?: boolean;
}

export function PasswordField({
  label,
  value,
  onChange,
  showPassword,
  onToggleShow,
  autoComplete = 'current-password',
  required = true,
}: PasswordFieldProps) {
  return (
    <TextField
      label={label}
      type={showPassword ? 'text' : 'password'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      fullWidth
      required={required}
      margin="normal"
      autoComplete={autoComplete}
      slotProps={{
        htmlInput: { 'aria-label': label },
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={onToggleShow}
                edge="end"
                aria-label={showPassword ? 'إخفاء كلمة المرور' : 'عرض كلمة المرور'}
                size="small"
              >
                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
