/**
 * Storage Service Factory
 *
 * Singleton that selects and instantiates the correct storage strategy based on
 * the STORAGE_TYPE environment variable. Defaults to "local" for development.
 *
 * Supported types:
 *   local      — stores files in public/uploads/ (development default)
 *   cloudinary — Cloudinary CDN (recommended for production)
 *   s3         — AWS S3
 *
 * Usage:
 *   import { getStorageService } from '@/app/lib/storage/storage.service';
 *   const storage = getStorageService();
 *   const result = await storage.uploadFile(file);
 *
 * Note: Cloud SDK packages (cloudinary, @aws-sdk/client-s3) are optionalDependencies.
 * They are loaded lazily inside their respective strategy constructors.
 */

import { CloudinaryStorageStrategy } from './cloudinary.strategy';
import { LocalStorageStrategy } from './local.strategy';
import { S3StorageStrategy } from './s3.strategy';
import type { IStorageStrategy } from './storage.interface';

type StorageType = 'local' | 'cloudinary' | 's3';

/** Module-level singleton — shared across all API route invocations */
let instance: IStorageStrategy | null = null;

function createStrategy(type: StorageType): IStorageStrategy {
  switch (type) {
    case 'cloudinary':
      return new CloudinaryStorageStrategy({
        folder: process.env.CLOUDINARY_FOLDER || 'my-photos',
      });
    case 's3':
      return new S3StorageStrategy({
        folder: process.env.AWS_S3_FOLDER || 'uploads/photos',
      });
    case 'local':
    default:
      return new LocalStorageStrategy({
        baseUrl: process.env.LOCAL_BASE_URL || '/uploads',
      });
  }
}

/** Returns the singleton storage strategy instance, creating it on first call */
export function getStorageService(): IStorageStrategy {
  if (!instance) {
    const storageType = (
      (process.env.STORAGE_TYPE as StorageType) || 'local'
    ).toLowerCase() as StorageType;
    instance = createStrategy(storageType);
  }
  return instance;
}

/** Returns the configured storage type string */
export function getStorageType(): StorageType {
  return ((process.env.STORAGE_TYPE as StorageType) || 'local').toLowerCase() as StorageType;
}

/** Resets the singleton — used in tests to force re-initialization */
export function resetStorageService(): void {
  instance = null;
}
