/**
 * Application Configuration Constants
 *
 * Single source of truth for all configurable values.
 * Import from here — never hardcode limits or names inline.
 *
 * Pagination: DEFAULT_PAGE_SIZE for most lists; MAX_PAGE_SIZE caps query abuse.
 * File sizes: separate limits for photo posts (5 MB) and avatars (2 MB).
 * Camera: quality/dimension limits are applied client-side before upload.
 */

export const APP_NAME = 'صوري';
export const APP_NAME_EN = 'My Photos';
export const APP_DESCRIPTION = 'موقع ويب لمشاركة الصور — ارفع صورك أو التقطها وشاركها مع الجميع.';

export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 50;

// ── Image Upload ──────────────────────────────────────────────────────────────

/** Maximum size for photo post uploads */
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

export const MAX_TITLE_LENGTH = 200;
export const MAX_DESCRIPTION_LENGTH = 2000;

/** Lines visible in collapsed description before "Show More" */
export const DESCRIPTION_PREVIEW_LINES = 3;
/** Min chars to consider truncation (short text never shows "عرض المزيد") */
export const DESCRIPTION_TRUNCATE_MIN_CHARS = 100;

// ── Camera ────────────────────────────────────────────────────────────────────

/** JPEG quality for camera captures (0–1) */
export const CAMERA_CAPTURE_QUALITY = 0.9;
/** Canvas is downscaled to this dimension before converting to blob */
export const CAMERA_MAX_DIMENSION = 1920;
export const CAMERA_CAPTURE_FILENAME_PREFIX = 'capture';

// ── Avatar ────────────────────────────────────────────────────────────────────

/** Stricter limit for avatar uploads — smaller images are sufficient */
export const AVATAR_MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
