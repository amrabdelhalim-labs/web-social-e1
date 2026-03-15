/**
 * IStorageStrategy — Storage Backend Contract
 *
 * All storage strategies (local, Cloudinary, S3) must implement this interface.
 * This allows the application to switch providers by changing STORAGE_TYPE without
 * modifying any API route code.
 *
 * Method conventions:
 *   uploadFile    — accepts a StorageFile, returns { url, filename }
 *   deleteFile    — accepts the filename/key returned by uploadFile; returns true on success
 *   deleteFiles   — bulk delete; partial failures return failed[] instead of throwing
 *   getFileUrl    — converts a stored filename/key to a full accessible URL
 *   healthCheck   — lightweight probe to verify provider connectivity; returns boolean
 */

import type { StorageFile, UploadResult } from '@/app/types';

export interface IStorageStrategy {
  uploadFile(file: StorageFile): Promise<UploadResult>;
  uploadFiles(files: StorageFile[]): Promise<UploadResult[]>;
  deleteFile(filename: string): Promise<boolean>;
  deleteFiles(filenames: string[]): Promise<{ success: string[]; failed: string[] }>;
  /** Returns a full URL or path for the given filename/key */
  getFileUrl(filename: string): string;
  healthCheck(): Promise<boolean>;
}
