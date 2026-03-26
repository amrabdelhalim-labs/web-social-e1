/**
 * Register Page Tests
 *
 * Strategy mirrors login.test.tsx:
 *  - Mock next/navigation, @/app/hooks/useAuth, and @/app/config
 *  - Render via the custom MUI-aware `render` wrapper from utils.tsx
 *
 * Test groups:
 *   Rendering       — all four fields and the submit button are present
 *   Validation      — each client-side rule fires before register() is called
 *   Submission      — valid input calls register() and redirects to /
 *   Error handling  — server errors are surfaced in an Alert
 *   Auth guard      — GuestRoute renders loader and redirects authenticated users
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from './utils';
import RegisterPage from '@/app/register/page';

// ─── Module mocks ─────────────────────────────────────────────────────────────

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  usePathname: () => '/register',
  useSearchParams: () => new URLSearchParams(),
}));

const mockRegister = vi.fn();

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
  mockRegister.mockReset();
  (useAuth as Mock).mockReturnValue({
    user: null,
    token: null,
    loading: false,
    login: vi.fn(),
    register: mockRegister,
    logout: vi.fn(),
    updateUser: vi.fn(),
    ...overrides,
  });
}

/** Fills all four fields with valid data and returns the form element. */
function fillValidForm(container: HTMLElement) {
  fireEvent.change(screen.getByLabelText(/^الاسم$/i), {
    target: { value: 'أحمد محمد' },
  });
  fireEvent.change(screen.getByLabelText(/البريد الإلكتروني/i), {
    target: { value: 'ahmed@example.com' },
  });
  fireEvent.change(screen.getByLabelText(/^كلمة المرور$/i), {
    target: { value: 'secret123' },
  });
  fireEvent.change(screen.getByLabelText(/تأكيد كلمة المرور/i), {
    target: { value: 'secret123' },
  });
  return container.querySelector('form')!;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Register Page', () => {
  describe('Rendering', () => {
    beforeEach(() => setupAuth());

    it('displays app name as heading', () => {
      render(<RegisterPage />);
      expect(screen.getByRole('heading', { name: 'صوري' })).toBeInTheDocument();
    });

    it('displays name field', () => {
      render(<RegisterPage />);
      expect(screen.getByLabelText(/^الاسم$/i)).toBeInTheDocument();
    });

    it('displays email field', () => {
      render(<RegisterPage />);
      expect(screen.getByLabelText(/البريد الإلكتروني/i)).toBeInTheDocument();
    });

    it('displays password and confirm password fields', () => {
      render(<RegisterPage />);
      expect(screen.getByLabelText(/^كلمة المرور$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/تأكيد كلمة المرور/i)).toBeInTheDocument();
    });

    it('displays create account button', () => {
      render(<RegisterPage />);
      expect(screen.getByRole('button', { name: /إنشاء الحساب/i })).toBeInTheDocument();
    });

    it('displays link to login page', () => {
      render(<RegisterPage />);
      // AppBar also shows a login link for guests, so we check by href
      const loginLinks = screen.getAllByRole('link', { name: /تسجيل الدخول/i });
      expect(loginLinks.some((el) => el.getAttribute('href') === '/login')).toBe(true);
    });
  });

  describe('Validation', () => {
    beforeEach(() => setupAuth());

    it('shows error for name shorter than 3 chars', async () => {
      const { container } = render(<RegisterPage />);
      fireEvent.change(screen.getByLabelText(/^الاسم$/i), { target: { value: 'أب' } });
      fireEvent.submit(container.querySelector('form')!);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('الاسم يجب أن يكون 3 أحرف على الأقل');
      });
      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('shows error for invalid email format', async () => {
      const { container } = render(<RegisterPage />);
      fireEvent.change(screen.getByLabelText(/^الاسم$/i), { target: { value: 'أحمد محمد' } });
      fireEvent.change(screen.getByLabelText(/البريد الإلكتروني/i), {
        target: { value: 'not-valid' },
      });
      fireEvent.submit(container.querySelector('form')!);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('صيغة البريد الإلكتروني غير صحيحة');
      });
      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('shows error for password shorter than 6 chars', async () => {
      const { container } = render(<RegisterPage />);
      fireEvent.change(screen.getByLabelText(/^الاسم$/i), { target: { value: 'أحمد محمد' } });
      fireEvent.change(screen.getByLabelText(/البريد الإلكتروني/i), {
        target: { value: 'ahmed@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/^كلمة المرور$/i), { target: { value: '123' } });
      fireEvent.submit(container.querySelector('form')!);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(
          'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
        );
      });
      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('shows error when passwords do not match', async () => {
      const { container } = render(<RegisterPage />);
      fireEvent.change(screen.getByLabelText(/^الاسم$/i), { target: { value: 'أحمد محمد' } });
      fireEvent.change(screen.getByLabelText(/البريد الإلكتروني/i), {
        target: { value: 'ahmed@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/^كلمة المرور$/i), {
        target: { value: 'secret123' },
      });
      fireEvent.change(screen.getByLabelText(/تأكيد كلمة المرور/i), {
        target: { value: 'different' },
      });
      fireEvent.submit(container.querySelector('form')!);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('تأكيد كلمة المرور غير متطابق');
      });
      expect(mockRegister).not.toHaveBeenCalled();
    });
  });

  describe('Form submission', () => {
    beforeEach(() => setupAuth());

    it('calls register() with trimmed valid data', async () => {
      mockRegister.mockResolvedValue(undefined);
      const { container } = render(<RegisterPage />);
      const form = fillValidForm(container);
      // Override name with surrounding spaces to test trimming
      fireEvent.change(screen.getByLabelText(/^الاسم$/i), {
        target: { value: '  أحمد محمد  ' },
      });
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          name: 'أحمد محمد',
          email: 'ahmed@example.com',
          password: 'secret123',
          confirmPassword: 'secret123',
        });
      });
    });

    it('redirects to / after successful registration', async () => {
      mockRegister.mockResolvedValue(undefined);
      const { container } = render(<RegisterPage />);
      fireEvent.submit(fillValidForm(container));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });
  });

  describe('Server error handling', () => {
    beforeEach(() => setupAuth());

    it('displays server error message', async () => {
      mockRegister.mockRejectedValue(new Error('البريد الإلكتروني مستخدم بالفعل'));
      const { container } = render(<RegisterPage />);
      fireEvent.submit(fillValidForm(container));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('البريد الإلكتروني مستخدم بالفعل');
      });
    });

    it('displays fallback message for unexpected errors', async () => {
      mockRegister.mockRejectedValue('network error');
      const { container } = render(<RegisterPage />);
      fireEvent.submit(fillValidForm(container));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('فشل إنشاء الحساب');
      });
    });

    it('does not redirect on registration failure', async () => {
      mockRegister.mockRejectedValue(new Error('خطأ'));
      const { container } = render(<RegisterPage />);
      fireEvent.submit(fillValidForm(container));

      await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Auth guard', () => {
    it('shows loading indicator while auth is loading', () => {
      setupAuth({ loading: true });
      render(<RegisterPage />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('shows loading indicator when user is already logged in', () => {
      setupAuth({ user: { _id: 'u1', name: 'أحمد', email: 'a@b.com' } });
      render(<RegisterPage />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('redirects to / when user is already logged in', () => {
      setupAuth({ user: { _id: 'u1', name: 'أحمد', email: 'a@b.com' } });
      render(<RegisterPage />);
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });
});
