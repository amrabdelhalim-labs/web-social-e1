/**
 * useCamera Hook Tests
 *
 * يختبر:
 *  - isSupported حسب توفر getUserMedia
 *  - useFallback عندما لا يدعم المتصفح
 *  - startCamera: نجاح، رفض إذن، خطأ عام
 *  - stopCamera: إيقاف الـ stream
 *  - capturePhoto: إرجاع File من فيديو صالح، null عند فيديو غير جاهز
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCamera } from '@/app/hooks/useCamera';

// ─── Mock MediaStream ────────────────────────────────────────────────────────

function createMockStream() {
  const stop = vi.fn();
  return {
    getTracks: () => [{ stop }],
    stop,
  } as unknown as MediaStream;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('useCamera', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    if (navigator.mediaDevices?.getUserMedia) {
      vi.mocked(navigator.mediaDevices.getUserMedia).mockReset();
    }
  });

  describe('isSupported and useFallback', () => {
    it('isSupported is true when getUserMedia is available', () => {
      const { result } = renderHook(() => useCamera());
      expect(result.current.isSupported).toBe(true);
      expect(result.current.useFallback).toBe(false);
    });

    it('useFallback is true when mediaDevices is absent', () => {
      const backup = navigator.mediaDevices;
      Object.defineProperty(navigator, 'mediaDevices', {
        value: undefined,
        writable: true,
      });

      const { result } = renderHook(() => useCamera());
      expect(result.current.useFallback).toBe(true);

      Object.defineProperty(navigator, 'mediaDevices', {
        value: backup,
        writable: true,
      });
    });
  });

  describe('startCamera', () => {
    it('starts camera successfully and updates state', async () => {
      const stream = createMockStream();
      vi.mocked(navigator.mediaDevices!.getUserMedia).mockResolvedValue(stream);

      const { result } = renderHook(() => useCamera());

      await act(async () => {
        await result.current.startCamera();
      });

      expect(result.current.isActive).toBe(true);
      expect(result.current.stream).toBe(stream);
      expect(result.current.hasPermission).toBe('granted');
      expect(result.current.error).toBeNull();
    });

    it('shows permission denied error on NotAllowedError', async () => {
      vi.mocked(navigator.mediaDevices!.getUserMedia).mockRejectedValue(
        new Error('Permission denied')
      );

      const { result } = renderHook(() => useCamera());

      await act(async () => {
        await result.current.startCamera();
      });

      expect(result.current.hasPermission).toBe('denied');
      expect(result.current.error).toContain('رفض');
      expect(result.current.isActive).toBe(false);
    });

    it('shows unsupported error when getUserMedia is absent', async () => {
      const backup = navigator.mediaDevices;
      Object.defineProperty(navigator, 'mediaDevices', {
        value: undefined,
        writable: true,
      });

      const { result } = renderHook(() => useCamera());

      await act(async () => {
        await result.current.startCamera();
      });

      expect(result.current.hasPermission).toBe('unsupported');
      expect(result.current.error).toContain('لا يدعم');

      Object.defineProperty(navigator, 'mediaDevices', {
        value: backup,
        writable: true,
      });
    });
  });

  describe('stopCamera', () => {
    it('stops stream and cleans up state', async () => {
      const stream = createMockStream();
      vi.mocked(navigator.mediaDevices!.getUserMedia).mockResolvedValue(stream);

      const { result } = renderHook(() => useCamera());

      await act(async () => {
        await result.current.startCamera();
      });
      expect(result.current.isActive).toBe(true);

      act(() => {
        result.current.stopCamera();
      });

      expect(result.current.isActive).toBe(false);
      expect(result.current.stream).toBeNull();
      expect(stream.getTracks()[0].stop).toHaveBeenCalled();
    });
  });

  describe('capturePhoto', () => {
    it('returns null when video is not ready', async () => {
      const { result } = renderHook(() => useCamera());
      const video = document.createElement('video');
      Object.defineProperty(video, 'readyState', { value: 1, configurable: true });
      Object.defineProperty(video, 'videoWidth', { value: 0, configurable: true });
      Object.defineProperty(video, 'videoHeight', { value: 0, configurable: true });
      const videoRef = { current: video };

      let file: File | null = null;
      await act(async () => {
        file = await result.current.capturePhoto(videoRef);
      });

      expect(file).toBeNull();
    });

    it('returns File when video is valid', async () => {
      const { result } = renderHook(() => useCamera());
      const video = document.createElement('video');
      Object.defineProperty(video, 'readyState', { value: 2 });
      Object.defineProperty(video, 'videoWidth', { value: 640 });
      Object.defineProperty(video, 'videoHeight', { value: 480 });
      const videoRef = { current: video };

      let file: File | null = null;
      await act(async () => {
        file = await result.current.capturePhoto(videoRef);
      });

      expect(file).toBeInstanceOf(File);
      expect(file!.type).toBe('image/jpeg');
      expect(file!.name).toMatch(/^capture_\d+\.jpg$/);
    });
  });
});
