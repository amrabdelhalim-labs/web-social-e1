/**
 * DeleteConfirmDialog Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from './utils';
import { DeleteConfirmDialog } from '@/app/components/photos/DeleteConfirmDialog';

describe('DeleteConfirmDialog', () => {
  it('displays title and default message', () => {
    render(<DeleteConfirmDialog open={true} onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.getByText('تأكيد الحذف')).toBeInTheDocument();
    expect(screen.getByText('هل أنت متأكد من حذف هذا العنصر؟')).toBeInTheDocument();
  });

  it('displays custom title and message', () => {
    render(
      <DeleteConfirmDialog
        open={true}
        title="حذف الصورة"
        message="هل أنت متأكد؟"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    expect(screen.getByText('حذف الصورة')).toBeInTheDocument();
    expect(screen.getByText('هل أنت متأكد؟')).toBeInTheDocument();
  });

  it('calls onConfirm when clicking delete', () => {
    const onConfirm = vi.fn();
    render(
      <DeleteConfirmDialog
        open={true}
        confirmLabel="حذف"
        onConfirm={onConfirm}
        onCancel={() => {}}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /حذف/ }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('calls onCancel when clicking cancel', () => {
    const onCancel = vi.fn();
    render(<DeleteConfirmDialog open={true} onConfirm={() => {}} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /إلغاء/ }));
    expect(onCancel).toHaveBeenCalled();
  });
});
