/**
 * useThemeMode — Theme Context Hook
 *
 * Typed shortcut for consuming ThemeContext.
 * Must be used inside <ThemeProviderWrapper>.
 *
 * Returns:
 *   { mode: 'light' | 'dark', toggleMode: () => void }
 */

import { useContext } from 'react';
import { ThemeContext, type ThemeContextValue } from '@/app/context/ThemeContext';

export function useThemeMode(): ThemeContextValue {
  return useContext(ThemeContext);
}
