/**
 * Test Utilities — Custom Render with MUI Provider
 *
 * Wraps components with a minimal MUI ThemeProvider + Emotion CacheProvider
 * so that MUI components render correctly in jsdom without any Next.js server
 * context. All other providers (Auth, ThemeContext) are mocked per test file.
 *
 * Usage:
 *   import { render, screen, fireEvent, waitFor } from './utils';
 *
 * All re-exported names come from @testing-library/react, with render
 * overridden to inject the MUI wrapper automatically.
 */

import { createTheme, ThemeProvider } from '@mui/material';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { render as rtlRender, type RenderOptions, type RenderResult } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';

// ─── Minimal Emotion cache for tests (no RTL plugin needed) ──────────────────

const testCache = createCache({ key: 'test', prepend: false });

// ─── Minimal MUI theme matching the app direction ─────────────────────────────

const testTheme = createTheme({ direction: 'rtl' });

// ─── Provider wrapper ─────────────────────────────────────────────────────────

function TestProviders({ children }: { children: ReactNode }) {
  return (
    <CacheProvider value={testCache}>
      <ThemeProvider theme={testTheme}>{children}</ThemeProvider>
    </CacheProvider>
  );
}

// ─── Custom render ────────────────────────────────────────────────────────────

function render(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>): RenderResult {
  return rtlRender(ui, { wrapper: TestProviders, ...options });
}

// Re-export everything from Testing Library, with our render override
export * from '@testing-library/react';
export { render };
