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
};

describe('PhotoCard', () => {
  it('يعرض العنوان والوصف', () => {
    render(<PhotoCard photo={mockPhoto} />);
    expect(screen.getByText('صورة جميلة')).toBeInTheDocument();
    expect(screen.getByText('وصف')).toBeInTheDocument();
  });

  it('يفتح الليت بوكس عند النقر على الصورة', () => {
    render(<PhotoCard photo={mockPhoto} />);
    fireEvent.click(screen.getByAltText('صورة جميلة'));
    expect(screen.getByRole('button', { name: /إغلاق/ })).toBeInTheDocument();
  });
});
