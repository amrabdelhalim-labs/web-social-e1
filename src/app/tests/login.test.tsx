/**
 * Login Page Tests
 *
 * Strategy:
 *  - Isolate the page by mocking three external seams:
 *      1. next/navigation → useRouter (prevent actual navigation)
 *      2. @/app/hooks/useAuth → useAuth (inject auth state + login spy)
 *      3. @/app/config → APP_NAME (stable label for queries)
 *  - Render via the custom `render` wrapper from utils.tsx (MUI-aware)
 *
 * Test groups:
 *   Rendering       — all fields and the submit button are present
 *   Validation      — client-side errors fire before login() is called
 *   Submission      — valid input calls login() and redirects to /
 *   Error handling  — API errors are surfaced in an Alert
 *   Auth guard      — GuestRoute renders loader and redirects authenticated users
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from './utils';
import LoginPage from '@/app/login/page';

// ─── Module mocks ─────────────────────────────────────────────────────────────

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  usePathname: () => '/login',
  useSearchParams: () => new URLSearchParams(),
}));

const mockLogin = vi.fn();

vi.mock('@/app/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/app/config', () => ({
  APP_NAME: 'صوري',
  APP_NAME_EN: 'My Photos',
  APP_DESCRIPTION: '',
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

import { useAuth } from '@/app/hooks/useAuth';

function setupAuth(overrides: Record<string, unknown> = {}) {
  mockPush.mockReset();
  mockReplace.mockReset();
  mockLogin.mockReset();
  (useAuth as Mock).mockReturnValue({
    user: null,
    token: null,
    loading: false,
    login: mockLogin,
    register: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
    ...overrides,
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Login Page', () => {
  describe('Rendering', () => {
    beforeEach(() => setupAuth());

    it('displays app name as heading', () => {
      render(<LoginPage />);
      expect(screen.getByRole('heading', { name: 'صوري' })).toBeInTheDocument();
    });

    it('displays email field', () => {
      render(<LoginPage />);
      expect(screen.getByLabelText(/البريد الإلكتروني/i)).toBeInTheDocument();
    });

    it('displays password field', () => {
      render(<LoginPage />);
      expect(screen.getByLabelText(/^كلمة المرور$/i)).toBeInTheDocument();
    });

    it('displays login button', () => {
      render(<LoginPage />);
      expect(screen.getByRole('button', { name: /تسجيل الدخول/i })).toBeInTheDocument();
    });

    it('displays link to register page', () => {
      render(<LoginPage />);
      expect(screen.getByRole('link', { name: /إنشاء حساب جديد/i })).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    beforeEach(() => setupAuth());

    it('shows error for invalid email format', async () => {
      const { container } = render(<LoginPage />);
      fireEvent.change(screen.getByLabelText(/البريد الإلكتروني/i), {
        target: { value: 'not-an-email' },
      });
      fireEvent.submit(container.querySelector('form')!);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('صيغة البريد الإلكتروني غير صحيحة');
      });
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('shows error for password shorter than 6 chars', async () => {
      const { container } = render(<LoginPage />);
      fireEvent.change(screen.getByLabelText(/البريد الإلكتروني/i), {
        target: { value: 'user@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/^كلمة المرور$/i), {
        target: { value: '123' },
      });
      fireEvent.submit(container.querySelector('form')!);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(
          'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
        );
      });
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('does not show error for valid input', async () => {
      mockLogin.mockResolvedValue(undefined);
      const { container } = render(<LoginPage />);
      fireEvent.change(screen.getByLabelText(/البريد الإلكتروني/i), {
        target: { value: 'user@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/^كلمة المرور$/i), {
        target: { value: 'password123' },
      });
      fireEvent.submit(container.querySelector('form')!);

      await waitFor(() => expect(mockLogin).toHaveBeenCalledOnce());
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Form submission', () => {
    beforeEach(() => setupAuth());

    it('calls login() with trimmed email and password', async () => {
      mockLogin.mockResolvedValue(undefined);
      const { container } = render(<LoginPage />);
      fireEvent.change(screen.getByLabelText(/البريد الإلكتروني/i), {
        target: { value: '  user@example.com  ' },
      });
      fireEvent.change(screen.getByLabelText(/^كلمة المرور$/i), {
        target: { value: 'secret123' },
      });
      fireEvent.submit(container.querySelector('form')!);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('user@example.com', 'secret123');
      });
    });

    it('redirects to / after successful login', async () => {
      mockLogin.mockResolvedValue(undefined);
      const { container } = render(<LoginPage />);
      fireEvent.change(screen.getByLabelText(/البريد الإلكتروني/i), {
        target: { value: 'user@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/^كلمة المرور$/i), {
        target: { value: 'secret123' },
      });
      fireEvent.submit(container.querySelector('form')!);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });
  });

  describe('Server error handling', () => {
    beforeEach(() => setupAuth());

    it('displays server error message', async () => {
      mockLogin.mockRejectedValue(new Error('بيانات الاعتماد غير صحيحة'));
      const { container } = render(<LoginPage />);
      fireEvent.change(screen.getByLabelText(/البريد الإلكتروني/i), {
        target: { value: 'user@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/^كلمة المرور$/i), {
        target: { value: 'wrongpass' },
      });
      fireEvent.submit(container.querySelector('form')!);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('بيانات الاعتماد غير صحيحة');
      });
    });

    it('displays fallback message for unexpected errors', async () => {
      mockLogin.mockRejectedValue('unexpected');
      const { container } = render(<LoginPage />);
      fireEvent.change(screen.getByLabelText(/البريد الإلكتروني/i), {
        target: { value: 'user@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/^كلمة المرور$/i), {
        target: { value: 'secret123' },
      });
      fireEvent.submit(container.querySelector('form')!);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('فشل تسجيل الدخول');
      });
    });

    it('does not redirect on login failure', async () => {
      mockLogin.mockRejectedValue(new Error('خطأ'));
      const { container } = render(<LoginPage />);
      fireEvent.change(screen.getByLabelText(/البريد الإلكتروني/i), {
        target: { value: 'user@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/^كلمة المرور$/i), {
        target: { value: 'wrongpass' },
      });
      fireEvent.submit(container.querySelector('form')!);

      await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Auth guard', () => {
    it('shows loading indicator while auth is loading', () => {
      setupAuth({ loading: true });
      render(<LoginPage />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('shows loading indicator when user is already logged in', () => {
      setupAuth({ user: { _id: 'u1', name: 'أحمد', email: 'a@b.com' } });
      render(<LoginPage />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('redirects to / when user is already logged in', () => {
      setupAuth({ user: { _id: 'u1', name: 'أحمد', email: 'a@b.com' } });
      render(<LoginPage />);
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });
});
