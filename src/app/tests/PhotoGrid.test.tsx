/**
 * PhotoGrid Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from './utils';
import { PhotoGrid } from '@/app/components/photos/PhotoGrid';

vi.mock('@/app/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ user: { _id: 'u1' } })),
}));

const mockPhotos = [
  {
    _id: 'p1',
    title: 'صورة 1',
    imageUrl: '/1.jpg',
    user: { _id: 'u1', name: 'علي' },
    likesCount: 0,
    isLiked: false,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'p2',
    title: 'صورة 2',
    imageUrl: '/2.jpg',
    user: { _id: 'u1', name: 'علي' },
    likesCount: 0,
    isLiked: false,
    createdAt: new Date().toISOString(),
  },
];

describe('PhotoGrid', () => {
  it('يعرض جميع البطاقات', () => {
    render(<PhotoGrid photos={mockPhotos} />);
    expect(screen.getByText('صورة 1')).toBeInTheDocument();
    expect(screen.getByText('صورة 2')).toBeInTheDocument();
  });

  it('يعرض شبكة فارغة عند عدم وجود صور', () => {
    render(<PhotoGrid photos={[]} />);
    expect(screen.queryByText('صورة 1')).not.toBeInTheDocument();
  });
});
