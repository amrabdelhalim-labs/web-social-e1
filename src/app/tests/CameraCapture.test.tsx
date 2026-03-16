/**
 * CameraCapture Component Tests
 *
 * يختبر:
 *  - عرض واجهة fallback عند useFallback
 *  - عرض رسالة عدم دعم عند !isSupported
 *  - عرض خطأ إذن عند hasPermission=denied
 *  - زر تشغيل الكاميرا واستدعاء startCamera
 *  - وضع المعاينة بعد التقاط صورة
 *  - onCapture و onCancel يُستدعيان بشكل صحيح
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

  it('يعرض واجهة fallback عند useFallback=true', () => {
    setupUseCamera({ useFallback: true });
    render(<CameraCapture onCapture={onCapture} onCancel={onCancel} />);
    expect(screen.getByText(/التقط صورة باستخدام الكاميرا/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /فتح الكاميرا/ })).toBeInTheDocument();
  });

  it('يعرض رسالة عدم دعم عند !isSupported', () => {
    setupUseCamera({ isSupported: false });
    render(<CameraCapture onCapture={onCapture} onCancel={onCancel} />);
    expect(screen.getByText(/لا يدعم الوصول المباشر/)).toBeInTheDocument();
  });

  it('يعرض خطأ إذن عند hasPermission=denied', () => {
    setupUseCamera({ hasPermission: 'denied', error: 'تم رفض إذن الوصول' });
    render(<CameraCapture onCapture={onCapture} onCancel={onCancel} />);
    expect(screen.getByText(/تم رفض إذن الوصول/)).toBeInTheDocument();
  });

  it('يعرض زر تشغيل الكاميرا ويستدعي startCamera عند النقر', async () => {
    mockStartCamera.mockResolvedValue(undefined);
    render(<CameraCapture onCapture={onCapture} onCancel={onCancel} />);

    const startBtn = screen.getByRole('button', { name: /تشغيل الكاميرا/ });
    fireEvent.click(startBtn);

    await waitFor(() => {
      expect(mockStartCamera).toHaveBeenCalled();
    });
  });

  it('يستدعي onCancel عند النقر على إلغاء', () => {
    render(<CameraCapture onCapture={onCapture} onCancel={onCancel} />);
    const cancelBtns = screen.getAllByRole('button', { name: /إلغاء/ });
    fireEvent.click(cancelBtns[0]);
    expect(onCancel).toHaveBeenCalled();
  });

  it('يعرض وضع المعاينة ويستدعي onCapture عند استخدام الصورة', async () => {
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
