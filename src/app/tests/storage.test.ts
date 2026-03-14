import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { LocalStorageStrategy } from '@/app/lib/storage/local.strategy';

const TEST_DIR = path.resolve(process.cwd(), '.test-uploads');

describe('LocalStorageStrategy — وحدة اختبارات التخزين المحلي', () => {
  let strategy: LocalStorageStrategy;

  beforeAll(() => {
    strategy = new LocalStorageStrategy({ uploadsDir: TEST_DIR, baseUrl: '/test-uploads' });
  });

  afterAll(async () => {
    if (fs.existsSync(TEST_DIR)) {
      await fs.promises.rm(TEST_DIR, { recursive: true, force: true });
    }
  });

  const mockFile = (name = 'photo.jpg', content = 'fake-image-data') => ({
    buffer: Buffer.from(content),
    originalname: name,
    mimetype: 'image/jpeg',
    size: content.length,
  });

  it('ينشئ مجلد التخزين تلقائيًا', () => {
    expect(fs.existsSync(TEST_DIR)).toBe(true);
  });

  it('يرفع ملفًا ويعيد URL واسم الملف', async () => {
    const result = await strategy.uploadFile(mockFile());
    expect(result.url).toMatch(/^\/test-uploads\/\d+-\d+\.jpg$/);
    expect(result.filename).toMatch(/^\d+-\d+\.jpg$/);

    const filePath = path.join(TEST_DIR, result.filename);
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('يرفع عدة ملفات دفعة واحدة', async () => {
    const files = [mockFile('a.png'), mockFile('b.jpeg')];
    const results = await strategy.uploadFiles(files);
    expect(results).toHaveLength(2);
    results.forEach((r) => expect(r.url).toBeTruthy());
  });

  it('يحذف ملفًا موجودًا بنجاح', async () => {
    const { filename } = await strategy.uploadFile(mockFile());
    const deleted = await strategy.deleteFile(filename);
    expect(deleted).toBe(true);
    expect(fs.existsSync(path.join(TEST_DIR, filename))).toBe(false);
  });

  it('يعيد false عند حذف ملف غير موجود', async () => {
    const deleted = await strategy.deleteFile('non-existent-file.jpg');
    expect(deleted).toBe(false);
  });

  it('يحذف عدة ملفات ويصنف النتائج', async () => {
    const { filename } = await strategy.uploadFile(mockFile());
    const result = await strategy.deleteFiles([filename, 'missing.jpg']);
    expect(result.success).toContain(filename);
    expect(result.failed).toContain('missing.jpg');
  });

  it('يبني URL صحيح من اسم الملف', () => {
    expect(strategy.getFileUrl('photo.jpg')).toBe('/test-uploads/photo.jpg');
  });

  it('يعيد URL كما هو إذا كان مسارًا كاملاً', () => {
    const url = 'https://cdn.example.com/photo.jpg';
    expect(strategy.getFileUrl(url)).toBe(url);
  });

  it('لا يكرر baseUrl إذا كان موجودًا بالفعل', () => {
    expect(strategy.getFileUrl('/test-uploads/photo.jpg')).toBe('/test-uploads/photo.jpg');
  });

  it('يمرر فحص الصحة بنجاح', async () => {
    const healthy = await strategy.healthCheck();
    expect(healthy).toBe(true);
  });

  it('يستخرج اسم الملف من URL كامل عند الحذف', async () => {
    const { filename } = await strategy.uploadFile(mockFile());
    const fullUrl = `/test-uploads/${filename}`;
    const deleted = await strategy.deleteFile(fullUrl);
    expect(deleted).toBe(true);
  });
});

describe('StorageService — مصنع الخدمة', () => {
  it('يختار الاستراتيجية المحلية افتراضيًا', async () => {
    const originalType = process.env.STORAGE_TYPE;
    delete process.env.STORAGE_TYPE;

    const { resetStorageService, getStorageService, getStorageType } =
      await import('@/app/lib/storage/storage.service');
    resetStorageService();

    expect(getStorageType()).toBe('local');
    const service = getStorageService();
    expect(service).toBeDefined();
    expect(typeof service.uploadFile).toBe('function');
    expect(typeof service.deleteFile).toBe('function');
    expect(typeof service.healthCheck).toBe('function');

    resetStorageService();
    if (originalType !== undefined) process.env.STORAGE_TYPE = originalType;
  });

  it('يعيد نفس المثيل (singleton)', async () => {
    const { resetStorageService, getStorageService } =
      await import('@/app/lib/storage/storage.service');
    resetStorageService();
    const a = getStorageService();
    const b = getStorageService();
    expect(a).toBe(b);
    resetStorageService();
  });
});
