/**
 * Theme Context Tests
 *
 * Tests for ThemeProviderWrapper including:
 *  - Default mode is 'light' (matches server render)
 *  - toggleMode switches between light and dark
 *  - toggleMode persists the choice to localStorage
 *  - toggleMode updates data-color-scheme on <html>
 *  - useThemeMode hook returns context values correctly
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { ThemeProviderWrapper } from '@/app/context/ThemeContext';
import { useThemeMode } from '@/app/hooks/useThemeMode';

// ─── Setup ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-color-scheme');
});

function wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProviderWrapper>{children}</ThemeProviderWrapper>;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ThemeContext', () => {
  it('يبدأ بالوضع الفاتح افتراضياً (توافق SSR)', () => {
    const { result } = renderHook(() => useThemeMode(), { wrapper });
    // Initial render is always 'light' to match server — the useEffect hasn't run yet
    expect(result.current.mode).toBe('light');
  });

  it('يبدّل الوضع من فاتح إلى داكن', () => {
    const { result } = renderHook(() => useThemeMode(), { wrapper });

    act(() => {
      result.current.toggleMode();
    });

    expect(result.current.mode).toBe('dark');
  });

  it('يبدّل الوضع من داكن إلى فاتح', () => {
    const { result } = renderHook(() => useThemeMode(), { wrapper });

    act(() => {
      result.current.toggleMode(); // → dark
      result.current.toggleMode(); // → light
    });

    expect(result.current.mode).toBe('light');
  });

  it('يحفظ الوضع في localStorage بعد التبديل', () => {
    const { result } = renderHook(() => useThemeMode(), { wrapper });

    act(() => {
      result.current.toggleMode();
    });

    expect(localStorage.getItem('theme-mode')).toBe('dark');

    act(() => {
      result.current.toggleMode();
    });

    expect(localStorage.getItem('theme-mode')).toBe('light');
  });

  it('يحدّث data-color-scheme على عنصر html بعد التبديل', () => {
    const { result } = renderHook(() => useThemeMode(), { wrapper });

    act(() => {
      result.current.toggleMode();
    });

    expect(document.documentElement.getAttribute('data-color-scheme')).toBe('dark');
  });

  it('يعيد toggleMode كدالة ثابتة (useCallback)', () => {
    const { result, rerender } = renderHook(() => useThemeMode(), { wrapper });
    const first = result.current.toggleMode;
    rerender();
    expect(result.current.toggleMode).toBe(first);
  });
});
