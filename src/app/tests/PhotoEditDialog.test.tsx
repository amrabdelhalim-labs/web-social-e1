/**
 * PhotoEditDialog Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from './utils';
import { PhotoEditDialog } from '@/app/components/photos/PhotoEditDialog';

const mockPhoto = {
  _id: 'p1',
  title: 'عنوان',
  description: 'وصف',
  imageUrl: '/img.jpg',
  user: { _id: 'u1', name: 'علي' },
  likesCount: 0,
  isLiked: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('PhotoEditDialog', () => {
  const onSave = vi.fn().mockResolvedValue(undefined);
  const onCancel = vi.fn();

  it('displays title and description when open', () => {
    render(<PhotoEditDialog open={true} photo={mockPhoto} onSave={onSave} onCancel={onCancel} />);
    expect(screen.getByLabelText(/العنوان/)).toHaveValue('عنوان');
    expect(screen.getByLabelText(/الوصف/)).toHaveValue('وصف');
  }, 8000);

  it('calls onCancel when cancel is clicked', () => {
    render(<PhotoEditDialog open={true} photo={mockPhoto} onSave={onSave} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /إلغاء/ }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('calls onSave when saving successfully', async () => {
    render(<PhotoEditDialog open={true} photo={mockPhoto} onSave={onSave} onCancel={onCancel} />);
    const titleInput = screen.getByLabelText(/العنوان/);
    await act(async () => {
      fireEvent.change(titleInput, { target: { value: 'عنوان جديد' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /حفظ/ }));
    });

    await waitFor(
      () => {
        expect(onSave).toHaveBeenCalledWith({
          title: 'عنوان جديد',
          description: 'وصف',
        });
      },
      { timeout: 5000 }
    );
  }, 10000);
});
