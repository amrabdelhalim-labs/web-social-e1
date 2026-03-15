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
 *   Auth guard      — page returns null when the user is already authenticated
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

describe('صفحة إنشاء الحساب', () => {
  describe('العرض', () => {
    beforeEach(() => setupAuth());

    it('تعرض اسم التطبيق كعنوان', () => {
      render(<RegisterPage />);
      expect(screen.getByRole('heading', { name: 'صوري' })).toBeInTheDocument();
    });

    it('تعرض حقل الاسم', () => {
      render(<RegisterPage />);
      expect(screen.getByLabelText(/^الاسم$/i)).toBeInTheDocument();
    });

    it('تعرض حقل البريد الإلكتروني', () => {
      render(<RegisterPage />);
      expect(screen.getByLabelText(/البريد الإلكتروني/i)).toBeInTheDocument();
    });

    it('تعرض حقلَي كلمة المرور وتأكيدها', () => {
      render(<RegisterPage />);
      expect(screen.getByLabelText(/^كلمة المرور$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/تأكيد كلمة المرور/i)).toBeInTheDocument();
    });

    it('تعرض زر إنشاء الحساب', () => {
      render(<RegisterPage />);
      expect(screen.getByRole('button', { name: /إنشاء الحساب/i })).toBeInTheDocument();
    });

    it('تعرض رابطاً لصفحة تسجيل الدخول', () => {
      render(<RegisterPage />);
      // AppBar also shows a "تسجيل الدخول" link for guests, so we check by href
      const loginLinks = screen.getAllByRole('link', { name: /تسجيل الدخول/i });
      expect(loginLinks.some((el) => el.getAttribute('href') === '/login')).toBe(true);
    });
  });

  describe('التحقق من المدخلات', () => {
    beforeEach(() => setupAuth());

    it('تعرض خطأ عند اسم أقل من 3 أحرف', async () => {
      const { container } = render(<RegisterPage />);
      fireEvent.change(screen.getByLabelText(/^الاسم$/i), { target: { value: 'أب' } });
      fireEvent.submit(container.querySelector('form')!);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('الاسم يجب أن يكون 3 أحرف على الأقل');
      });
      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('تعرض خطأ عند صيغة بريد إلكتروني غير صحيحة', async () => {
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

    it('تعرض خطأ عند كلمة مرور أقل من 6 أحرف', async () => {
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

    it('تعرض خطأ عند عدم تطابق كلمتَي المرور', async () => {
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

  describe('إرسال النموذج', () => {
    beforeEach(() => setupAuth());

    it('تستدعي register() بالبيانات الصحيحة بعد تنظيف المسافات', async () => {
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

    it('تُعيد التوجيه إلى / بعد إنشاء الحساب بنجاح', async () => {
      mockRegister.mockResolvedValue(undefined);
      const { container } = render(<RegisterPage />);
      fireEvent.submit(fillValidForm(container));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });
  });

  describe('معالجة أخطاء الخادم', () => {
    beforeEach(() => setupAuth());

    it('تعرض رسالة الخطأ المُعادة من الخادم', async () => {
      mockRegister.mockRejectedValue(new Error('البريد الإلكتروني مستخدم بالفعل'));
      const { container } = render(<RegisterPage />);
      fireEvent.submit(fillValidForm(container));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('البريد الإلكتروني مستخدم بالفعل');
      });
    });

    it('تعرض رسالة احتياطية عند أخطاء غير متوقعة', async () => {
      mockRegister.mockRejectedValue('network error');
      const { container } = render(<RegisterPage />);
      fireEvent.submit(fillValidForm(container));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('فشل إنشاء الحساب');
      });
    });

    it('لا تُعيد التوجيه عند فشل إنشاء الحساب', async () => {
      mockRegister.mockRejectedValue(new Error('خطأ'));
      const { container } = render(<RegisterPage />);
      fireEvent.submit(fillValidForm(container));

      await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('حماية الصفحة (Auth Guard)', () => {
    it('تُعيد null أثناء تحميل حالة المصادقة', () => {
      setupAuth({ loading: true });
      const { container } = render(<RegisterPage />);
      expect(container.firstChild).toBeNull();
    });

    it('تُعيد null عندما يكون المستخدم مسجلاً بالفعل', () => {
      setupAuth({ user: { _id: 'u1', name: 'أحمد', email: 'a@b.com' } });
      const { container } = render(<RegisterPage />);
      expect(container.firstChild).toBeNull();
    });

    it('تُعيد التوجيه إلى / عندما يكون المستخدم مسجلاً', () => {
      setupAuth({ user: { _id: 'u1', name: 'أحمد', email: 'a@b.com' } });
      render(<RegisterPage />);
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });
});
