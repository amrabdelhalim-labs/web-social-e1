'use client';

/**
 * AuthContext — Cookie-Based Authentication State
 *
 * Manages the global auth state for the client:
 *  - The JWT lives in an HttpOnly cookie set by the server (inaccessible to JS)
 *  - Exposes login / register / logout / updateUser
 *  - Auto-hydrates by calling GET /api/auth/me on mount
 *    (the cookie is sent automatically by the browser for same-origin requests)
 *  - 401 from the server sets user to null
 *  - logout calls POST /api/auth/logout to clear the server-side cookie
 *
 * Security: no token is stored or accessible in JavaScript — XSS cannot steal it.
 */

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { User, RegisterInput } from '@/app/types';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AuthContextValue {
  /** Authenticated user, or null if logged out */
  user: User | null;
  /** True while the initial /api/auth/me check is in progress */
  loading: boolean;
  /** Logs in with email + password. Throws on failure. */
  login: (email: string, password: string) => Promise<void>;
  /** Creates a new account and logs in. Throws on failure. */
  register: (input: RegisterInput) => Promise<void>;
  /** Clears the session by calling the logout API (clears the cookie server-side). */
  logout: () => void;
  /** Syncs in-memory user state after profile changes without re-fetching. */
  updateUser: (updated: User) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  updateUser: () => {},
});

// ─── Internal fetch helper ────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  // Cookies are sent automatically for same-origin requests — no manual injection needed
  const res = await fetch(path, { ...options, headers });
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(json?.error?.message ?? 'خطأ غير متوقع من الخادم.');
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }
  return json as T;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  /** Prevents double-init in React StrictMode / concurrent renders */
  const didInit = useRef(false);

  /**
   * Calls /api/auth/me — the cookie is sent automatically by the browser.
   * On 401: user is set to null (session expired or never existed).
   * On other errors: silently sets loading=false, user stays null.
   */
  const loadUser = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: User }>('/api/auth/me');
      setUser(res.data);
    } catch (err) {
      const status = (err as Error & { status?: number }).status;
      if (status === 401) {
        setUser(null);
      }
      // Network errors: user stays null — the login page will handle it
    }
  }, []);

  // Hydrate on mount — always check the server since we can't read the HttpOnly cookie
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    loadUser().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiFetch<{ data: { user: User } }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    // Cookie is set by the server response automatically
    setUser(res.data.user);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const res = await apiFetch<{ data: { user: User } }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    // Cookie is set by the server response automatically
    setUser(res.data.user);
  }, []);

  const logout = useCallback(() => {
    // Fire-and-forget: clears the HttpOnly cookie server-side
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
  }, []);

  const updateUser = useCallback((updated: User) => {
    setUser(updated);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, login, register, logout, updateUser }),
    [user, loading, login, register, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
