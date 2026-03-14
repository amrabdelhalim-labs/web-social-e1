export const APP_NAME = 'صوري';
export const APP_NAME_EN = 'My Photos';
export const APP_DESCRIPTION = 'موقع ويب لمشاركة الصور — ارفع صورك أو التقطها وشاركها مع الجميع.';

export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 50;

// ── Image Upload ──────────────────────────────────────────────────────────────
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

export const MAX_TITLE_LENGTH = 200;
export const MAX_DESCRIPTION_LENGTH = 2000;

export const DESCRIPTION_PREVIEW_LINES = 3;

// ── Camera ────────────────────────────────────────────────────────────────────
/** JPEG quality for camera captures (0-1). */
export const CAMERA_CAPTURE_QUALITY = 0.9;
/** Max dimension (px) for camera captures before upload. */
export const CAMERA_MAX_DIMENSION = 1920;
export const CAMERA_CAPTURE_FILENAME_PREFIX = 'capture';

// ── Avatar ────────────────────────────────────────────────────────────────────
/** Max file size for profile avatar uploads (separate limit from post photos). */
export const AVATAR_MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
