/**
 * PhotoEditDialog Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from './utils';
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
};

describe('PhotoEditDialog', () => {
  const onSave = vi.fn().mockResolvedValue(undefined);
  const onCancel = vi.fn();

  it('يعرض العنوان والوصف عند فتحه', () => {
    render(
      <PhotoEditDialog open={true} photo={mockPhoto} onSave={onSave} onCancel={onCancel} />
    );
    expect(screen.getByDisplayValue('عنوان')).toBeInTheDocument();
    expect(screen.getByDisplayValue('وصف')).toBeInTheDocument();
  });

  it('يستدعي onCancel عند الإلغاء', () => {
    render(
      <PhotoEditDialog open={true} photo={mockPhoto} onSave={onSave} onCancel={onCancel} />
    );
    fireEvent.click(screen.getByRole('button', { name: /إلغاء/ }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('يستدعي onSave عند الحفظ بنجاح', async () => {
    render(
      <PhotoEditDialog open={true} photo={mockPhoto} onSave={onSave} onCancel={onCancel} />
    );
    fireEvent.change(screen.getByLabelText(/العنوان/), { target: { value: 'عنوان جديد' } });
    fireEvent.click(screen.getByRole('button', { name: /حفظ/ }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        title: 'عنوان جديد',
        description: 'وصف',
      });
    });
  });
});
