'use client';

/**
 * useCamera — Hook for Camera Capture
 *
 * Manages getUserMedia stream, permission state, and photo capture.
 * Uses Canvas to convert video frame → Blob → File with config quality/dimensions.
 * iOS fallback: when getUserMedia is unavailable, use file input with capture attribute.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CAMERA_CAPTURE_QUALITY,
  CAMERA_CAPTURE_FILENAME_PREFIX,
  CAMERA_MAX_DIMENSION,
} from '@/app/config';
import type { CameraPermission } from '@/app/types';

export interface UseCameraReturn {
  /** Whether getUserMedia is available (Desktop/Android) */
  isSupported: boolean;
  /** Whether the camera stream is currently active */
  isActive: boolean;
  /** Active MediaStream for video.srcObject (null when inactive) */
  stream: MediaStream | null;
  /** Permission state: granted | denied | prompt | unsupported */
  hasPermission: CameraPermission;
  /** Error message (e.g. permission denied) — clear when user dismisses */
  error: string | null;
  /** Start the camera stream (getUserMedia) */
  startCamera: () => Promise<void>;
  /** Stop the camera stream and release tracks */
  stopCamera: () => void;
  /** Capture current frame from video element → File (JPEG) */
  capturePhoto: (videoRef: React.RefObject<HTMLVideoElement | null>) => Promise<File | null>;
  /** True when getUserMedia is not available — use input[type=file][capture] instead */
  useFallback: boolean;
}

export function useCamera(): UseCameraReturn {
  const [isActive, setIsActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState<CameraPermission>('prompt');
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const isSupported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
  const useFallback = !isSupported;

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStream(null);
    setIsActive(false);
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const startCamera = useCallback(async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setHasPermission('unsupported');
      setError('المتصفح لا يدعم الوصول إلى الكاميرا.');
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setIsActive(true);
      setHasPermission('granted');
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('Permission denied') || message.includes('NotAllowedError')) {
        setHasPermission('denied');
        setError('تم رفض إذن الوصول إلى الكاميرا.');
      } else if (message.includes('NotFoundError')) {
        setError('لم يتم العثور على كاميرا.');
      } else {
        setError('فشل في تشغيل الكاميرا. جرّب المتصفح أو الجهاز.');
      }
      setHasPermission('denied');
      setIsActive(false);
    }
  }, []);

  const capturePhoto = useCallback(
    async (videoRef: React.RefObject<HTMLVideoElement | null>): Promise<File | null> => {
      const video = videoRef?.current;
      if (!video || video.readyState < 2) return null;

      const w = video.videoWidth;
      const h = video.videoHeight;
      if (w === 0 || h === 0) return null;

      let outW = w;
      let outH = h;
      if (w > CAMERA_MAX_DIMENSION || h > CAMERA_MAX_DIMENSION) {
        if (w >= h) {
          outW = CAMERA_MAX_DIMENSION;
          outH = Math.round((h * CAMERA_MAX_DIMENSION) / w);
        } else {
          outH = CAMERA_MAX_DIMENSION;
          outW = Math.round((w * CAMERA_MAX_DIMENSION) / h);
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.drawImage(video, 0, 0, outW, outH);

      return new Promise<File | null>((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(null);
              return;
            }
            const ext = 'image/jpeg';
            const name = `${CAMERA_CAPTURE_FILENAME_PREFIX}_${Date.now()}.jpg`;
            const file = new File([blob], name, { type: ext });
            resolve(file);
          },
          'image/jpeg',
          CAMERA_CAPTURE_QUALITY
        );
      });
    },
    []
  );

  return {
    isSupported,
    isActive,
    stream,
    hasPermission,
    error,
    startCamera,
    stopCamera,
    capturePhoto,
    useFallback,
  };
}
