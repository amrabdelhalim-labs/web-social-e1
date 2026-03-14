import type { StorageFile, UploadResult } from '@/app/types';
import type { IStorageStrategy } from './storage.interface';

interface CloudinaryConfig {
  cloudName?: string;
  apiKey?: string;
  apiSecret?: string;
  folder?: string;
}

type CloudinarySDK = {
  v2: {
    config(opts: Record<string, string>): void;
    uploader: {
      upload_stream(
        opts: Record<string, unknown>,
        cb: (err: Error | null, result: Record<string, string>) => void
      ): NodeJS.WritableStream;
      destroy(publicId: string): Promise<{ result: string }>;
    };
    url(publicId: string, opts: Record<string, unknown>): string;
    api: { ping(): Promise<unknown> };
  };
};

export class CloudinaryStorageStrategy implements IStorageStrategy {
  private cloudinary: CloudinarySDK['v2'] | null = null;
  private folder: string;
  private cloudName: string;
  private apiKey: string;
  private apiSecret: string;
  private initPromise: Promise<void>;

  constructor(config: CloudinaryConfig = {}) {
    this.folder = config.folder || process.env.CLOUDINARY_FOLDER || 'my-photos';

    const cloudinaryUrl = process.env.CLOUDINARY_URL;
    if (cloudinaryUrl) {
      try {
        const url = new URL(cloudinaryUrl);
        this.cloudName = config.cloudName || url.hostname;
        this.apiKey = config.apiKey || url.username;
        this.apiSecret = config.apiSecret || decodeURIComponent(url.password);
      } catch {
        throw new Error(
          'CLOUDINARY_URL is malformed. Expected: cloudinary://API_KEY:API_SECRET@CLOUD_NAME'
        );
      }
    } else {
      this.cloudName = config.cloudName || process.env.CLOUDINARY_CLOUD_NAME || '';
      this.apiKey = config.apiKey || process.env.CLOUDINARY_API_KEY || '';
      this.apiSecret = config.apiSecret || process.env.CLOUDINARY_API_SECRET || '';
    }

    if (!this.cloudName || !this.apiKey || !this.apiSecret) {
      throw new Error(
        'Cloudinary credentials missing. Set CLOUDINARY_URL or ' +
          'CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET'
      );
    }

    this.initPromise = this.initialize();
    this.initPromise.catch(() => {});
  }

  private async initialize(): Promise<void> {
    // Dynamic import — cloudinary is an optional dependency
    const modulePath = 'cloudinary';
    const sdk = (await import(/* webpackIgnore: true */ modulePath)) as unknown as CloudinarySDK;
    this.cloudinary = sdk.v2;
    this.cloudinary.config({
      cloud_name: this.cloudName,
      api_key: this.apiKey,
      api_secret: this.apiSecret,
    });
  }

  private async ensureInitialized(): Promise<void> {
    await this.initPromise;
    if (!this.cloudinary) {
      throw new Error('Cloudinary SDK failed to initialize. Install: npm install cloudinary');
    }
  }

  async uploadFile(file: StorageFile): Promise<UploadResult> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const stream = this.cloudinary!.uploader.upload_stream(
        { folder: this.folder, resource_type: 'image', quality: 'auto:good' },
        (error, result) => {
          if (error) return reject(new Error(`Cloudinary upload failed: ${error.message}`));
          resolve({
            url: result.secure_url,
            filename: result.public_id,
            publicId: result.public_id,
          });
        }
      );
      stream.end(file.buffer);
    });
  }

  async uploadFiles(files: StorageFile[]): Promise<UploadResult[]> {
    return Promise.all(files.map((f) => this.uploadFile(f)));
  }

  async deleteFile(publicIdOrUrl: string): Promise<boolean> {
    await this.ensureInitialized();
    try {
      const publicId = this.extractPublicId(publicIdOrUrl);
      if (!publicId) return false;
      const result = await this.cloudinary!.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error) {
      console.error(`Failed to delete from Cloudinary: ${publicIdOrUrl}`, error);
      return false;
    }
  }

  async deleteFiles(publicIds: string[]): Promise<{ success: string[]; failed: string[] }> {
    const results = { success: [] as string[], failed: [] as string[] };

    for (const id of publicIds) {
      const deleted = await this.deleteFile(id);
      (deleted ? results.success : results.failed).push(id);
    }

    return results;
  }

  getFileUrl(publicId: string): string {
    if (!publicId) return publicId;
    if (publicId.startsWith('http://') || publicId.startsWith('https://')) return publicId;
    if (!this.cloudinary) return publicId;
    return this.cloudinary.url(publicId, { secure: true, quality: 'auto:good' });
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.ensureInitialized();
      await this.cloudinary!.api.ping();
      return true;
    } catch {
      return false;
    }
  }

  private extractPublicId(urlOrId: string): string | null {
    if (!urlOrId) return null;
    try {
      if (urlOrId.includes('cloudinary.com')) {
        const parts = urlOrId.split('/');
        const uploadIndex = parts.indexOf('upload');
        if (uploadIndex !== -1) {
          return parts
            .slice(uploadIndex + 2)
            .join('/')
            .replace(/\.[^/.]+$/, '');
        }
      }
      return urlOrId;
    } catch {
      return null;
    }
  }
}
