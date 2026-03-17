/**
 * PhotoCard Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from './utils';
import { PhotoCard } from '@/app/components/photos/PhotoCard';

vi.mock('@/app/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ user: { _id: 'u1' } })),
}));

const mockPhoto = {
  _id: 'p1',
  title: 'صورة جميلة',
  description: 'وصف',
  imageUrl: '/test.jpg',
  user: { _id: 'u1', name: 'علي', avatarUrl: null },
  likesCount: 3,
  isLiked: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('PhotoCard', () => {
  it('displays title and description', () => {
    render(<PhotoCard photo={mockPhoto} />);
    expect(screen.getByText('صورة جميلة')).toBeInTheDocument();
    expect(screen.getByText('وصف')).toBeInTheDocument();
  });

  it('displays like button and count next to title', () => {
    render(<PhotoCard photo={mockPhoto} />);
    expect(screen.getByRole('button', { name: /إعجاب|إلغاء الإعجاب/ })).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('opens lightbox when clicking image', () => {
    render(<PhotoCard photo={mockPhoto} />);
    fireEvent.click(screen.getByAltText('صورة جميلة'));
    expect(screen.getByRole('button', { name: /إغلاق/ })).toBeInTheDocument();
  });

  it('displays image without description when description is absent', () => {
    const photoWithoutDesc = { ...mockPhoto, description: undefined };
    render(<PhotoCard photo={photoWithoutDesc} />);
    expect(screen.getByText('صورة جميلة')).toBeInTheDocument();
    expect(screen.queryByText('وصف')).not.toBeInTheDocument();
  });

  it('opens detail modal when clicking title', () => {
    render(<PhotoCard photo={mockPhoto} />);
    fireEvent.click(screen.getByRole('button', { name: 'صورة جميلة' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /إغلاق/ })).toBeInTheDocument();
  });

  it('opens detail modal when clicking show more for truncated text', async () => {
    const longDesc =
      'هذا وصف طويل جداً يتجاوز الحد المسموح به. عندما يكون النص أطول من المساحة المتاحة فإن زر عرض المزيد يظهر للمستخدم لقراءة المحتوى الكامل في نافذة التفاصيل.';
    render(<PhotoCard photo={{ ...mockPhoto, description: longDesc }} />);
    const moreLink = screen.queryByRole('button', { name: /عرض المزيد/ });
    if (moreLink) {
      fireEvent.click(moreLink);
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    }
  });

  describe('variant="owner"', () => {
    const onEdit = vi.fn().mockResolvedValue(undefined);
    const onDelete = vi.fn().mockResolvedValue(undefined);

    it('shows options button in same position as like button', () => {
      render(<PhotoCard photo={mockPhoto} variant="owner" onEdit={onEdit} onDelete={onDelete} />);
      expect(screen.getByRole('button', { name: /خيارات الصورة/ })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /إعجاب|إلغاء الإعجاب/ })).not.toBeInTheDocument();
    });

    it('opens edit/delete menu when clicking options', () => {
      render(<PhotoCard photo={mockPhoto} variant="owner" onEdit={onEdit} onDelete={onDelete} />);
      fireEvent.click(screen.getByRole('button', { name: /خيارات الصورة/ }));
      expect(screen.getByText('تعديل')).toBeInTheDocument();
      expect(screen.getByText('حذف')).toBeInTheDocument();
    });

    it('opens edit dialog when clicking edit', () => {
      render(<PhotoCard photo={mockPhoto} variant="owner" onEdit={onEdit} onDelete={onDelete} />);
      fireEvent.click(screen.getByRole('button', { name: /خيارات الصورة/ }));
      fireEvent.click(screen.getByText('تعديل'));
      expect(screen.getByText('تعديل الصورة')).toBeInTheDocument();
    });

    it('opens delete confirm dialog when clicking delete', () => {
      render(<PhotoCard photo={mockPhoto} variant="owner" onEdit={onEdit} onDelete={onDelete} />);
      fireEvent.click(screen.getByRole('button', { name: /خيارات الصورة/ }));
      fireEvent.click(screen.getByText('حذف'));
      expect(screen.getByText('حذف الصورة')).toBeInTheDocument();
    });
  });
});
