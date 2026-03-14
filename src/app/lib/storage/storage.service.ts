import { CloudinaryStorageStrategy } from './cloudinary.strategy';
import { LocalStorageStrategy } from './local.strategy';
import { S3StorageStrategy } from './s3.strategy';
import type { IStorageStrategy } from './storage.interface';

type StorageType = 'local' | 'cloudinary' | 's3';

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

export function getStorageService(): IStorageStrategy {
  if (!instance) {
    const storageType = (
      (process.env.STORAGE_TYPE as StorageType) || 'local'
    ).toLowerCase() as StorageType;
    instance = createStrategy(storageType);
  }
  return instance;
}

export function getStorageType(): StorageType {
  return ((process.env.STORAGE_TYPE as StorageType) || 'local').toLowerCase() as StorageType;
}

export function resetStorageService(): void {
  instance = null;
}
