/**
 * CameraCapture Component Tests
 *
 * Tests:
 *  - Fallback UI when useFallback
 *  - Unsupported message when !isSupported
 *  - Permission error when hasPermission=denied
 *  - Start camera button and startCamera call
 *  - Preview mode after capture
 *  - onCapture and onCancel called correctly
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from './utils';
import { CameraCapture } from '@/app/components/camera/CameraCapture';

vi.mock('@/app/hooks/useCamera', () => ({
  useCamera: vi.fn(),
}));

import { useCamera } from '@/app/hooks/useCamera';

const mockStartCamera = vi.fn();
const mockStopCamera = vi.fn();
const mockCapturePhoto = vi.fn();

function setupUseCamera(overrides: Record<string, unknown> = {}) {
  (useCamera as ReturnType<typeof vi.fn>).mockReturnValue({
    isSupported: true,
    isActive: false,
    stream: null,
    hasPermission: 'prompt' as const,
    error: null,
    startCamera: mockStartCamera,
    stopCamera: mockStopCamera,
    capturePhoto: mockCapturePhoto,
    useFallback: false,
    ...overrides,
  });
}

describe('CameraCapture', () => {
  const onCapture = vi.fn();
  const onCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    setupUseCamera();
  });

  it('displays fallback UI when useFallback is true', () => {
    setupUseCamera({ useFallback: true });
    render(<CameraCapture onCapture={onCapture} onCancel={onCancel} />);
    expect(screen.getByText(/التقط صورة باستخدام الكاميرا/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /فتح الكاميرا/ })).toBeInTheDocument();
  });

  it('displays unsupported message when not supported', () => {
    setupUseCamera({ isSupported: false });
    render(<CameraCapture onCapture={onCapture} onCancel={onCancel} />);
    expect(screen.getByText(/لا يدعم الوصول المباشر/)).toBeInTheDocument();
  });

  it('displays permission error when hasPermission is denied', () => {
    setupUseCamera({ hasPermission: 'denied', error: 'تم رفض إذن الوصول' });
    render(<CameraCapture onCapture={onCapture} onCancel={onCancel} />);
    expect(screen.getByText(/تم رفض إذن الوصول/)).toBeInTheDocument();
  });

  it('does not show cancel button in initial state', () => {
    render(<CameraCapture onCapture={onCapture} onCancel={onCancel} />);
    expect(screen.getByRole('button', { name: /تشغيل الكاميرا/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /إلغاء/ })).not.toBeInTheDocument();
  });

  it('displays start camera button and calls startCamera on click', async () => {
    mockStartCamera.mockResolvedValue(undefined);
    render(<CameraCapture onCapture={onCapture} onCancel={onCancel} />);

    const startBtn = screen.getByRole('button', { name: /تشغيل الكاميرا/ });
    fireEvent.click(startBtn);

    await waitFor(() => {
      expect(mockStartCamera).toHaveBeenCalled();
    });
  });

  it('calls onCancel when clicking close in active camera mode', () => {
    setupUseCamera({ isActive: true, stream: {} as MediaStream });
    render(<CameraCapture onCapture={onCapture} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /إغلاق/ }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('displays preview mode and calls onCapture when using photo', async () => {
    const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' });
    setupUseCamera({
      isActive: true,
      stream: {} as MediaStream,
    });
    mockCapturePhoto.mockResolvedValue(file);

    render(<CameraCapture onCapture={onCapture} onCancel={onCancel} />);

    const captureBtn = screen.getByRole('button', { name: /التقاط صورة/ });
    fireEvent.click(captureBtn);

    await waitFor(() => {
      expect(mockCapturePhoto).toHaveBeenCalled();
    });

    const useBtn = await screen.findByRole('button', { name: /استخدام/ });
    fireEvent.click(useBtn);

    await waitFor(() => {
      expect(onCapture).toHaveBeenCalledWith(file);
    });
  });
});
