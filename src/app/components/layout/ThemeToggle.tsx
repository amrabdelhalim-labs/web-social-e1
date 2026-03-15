'use client';

/**
 * ThemeToggle — Dark/Light Mode Button
 *
 * Renders a MUI IconButton that switches between sun (light) and moon (dark).
 * Reads/writes mode via ThemeContext. Safe in both SSR and CSR:
 * the icon defaults to sun on server render (matching the default 'light' mode)
 * and switches after hydration when the real preference is applied.
 */

import { IconButton, Tooltip } from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useThemeMode } from '@/app/hooks/useThemeMode';

export function ThemeToggle() {
  const { mode, toggleMode } = useThemeMode();

  return (
    <Tooltip title={mode === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}>
      <IconButton onClick={toggleMode} color="inherit" aria-label="تبديل السمة" size="medium">
        {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>
    </Tooltip>
  );
}
