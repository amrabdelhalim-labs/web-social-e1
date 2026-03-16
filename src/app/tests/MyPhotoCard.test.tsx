/**
 * MyPhotoCard Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from './utils';
import { MyPhotoCard } from '@/app/components/photos/MyPhotoCard';

const mockPhoto = {
  _id: 'p1',
  title: 'صورتي',
  description: 'وصف',
  imageUrl: '/img.jpg',
  user: { _id: 'u1', name: 'علي' },
  likesCount: 0,
  isLiked: false,
  createdAt: new Date().toISOString(),
};

describe('MyPhotoCard', () => {
  const onEdit = vi.fn().mockResolvedValue(undefined);
  const onDelete = vi.fn().mockResolvedValue(undefined);

  it('يعرض العنوان والصورة', () => {
    render(<MyPhotoCard photo={mockPhoto} onEdit={onEdit} onDelete={onDelete} />);
    expect(screen.getByText('صورتي')).toBeInTheDocument();
    expect(screen.getByAltText('صورتي')).toBeInTheDocument();
  });

  it('يفتح قائمة التعديل/الحذف عند النقر على المزيد', () => {
    render(<MyPhotoCard photo={mockPhoto} onEdit={onEdit} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole('button', { name: /المزيد/ }));
    expect(screen.getByText('تعديل')).toBeInTheDocument();
    expect(screen.getByText('حذف')).toBeInTheDocument();
  });

  it('يفتح نافذة التعديل عند النقر على تعديل', () => {
    render(<MyPhotoCard photo={mockPhoto} onEdit={onEdit} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole('button', { name: /المزيد/ }));
    fireEvent.click(screen.getByText('تعديل'));
    expect(screen.getByText('تعديل الصورة')).toBeInTheDocument();
  });

  it('يفتح نافذة تأكيد الحذف عند النقر على حذف', () => {
    render(<MyPhotoCard photo={mockPhoto} onEdit={onEdit} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole('button', { name: /المزيد/ }));
    fireEvent.click(screen.getByText('حذف'));
    expect(screen.getByText('حذف الصورة')).toBeInTheDocument();
  });
});
