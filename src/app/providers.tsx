'use client';

/**
 * Providers — Global Client-Side Provider Tree
 *
 * Wraps the app with all required context providers in the correct order:
 *   ThemeProviderWrapper  → MUI theme + RTL + dark/light mode context
 *   AuthProvider          → JWT auth state + user object
 *
 * The RTL Emotion cache is handled inside ThemeProviderWrapper using
 * @emotion/cache and CacheProvider — no AppRouterCacheProvider needed.
 * This avoids the "Functions cannot be passed directly to Client Components"
 * error that occurs when function-type stylisPlugins are serialized across
 * the Server/Client component boundary.
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
