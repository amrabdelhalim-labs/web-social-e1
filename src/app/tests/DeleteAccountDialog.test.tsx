/**
 * DeleteAccountDialog Component Tests
 *
 * Covers: UI display, validation, success flow (logout + redirect), error handling,
 * and preventing close while deleting.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from './utils';
import { DeleteAccountDialog } from '@/app/components/profile/DeleteAccountDialog';

const mockPush = vi.fn();
const mockLogout = vi.fn();
const mockOnClose = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/app/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ logout: mockLogout })),
}));

vi.mock('@/app/lib/api', () => ({
  deleteAccountApi: vi.fn(),
}));

const { deleteAccountApi } = await import('@/app/lib/api');

beforeEach(() => {
  vi.clearAllMocks();
  (deleteAccountApi as ReturnType<typeof vi.fn>).mockReset();
});

describe('DeleteAccountDialog', () => {
  it('displays title and warning text', () => {
    render(<DeleteAccountDialog open onClose={mockOnClose} />);
    expect(screen.getByText('حذف الحساب نهائيًا')).toBeInTheDocument();
    expect(screen.getByText(/لا يمكن التراجع عن هذا الإجراء/)).toBeInTheDocument();
  });

  it('displays password field', () => {
    render(<DeleteAccountDialog open onClose={mockOnClose} />);
    expect(screen.getByLabelText(/كلمة المرور للتأكيد/)).toBeInTheDocument();
  });

  it('displays cancel and delete buttons', () => {
    render(<DeleteAccountDialog open onClose={mockOnClose} />);
    expect(screen.getByRole('button', { name: 'إلغاء' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'حذف حسابي' })).toBeInTheDocument();
  });

  it('delete button is disabled when password is empty', () => {
    render(<DeleteAccountDialog open onClose={mockOnClose} />);
    expect(screen.getByRole('button', { name: 'حذف حسابي' })).toBeDisabled();
  });

  it('on success: calls logout, onClose, and router.push', async () => {
    (deleteAccountApi as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});

    render(<DeleteAccountDialog open onClose={mockOnClose} />);
    const passwordInput = screen.getByLabelText(/كلمة المرور للتأكيد/);
    fireEvent.change(passwordInput, { target: { value: 'mypass123' } });
    fireEvent.click(screen.getByRole('button', { name: 'حذف حسابي' }));

    await waitFor(() => {
      expect(deleteAccountApi).toHaveBeenCalledWith('mypass123');
    });
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('on failure: displays error and does not call logout', async () => {
    (deleteAccountApi as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('كلمة المرور غير صحيحة.')
    );

    render(<DeleteAccountDialog open onClose={mockOnClose} />);
    const passwordInput = screen.getByLabelText(/كلمة المرور للتأكيد/);
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: 'حذف حسابي' }));

    await waitFor(() => {
      expect(screen.getByText('كلمة المرور غير صحيحة.')).toBeInTheDocument();
    });
    expect(mockLogout).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('delete button stays disabled when only spaces entered', () => {
    render(<DeleteAccountDialog open onClose={mockOnClose} />);
    const passwordInput = screen.getByLabelText(/كلمة المرور للتأكيد/);
    fireEvent.change(passwordInput, { target: { value: '   ' } });
    expect(screen.getByRole('button', { name: 'حذف حسابي' })).toBeDisabled();
  });

  it('cancel button calls onClose', () => {
    render(<DeleteAccountDialog open onClose={mockOnClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'إلغاء' }));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('does not close dialog while deleting', async () => {
    let resolveDelete!: () => void;
    (deleteAccountApi as ReturnType<typeof vi.fn>).mockImplementation(
      () =>
        new Promise<void>((r) => {
          resolveDelete = r;
        })
    );

    render(<DeleteAccountDialog open onClose={mockOnClose} />);
    const passwordInput = screen.getByLabelText(/كلمة المرور للتأكيد/);
    fireEvent.change(passwordInput, { target: { value: 'mypass' } });
    fireEvent.click(screen.getByRole('button', { name: 'حذف حسابي' }));

    await waitFor(() => expect(deleteAccountApi).toHaveBeenCalled());
    expect(mockOnClose).not.toHaveBeenCalled();

    resolveDelete();
    await waitFor(() => expect(mockOnClose).toHaveBeenCalled());
  });
});
