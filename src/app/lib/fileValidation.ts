/**
 * File Content Validation — Magic Bytes Detection
 *
 * Validates uploaded files by inspecting the actual binary content (magic bytes),
 * not the MIME type reported by the browser (which is spoofable).
 *
 * Supported signatures:
 *   PNG  — 89 50 4E 47 0D 0A 1A 0A  (8 bytes)
 *   JPEG — FF D8 FF                  (3 bytes)
 *
 * Usage:
 *   const detected = detectImageType(buffer);
 *   if (!detected) return validationError(['نوع الملف غير مدعوم.']);
 */

/** Allowed detected MIME types for image uploads */
export type DetectedImageType = 'image/jpeg' | 'image/png';

/**
 * Inspects the first bytes of a buffer to determine the real image type.
 * Returns the detected MIME type, or null if unrecognised or buffer too small.
 */
export function detectImageType(buffer: Buffer): DetectedImageType | null {
  if (buffer.length < 4) return null;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return 'image/png';
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  return null;
}

/**
 * Verifies that a buffer's real content type is in the allowed list.
 * Returns the detected type on success, or null if rejected.
 */
export function validateImageBuffer(
  buffer: Buffer,
  allowed: readonly string[] = ['image/jpeg', 'image/png']
): DetectedImageType | null {
  const detected = detectImageType(buffer);
  if (!detected || !allowed.includes(detected)) return null;
  return detected;
}
