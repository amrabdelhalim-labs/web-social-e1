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
 *   Auth guard      — page returns null when user is already logged in
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

describe('صفحة تسجيل الدخول', () => {
  describe('العرض', () => {
    beforeEach(() => setupAuth());

    it('تعرض اسم التطبيق كعنوان', () => {
      render(<LoginPage />);
      expect(screen.getByRole('heading', { name: 'صوري' })).toBeInTheDocument();
    });

    it('تعرض حقل البريد الإلكتروني', () => {
      render(<LoginPage />);
      expect(screen.getByLabelText(/البريد الإلكتروني/i)).toBeInTheDocument();
    });

    it('تعرض حقل كلمة المرور', () => {
      render(<LoginPage />);
      expect(screen.getByLabelText(/^كلمة المرور$/i)).toBeInTheDocument();
    });

    it('تعرض زر تسجيل الدخول', () => {
      render(<LoginPage />);
      expect(screen.getByRole('button', { name: /تسجيل الدخول/i })).toBeInTheDocument();
    });

    it('تعرض رابطاً لصفحة إنشاء الحساب', () => {
      render(<LoginPage />);
      expect(screen.getByRole('link', { name: /إنشاء حساب جديد/i })).toBeInTheDocument();
    });
  });

  describe('التحقق من المدخلات', () => {
    beforeEach(() => setupAuth());

    it('تعرض خطأ عند إرسال بريد إلكتروني غير صحيح', async () => {
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

    it('تعرض خطأ عند كلمة مرور أقل من 6 أحرف', async () => {
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

    it('لا تعرض خطأ عند إدخال بيانات صحيحة', async () => {
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

  describe('إرسال النموذج', () => {
    beforeEach(() => setupAuth());

    it('تستدعي login() بالبريد والكلمة بعد تنظيف المسافات', async () => {
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

    it('تُعيد التوجيه إلى / بعد تسجيل الدخول الناجح', async () => {
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

  describe('معالجة أخطاء الخادم', () => {
    beforeEach(() => setupAuth());

    it('تعرض رسالة الخطأ المُعادة من الخادم', async () => {
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

    it('تعرض رسالة احتياطية عند أخطاء غير متوقعة', async () => {
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

    it('لا تُعيد التوجيه عند فشل تسجيل الدخول', async () => {
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

  describe('حماية الصفحة (Auth Guard)', () => {
    it('تُعيد null أثناء تحميل حالة المصادقة', () => {
      setupAuth({ loading: true });
      const { container } = render(<LoginPage />);
      expect(container.firstChild).toBeNull();
    });

    it('تُعيد null عندما يكون المستخدم مسجلاً بالفعل', () => {
      setupAuth({ user: { _id: 'u1', name: 'أحمد', email: 'a@b.com' } });
      const { container } = render(<LoginPage />);
      expect(container.firstChild).toBeNull();
    });

    it('تُعيد التوجيه إلى / عندما يكون المستخدم مسجلاً', () => {
      setupAuth({ user: { _id: 'u1', name: 'أحمد', email: 'a@b.com' } });
      render(<LoginPage />);
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });
});
