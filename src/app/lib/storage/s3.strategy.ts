import path from 'node:path';
import type { StorageFile, UploadResult } from '@/app/types';
import type { IStorageStrategy } from './storage.interface';

interface S3Config {
  bucket?: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  folder?: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type S3Client = {
  send(command: unknown): Promise<unknown>;
};

const S3_MODULE = '@aws-sdk/client-s3';

async function loadS3SDK(): Promise<any> {
  return import(/* webpackIgnore: true */ S3_MODULE);
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export class S3StorageStrategy implements IStorageStrategy {
  private s3Client: S3Client | null = null;
  private bucket: string;
  private region: string;
  private accessKeyId: string;
  private secretAccessKey: string;
  private folder: string;

  constructor(config: S3Config = {}) {
    this.bucket = config.bucket || process.env.AWS_S3_BUCKET || '';
    this.region = config.region || process.env.AWS_REGION || 'us-east-1';
    this.accessKeyId = config.accessKeyId || process.env.AWS_ACCESS_KEY_ID || '';
    this.secretAccessKey = config.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY || '';
    this.folder = config.folder || 'uploads/photos';

    if (!this.bucket || !this.accessKeyId || !this.secretAccessKey) {
      throw new Error(
        'AWS S3 credentials required: AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY'
      );
    }
  }

  private async ensureClient(): Promise<void> {
    if (this.s3Client) return;

    const sdk = await loadS3SDK();
    this.s3Client = new sdk.S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey,
      },
    }) as S3Client;
  }

  async uploadFile(file: StorageFile): Promise<UploadResult> {
    await this.ensureClient();

    const sdk = await loadS3SDK();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    const key = `${this.folder}/${uniqueSuffix}${ext}`;

    await this.s3Client!.send(
      new sdk.PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

    return {
      url: `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`,
      filename: key,
    };
  }

  async uploadFiles(files: StorageFile[]): Promise<UploadResult[]> {
    return Promise.all(files.map((f) => this.uploadFile(f)));
  }

  async deleteFile(keyOrUrl: string): Promise<boolean> {
    await this.ensureClient();
    try {
      const sdk = await loadS3SDK();
      const key = this.extractKey(keyOrUrl);
      if (!key) return false;
      await this.s3Client!.send(new sdk.DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
      return true;
    } catch (error) {
      console.error(`Failed to delete from S3: ${keyOrUrl}`, error);
      return false;
    }
  }

  async deleteFiles(keys: string[]): Promise<{ success: string[]; failed: string[] }> {
    const results = { success: [] as string[], failed: [] as string[] };

    for (const key of keys) {
      const deleted = await this.deleteFile(key);
      (deleted ? results.success : results.failed).push(key);
    }

    return results;
  }

  getFileUrl(key: string): string {
    if (!key) return key;
    if (key.startsWith('http://') || key.startsWith('https://')) return key;
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.ensureClient();
      const sdk = await loadS3SDK();
      await this.s3Client!.send(new sdk.HeadBucketCommand({ Bucket: this.bucket }));
      return true;
    } catch {
      return false;
    }
  }

  private extractKey(urlOrKey: string): string | null {
    if (!urlOrKey) return null;
    try {
      if (urlOrKey.includes('s3.') && urlOrKey.includes('.amazonaws.com')) {
        return new URL(urlOrKey).pathname.substring(1);
      }
      return urlOrKey;
    } catch {
      return null;
    }
  }
}
