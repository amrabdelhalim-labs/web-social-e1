import fs from 'node:fs';
import path from 'node:path';
import type { StorageFile, UploadResult } from '@/app/types';
import type { IStorageStrategy } from './storage.interface';

interface LocalConfig {
  uploadsDir?: string;
  baseUrl?: string;
}

export class LocalStorageStrategy implements IStorageStrategy {
  private uploadsDir: string;
  private baseUrl: string;

  constructor(config: LocalConfig = {}) {
    this.uploadsDir = config.uploadsDir || path.resolve(process.cwd(), 'public/uploads');
    this.baseUrl = config.baseUrl || '/uploads';
    this.ensureDirectoryExists();
  }

  private ensureDirectoryExists(): void {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  async uploadFile(file: StorageFile): Promise<UploadResult> {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    const filename = uniqueSuffix + ext;
    const filePath = path.join(this.uploadsDir, filename);

    await fs.promises.writeFile(filePath, file.buffer);

    return { url: `${this.baseUrl}/${filename}`, filename };
  }

  async uploadFiles(files: StorageFile[]): Promise<UploadResult[]> {
    return Promise.all(files.map((f) => this.uploadFile(f)));
  }

  async deleteFile(filename: string): Promise<boolean> {
    try {
      const cleanName = this.extractFilename(filename);
      if (!cleanName) return false;

      const filePath = path.join(this.uploadsDir, cleanName);
      if (!fs.existsSync(filePath)) return false;

      await fs.promises.unlink(filePath);
      return true;
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return false;
      console.error(`Failed to delete file ${filename}:`, error);
      return false;
    }
  }

  async deleteFiles(filenames: string[]): Promise<{ success: string[]; failed: string[] }> {
    const results = { success: [] as string[], failed: [] as string[] };

    for (const filename of filenames) {
      const deleted = await this.deleteFile(filename);
      (deleted ? results.success : results.failed).push(filename);
    }

    return results;
  }

  getFileUrl(filename: string): string {
    if (!filename) return filename;
    if (filename.startsWith('http://') || filename.startsWith('https://')) return filename;
    if (filename.startsWith(this.baseUrl)) return filename;
    return `${this.baseUrl}/${filename}`;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await fs.promises.access(this.uploadsDir, fs.constants.W_OK);
      return true;
    } catch {
      return false;
    }
  }

  private extractFilename(imageUrl: string): string | null {
    if (!imageUrl) return null;
    try {
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return path.basename(new URL(imageUrl).pathname);
      }
      return path.basename(imageUrl);
    } catch {
      return null;
    }
  }
}
