'use client';

/**
 * AuthContext — JWT Authentication State
 *
 * Manages the global auth state for the client:
 *  - Stores the JWT in localStorage under TOKEN_KEY
 *  - Exposes login / register / logout / updateUser
 *  - Auto-hydrates from the stored token on mount via GET /api/auth/me
 *  - 401 from the server clears the session immediately
 *
 * This is a simple stateless-session implementation — no service workers,
 * no device trust, no offline cache. Token in localStorage; user in memory.
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
  /** JWT stored in memory — localStorage is the persisted copy */
  token: string | null;
  /** True while the initial /api/auth/me check is in progress */
  loading: boolean;
  /** Logs in with email + password. Throws on failure. */
  login: (email: string, password: string) => Promise<void>;
  /** Creates a new account and logs in. Throws on failure. */
  register: (input: RegisterInput) => Promise<void>;
  /** Clears the session (token + user). */
  logout: () => void;
  /** Syncs in-memory user state after profile changes without re-fetching. */
  updateUser: (updated: User) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TOKEN_KEY = 'auth-token';

// ─── Context ─────────────────────────────────────────────────────────────────

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  updateUser: () => {},
});

// ─── Internal fetch helper ────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  jwt?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (jwt) headers['Authorization'] = `Bearer ${jwt}`;

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
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  });
  const [loading, setLoading] = useState(true);
  /** Prevents double-init in React StrictMode / concurrent renders */
  const didInit = useRef(false);

  /**
   * Fetches /api/auth/me with the stored JWT.
   * On 401: clears the invalid token and user.
   * On other errors: silently sets loading=false, user stays null.
   */
  const loadUser = useCallback(async (jwt: string) => {
    try {
      const res = await apiFetch<{ data: User }>('/api/auth/me', {}, jwt);
      setUser(res.data);
    } catch (err) {
      const status = (err as Error & { status?: number }).status;
      if (status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      }
      // For network errors, user stays null — the login page will handle it
    }
  }, []);

  // Hydrate on mount from any stored token
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    const storedToken = token;
    if (storedToken) {
      loadUser(storedToken).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiFetch<{ data: { token: string; user: User } }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const { token: jwt, user: loggedInUser } = res.data;
    localStorage.setItem(TOKEN_KEY, jwt);
    setToken(jwt);
    setUser(loggedInUser);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const res = await apiFetch<{ data: { token: string; user: User } }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    const { token: jwt, user: newUser } = res.data;
    localStorage.setItem(TOKEN_KEY, jwt);
    setToken(jwt);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updated: User) => {
    setUser(updated);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, loading, login, register, logout, updateUser }),
    [user, token, loading, login, register, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
