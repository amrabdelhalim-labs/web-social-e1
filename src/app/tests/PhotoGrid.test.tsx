/**
 * PhotoGrid Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
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
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'p2',
    title: 'صورة 2',
    imageUrl: '/2.jpg',
    user: { _id: 'u1', name: 'علي' },
    likesCount: 0,
    isLiked: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

describe('PhotoGrid', () => {
  it('renders all cards', () => {
    render(<PhotoGrid photos={mockPhotos} />);
    expect(screen.getByText('صورة 1')).toBeInTheDocument();
    expect(screen.getByText('صورة 2')).toBeInTheDocument();
  });

  it('renders empty grid when no photos', () => {
    render(<PhotoGrid photos={[]} />);
    expect(screen.queryByText('صورة 1')).not.toBeInTheDocument();
  });

  it('renders owner cards when variant is owner', () => {
    const onEdit = vi.fn().mockResolvedValue(undefined);
    const onDelete = vi.fn().mockResolvedValue(undefined);
    render(<PhotoGrid photos={mockPhotos} variant="owner" onEdit={onEdit} onDelete={onDelete} />);
    expect(screen.getAllByRole('button', { name: /خيارات الصورة/ })).toHaveLength(2);
  });
});
