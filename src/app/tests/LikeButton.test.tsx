/**
 * LikeButton Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from './utils';
import { LikeButton } from '@/app/components/photos/LikeButton';
import * as api from '@/app/lib/api';

vi.mock('@/app/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));
vi.mock('@/app/lib/api', () => ({
  toggleLikeApi: vi.fn(),
}));

import { useAuth } from '@/app/hooks/useAuth';

describe('LikeButton', () => {
  beforeEach(() => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { _id: 'u1', name: 'علي' },
    });
  });

  it('يعرض عدد الإعجابات', () => {
    render(<LikeButton photoId="p1" liked={false} likesCount={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('يعطّل الزر عند عدم وجود مستخدم', () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ user: null });
    render(<LikeButton photoId="p1" liked={false} likesCount={0} />);
    expect(screen.getByRole('button', { name: /إعجاب/ })).toBeDisabled();
  });

  it('يستدعي toggleLikeApi عند النقر', async () => {
    vi.mocked(api.toggleLikeApi).mockResolvedValue({
      data: { liked: true, likesCount: 1 },
    });

    render(<LikeButton photoId="p1" liked={false} likesCount={0} />);
    fireEvent.click(screen.getByRole('button', { name: /إعجاب/ }));

    await waitFor(() => {
      expect(api.toggleLikeApi).toHaveBeenCalledWith('p1');
    });
  });
});
