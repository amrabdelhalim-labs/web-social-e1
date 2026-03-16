/**
 * PhotoDetailModal Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from './utils';
import { PhotoDetailModal } from '@/app/components/photos/PhotoDetailModal';

describe('PhotoDetailModal', () => {
  it('displays title and description when open', () => {
    render(
      <PhotoDetailModal
        open={true}
        title="عنوان الصورة"
        description="وصف كامل"
        onClose={() => {}}
      />
    );
    expect(screen.getByText('عنوان الصورة')).toBeInTheDocument();
    expect(screen.getByText('وصف كامل')).toBeInTheDocument();
  });

  it('displays close button', () => {
    render(<PhotoDetailModal open={true} title="عنوان" description="وصف" onClose={() => {}} />);
    expect(screen.getByRole('button', { name: /إغلاق/ })).toBeInTheDocument();
  });

  it('calls onClose when clicking close', () => {
    const onClose = vi.fn();
    render(<PhotoDetailModal open={true} title="عنوان" description="وصف" onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /إغلاق/ }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not display description when absent', () => {
    render(<PhotoDetailModal open={true} title="عنوان فقط" onClose={() => {}} />);
    expect(screen.getByText('عنوان فقط')).toBeInTheDocument();
    expect(screen.queryByText('وصف')).not.toBeInTheDocument();
  });

  it('displays publisher when provided', () => {
    render(
      <PhotoDetailModal
        open={true}
        title="عنوان"
        description="وصف"
        publisher={{ _id: 'u1', name: 'أحمد', avatarUrl: null }}
        onClose={() => {}}
      />
    );
    expect(screen.getByText(/نشرها أحمد/)).toBeInTheDocument();
  });
});
