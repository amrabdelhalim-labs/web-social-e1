/**
 * DeleteConfirmDialog Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from './utils';
import { DeleteConfirmDialog } from '@/app/components/photos/DeleteConfirmDialog';

describe('DeleteConfirmDialog', () => {
  it('يعرض العنوان والرسالة الافتراضية', () => {
    render(
      <DeleteConfirmDialog open={true} onConfirm={() => {}} onCancel={() => {}} />
    );
    expect(screen.getByText('تأكيد الحذف')).toBeInTheDocument();
    expect(screen.getByText('هل أنت متأكد من حذف هذا العنصر؟')).toBeInTheDocument();
  });

  it('يعرض العنوان والرسالة المخصصة', () => {
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

  it('يستدعي onConfirm عند النقر على حذف', () => {
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

  it('يستدعي onCancel عند النقر على إلغاء', () => {
    const onCancel = vi.fn();
    render(
      <DeleteConfirmDialog open={true} onConfirm={() => {}} onCancel={onCancel} />
    );
    fireEvent.click(screen.getByRole('button', { name: /إلغاء/ }));
    expect(onCancel).toHaveBeenCalled();
  });
});
