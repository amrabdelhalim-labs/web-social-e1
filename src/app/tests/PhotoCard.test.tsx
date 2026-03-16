/**
 * PhotoCard Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from './utils';
import { PhotoCard } from '@/app/components/photos/PhotoCard';

vi.mock('@/app/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ user: { _id: 'u1' } })),
}));

const mockPhoto = {
  _id: 'p1',
  title: 'صورة جميلة',
  description: 'وصف',
  imageUrl: '/test.jpg',
  user: { _id: 'u1', name: 'علي' },
  likesCount: 3,
  isLiked: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('PhotoCard', () => {
  it('يعرض العنوان والوصف', () => {
    render(<PhotoCard photo={mockPhoto} />);
    expect(screen.getByText('صورة جميلة')).toBeInTheDocument();
    expect(screen.getByText('وصف')).toBeInTheDocument();
  });

  it('يعرض زر الإعجاب وعدد الإعجابات بجانب العنوان', () => {
    render(<PhotoCard photo={mockPhoto} />);
    expect(screen.getByRole('button', { name: /إعجاب|إلغاء الإعجاب/ })).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('يفتح الليت بوكس عند النقر على الصورة', () => {
    render(<PhotoCard photo={mockPhoto} />);
    fireEvent.click(screen.getByAltText('صورة جميلة'));
    expect(screen.getByRole('button', { name: /إغلاق/ })).toBeInTheDocument();
  });

  it('يعرض الصورة بدون وصف عند غياب description', () => {
    const photoWithoutDesc = { ...mockPhoto, description: undefined };
    render(<PhotoCard photo={photoWithoutDesc} />);
    expect(screen.getByText('صورة جميلة')).toBeInTheDocument();
    expect(screen.queryByText('وصف')).not.toBeInTheDocument();
  });

  it('يفتح نافذة التفاصيل عند النقر على العنوان', () => {
    render(<PhotoCard photo={mockPhoto} />);
    fireEvent.click(screen.getByRole('button', { name: 'صورة جميلة' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /إغلاق/ })).toBeInTheDocument();
  });

  it('يفتح نافذة التفاصيل عند النقر على عرض المزيد', () => {
    render(<PhotoCard photo={mockPhoto} />);
    fireEvent.click(screen.getByText(/عرض المزيد/));
    expect(screen.getByRole('button', { name: /إغلاق/ })).toBeInTheDocument();
  });

  describe('variant="owner"', () => {
    const onEdit = vi.fn().mockResolvedValue(undefined);
    const onDelete = vi.fn().mockResolvedValue(undefined);

    it('يعرض زر الخيارات في نفس موضع الإعجاب (بدلاً منه)', () => {
      render(<PhotoCard photo={mockPhoto} variant="owner" onEdit={onEdit} onDelete={onDelete} />);
      expect(screen.getByRole('button', { name: /خيارات الصورة/ })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /إعجاب|إلغاء الإعجاب/ })).not.toBeInTheDocument();
    });

    it('يفتح قائمة التعديل/الحذف عند النقر على الخيارات', () => {
      render(<PhotoCard photo={mockPhoto} variant="owner" onEdit={onEdit} onDelete={onDelete} />);
      fireEvent.click(screen.getByRole('button', { name: /خيارات الصورة/ }));
      expect(screen.getByText('تعديل')).toBeInTheDocument();
      expect(screen.getByText('حذف')).toBeInTheDocument();
    });

    it('يفتح نافذة التعديل عند النقر على تعديل', () => {
      render(<PhotoCard photo={mockPhoto} variant="owner" onEdit={onEdit} onDelete={onDelete} />);
      fireEvent.click(screen.getByRole('button', { name: /خيارات الصورة/ }));
      fireEvent.click(screen.getByText('تعديل'));
      expect(screen.getByText('تعديل الصورة')).toBeInTheDocument();
    });

    it('يفتح نافذة تأكيد الحذف عند النقر على حذف', () => {
      render(<PhotoCard photo={mockPhoto} variant="owner" onEdit={onEdit} onDelete={onDelete} />);
      fireEvent.click(screen.getByRole('button', { name: /خيارات الصورة/ }));
      fireEvent.click(screen.getByText('حذف'));
      expect(screen.getByText('حذف الصورة')).toBeInTheDocument();
    });
  });
});
