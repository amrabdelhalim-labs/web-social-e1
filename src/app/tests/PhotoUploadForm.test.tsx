/**
 * PhotoUploadForm Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from './utils';
import { PhotoUploadForm } from '@/app/components/photos/PhotoUploadForm';

vi.mock('@/app/components/camera/CameraCapture', () => ({
  CameraCapture: ({
    onCapture,
    onCancel,
  }: {
    onCapture: (f: File) => void;
    onCancel: () => void;
  }) => (
    <div>
      <button onClick={() => onCapture(new File(['x'], 'cap.jpg', { type: 'image/jpeg' }))}>
        التقاط
      </button>
      <button onClick={onCancel}>إلغاء كاميرا</button>
    </div>
  ),
}));

describe('PhotoUploadForm', () => {
  const onUpload = vi.fn().mockResolvedValue(undefined);
  const onClose = vi.fn();

  it('displays title and basic elements', () => {
    render(<PhotoUploadForm open={true} onClose={onClose} onUpload={onUpload} />);
    expect(screen.getByText('رفع صورة جديدة')).toBeInTheDocument();
    expect(screen.getByText('رفع من الجهاز')).toBeInTheDocument();
    expect(screen.getByText('التقاط بالكاميرا')).toBeInTheDocument();
  });

  it('calls onClose when canceling', () => {
    render(<PhotoUploadForm open={true} onClose={onClose} onUpload={onUpload} />);
    fireEvent.click(screen.getByRole('button', { name: /إلغاء/ }));
    expect(onClose).toHaveBeenCalled();
  });
});
