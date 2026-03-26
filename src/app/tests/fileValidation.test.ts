/**
 * File Validation Tests — Magic Bytes Detection
 *
 * Verifies that detectImageType and validateImageBuffer correctly identify
 * file types by content (magic bytes), not by the browser-supplied MIME type.
 *
 * Covers:
 *  - Valid PNG file accepted
 *  - Valid JPEG file accepted
 *  - Random/binary content rejected
 *  - Spoofed MIME type (wrong extension) rejected
 *  - Buffer too small rejected
 *  - Empty buffer rejected
 *  - validateImageBuffer: allowed type accepted, disallowed type rejected
 */

import { describe, it, expect } from 'vitest';
import { detectImageType, validateImageBuffer } from '@/app/lib/fileValidation';

// ─── Magic Byte Constants ─────────────────────────────────────────────────────

/** Minimal valid PNG header (first 8 bytes) */
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Minimal valid JPEG header (first 3+ bytes) */
const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);

/** Random bytes that do not match any supported format */
const RANDOM_BYTES = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04]);

// ─── detectImageType ─────────────────────────────────────────────────────────

describe('detectImageType', () => {
  it('يُعرّف PNG بصحة عبر Magic Bytes', () => {
    expect(detectImageType(PNG_MAGIC)).toBe('image/png');
  });

  it('يُعرّف JPEG بصحة عبر Magic Bytes', () => {
    expect(detectImageType(JPEG_MAGIC)).toBe('image/jpeg');
  });

  it('يرفض بيانات عشوائية — يُعيد null', () => {
    expect(detectImageType(RANDOM_BYTES)).toBeNull();
  });

  it('يرفض buffer فارغ — يُعيد null', () => {
    expect(detectImageType(Buffer.alloc(0))).toBeNull();
  });

  it('يرفض buffer صغير جداً (أقل من 4 بايت) — يُعيد null', () => {
    expect(detectImageType(Buffer.from([0x89, 0x50, 0x4e]))).toBeNull();
  });

  it('يرفض ملف بـ magic bytes مزوّرة (ليست PNG/JPEG) — يُعيد null', () => {
    // GIF magic bytes: 47 49 46 38
    const gifBytes = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
    expect(detectImageType(gifBytes)).toBeNull();
  });

  it('يرفض ملف PDF مُزوَّر كصورة — يُعيد null', () => {
    // PDF magic: %PDF
    const pdfBytes = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d]);
    expect(detectImageType(pdfBytes)).toBeNull();
  });

  it('لا يعتمد على مسمى الملف أو MIME type — يقرأ البايتات فقط', () => {
    // PNG bytes but would be named "photo.jpg" by attacker
    expect(detectImageType(PNG_MAGIC)).toBe('image/png');
  });
});

// ─── validateImageBuffer ─────────────────────────────────────────────────────

describe('validateImageBuffer', () => {
  it('يقبل PNG ضمن القائمة المسموحة الافتراضية', () => {
    expect(validateImageBuffer(PNG_MAGIC)).toBe('image/png');
  });

  it('يقبل JPEG ضمن القائمة المسموحة الافتراضية', () => {
    expect(validateImageBuffer(JPEG_MAGIC)).toBe('image/jpeg');
  });

  it('يرفض محتوى غير معروف — يُعيد null', () => {
    expect(validateImageBuffer(RANDOM_BYTES)).toBeNull();
  });

  it('يرفض نوعاً غير موجود في القائمة المخصصة — يُعيد null', () => {
    // Only allow PNG; JPEG should be rejected
    expect(validateImageBuffer(JPEG_MAGIC, ['image/png'])).toBeNull();
  });

  it('يقبل النوع المحدد في قائمة مخصصة', () => {
    expect(validateImageBuffer(PNG_MAGIC, ['image/png'])).toBe('image/png');
  });

  it('يرفض buffer فارغ — يُعيد null', () => {
    expect(validateImageBuffer(Buffer.alloc(0))).toBeNull();
  });
});
