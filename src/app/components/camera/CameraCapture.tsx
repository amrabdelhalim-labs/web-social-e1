'use client';

/**
 * CameraCapture — Camera Stream + Capture + Preview
 *
 * Displays video stream from getUserMedia, capture button, and preview with
 * "استخدام" / "إعادة التقاط". On iOS when getUserMedia is unavailable,
 * falls back to input[type=file][capture="environment"].
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { Box, Button, IconButton, Typography, Alert, CircularProgress } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useCamera } from '@/app/hooks/useCamera';

export interface CameraCaptureProps {
  /** Called when user confirms the captured/selected image (File) */
  onCapture: (file: File) => void;
  /** Called when user cancels/closes */
  onCancel: () => void;
}

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [starting, setStarting] = useState(false);

  const {
    isSupported,
    isActive,
    stream,
    hasPermission,
    error,
    startCamera,
    stopCamera,
    capturePhoto,
    useFallback,
  } = useCamera();

  useEffect(() => {
    const video = videoRef.current;
    if (video && stream) {
      video.srcObject = stream;
    }
  }, [stream]);

  const handleStartCamera = useCallback(async () => {
    setStarting(true);
    await startCamera();
    setStarting(false);
  }, [startCamera]);

  const handleCapture = useCallback(async () => {
    const file = await capturePhoto(videoRef);
    if (file) setPreviewFile(file);
  }, [capturePhoto]);

  const handleUsePhoto = useCallback(() => {
    if (previewFile) {
      onCapture(previewFile);
      setPreviewFile(null);
      stopCamera();
    }
  }, [previewFile, onCapture, stopCamera]);

  const handleRetake = useCallback(() => {
    setPreviewFile(null);
    if (useFallback) {
      fileInputRef.current?.click();
    }
  }, [useFallback]);

  const handleCancel = useCallback(() => {
    setPreviewFile(null);
    stopCamera();
    onCancel();
  }, [stopCamera, onCancel]);

  const handleFileSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setPreviewFile(file);
    }
    e.target.value = '';
  }, []);

  // Fallback: file input for iOS / unsupported
  if (useFallback) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          p: 2,
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelected}
          style={{ display: 'none' }}
          aria-hidden
        />

        {!previewFile ? (
          <>
            <Typography variant="body1" color="text.secondary">
              التقط صورة باستخدام الكاميرا
            </Typography>
            <Button
              variant="contained"
              startIcon={<CameraAltIcon />}
              onClick={() => fileInputRef.current?.click()}
            >
              فتح الكاميرا
            </Button>
          </>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Box
              component="img"
              src={URL.createObjectURL(previewFile)}
              alt="معاينة"
              sx={{
                maxWidth: '100%',
                maxHeight: 300,
                borderRadius: 1,
                objectFit: 'contain',
              }}
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" startIcon={<CheckIcon />} onClick={handleUsePhoto}>
                استخدام
              </Button>
              <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleRetake}>
                إعادة التقاط
              </Button>
            </Box>
          </Box>
        )}

        <Button variant="text" startIcon={<CloseIcon />} onClick={handleCancel} color="inherit">
          إلغاء
        </Button>
      </Box>
    );
  }

  // Unsupported
  if (!isSupported) {
    return (
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Alert severity="info">المتصفح لا يدعم الوصول المباشر إلى الكاميرا.</Alert>
        <Button variant="text" onClick={onCancel}>
          إلغاء
        </Button>
      </Box>
    );
  }

  // Permission denied
  if (hasPermission === 'denied' && error) {
    return (
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Alert severity="error">{error}</Alert>
        <Button variant="text" onClick={onCancel}>
          إلغاء
        </Button>
      </Box>
    );
  }

  // Preview mode (after capture)
  if (previewFile) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          p: 2,
        }}
      >
        <Box
          component="img"
          src={URL.createObjectURL(previewFile)}
          alt="معاينة"
          sx={{
            maxWidth: '100%',
            maxHeight: 400,
            borderRadius: 1,
            objectFit: 'contain',
          }}
        />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="contained" startIcon={<CheckIcon />} onClick={handleUsePhoto}>
            استخدام
          </Button>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleRetake}>
            إعادة التقاط
          </Button>
        </Box>
        <Button variant="text" startIcon={<CloseIcon />} onClick={handleCancel} color="inherit">
          إلغاء
        </Button>
      </Box>
    );
  }

  // Initial state: need to start camera — لا يعرض زر إلغاء قبل الضغط على تشغيل
  if (!isActive && !starting) {
    return (
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <Button variant="contained" startIcon={<CameraAltIcon />} onClick={handleStartCamera}>
          تشغيل الكاميرا
        </Button>
      </Box>
    );
  }

  // Active stream
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        p: 2,
        position: 'relative',
      }}
    >
      <Box sx={{ position: 'relative', width: '100%', maxWidth: 400 }}>
        {starting ? (
          <Box
            sx={{
              width: '100%',
              aspectRatio: '4/3',
              backgroundColor: 'action.hover',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <Box
            component="video"
            ref={videoRef}
            autoPlay
            playsInline
            muted
            sx={{
              width: '100%',
              borderRadius: 1,
              backgroundColor: 'black',
              aspectRatio: '4/3',
              objectFit: 'cover',
            }}
          />
        )}

        <IconButton
          onClick={handleCancel}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: 'rgba(0,0,0,0.5)',
            color: 'white',
            '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
          }}
          aria-label="إغلاق"
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleCapture}
          disabled={starting || !isActive}
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            minWidth: 64,
            minHeight: 64,
          }}
          aria-label="التقاط صورة"
        >
          <CameraAltIcon sx={{ fontSize: 32 }} />
        </Button>
      </Box>
    </Box>
  );
}
