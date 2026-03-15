'use client';

/**
 * Providers — Global Client-Side Provider Tree
 *
 * Wraps the app with all required context providers in the correct order:
 *   ThemeProviderWrapper  → MUI theme + RTL + dark/light mode (Emotion CacheProvider)
 *   AuthProvider          → JWT auth state + user object
 *
 * RTL support is handled inside ThemeProviderWrapper via @emotion/cache +
 * @mui/stylis-plugin-rtl at module level.
 */

import { ThemeProviderWrapper } from '@/app/context/ThemeContext';
import { AuthProvider } from '@/app/context/AuthContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProviderWrapper>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProviderWrapper>
  );
}
