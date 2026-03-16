/**
 * AvatarUploader Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from './utils';
import { AvatarUploader } from '@/app/components/profile/AvatarUploader';

vi.mock('@/app/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { _id: 'u1', name: 'أحمد محمد', email: 'a@b.com', avatarUrl: null },
    updateUser: vi.fn(),
  })),
}));

describe('AvatarUploader', () => {
  it('displays name initials when no avatar', () => {
    render(<AvatarUploader />);
    expect(screen.getByText('أم')).toBeInTheDocument();
  });

  it('displays change profile picture button', () => {
    render(<AvatarUploader />);
    expect(screen.getByRole('button', { name: /تغيير صورة الملف الشخصي/ })).toBeInTheDocument();
  });

  it('opens menu when clicking avatar', () => {
    render(<AvatarUploader />);
    fireEvent.click(screen.getByRole('button', { name: /تغيير صورة الملف الشخصي/ }));
    expect(screen.getByText('رفع من الجهاز')).toBeInTheDocument();
    expect(screen.getByText('التقاط بالكاميرا')).toBeInTheDocument();
  });
});
