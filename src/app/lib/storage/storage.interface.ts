import type { StorageFile, UploadResult } from '@/app/types';

export interface IStorageStrategy {
  uploadFile(file: StorageFile): Promise<UploadResult>;
  uploadFiles(files: StorageFile[]): Promise<UploadResult[]>;
  deleteFile(filename: string): Promise<boolean>;
  deleteFiles(filenames: string[]): Promise<{ success: string[]; failed: string[] }>;
  getFileUrl(filename: string): string;
  healthCheck(): Promise<boolean>;
}
