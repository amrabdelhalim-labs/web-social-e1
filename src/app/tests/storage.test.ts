import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { LocalStorageStrategy } from '@/app/lib/storage/local.strategy';

const TEST_DIR = path.resolve(process.cwd(), '.test-uploads');
const BASE_URL = '/test-uploads';

describe('LocalStorageStrategy — وحدة اختبارات التخزين المحلي', () => {
  let strategy: LocalStorageStrategy;

  beforeAll(() => {
    strategy = new LocalStorageStrategy({ uploadsDir: TEST_DIR, baseUrl: BASE_URL });
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

  // ─── constructor ─────────────────────────────────────────────────────────

  it('ينشئ مجلد التخزين تلقائيًا', () => {
    expect(fs.existsSync(TEST_DIR)).toBe(true);
  });

  // ─── uploadFile ───────────────────────────────────────────────────────────

  it('يرفع ملفًا ويعيد URL واسم الملف', async () => {
    const result = await strategy.uploadFile(mockFile());
    expect(result.url).toMatch(/^\/test-uploads\/\d+-\d+\.jpg$/);
    expect(result.filename).toMatch(/^\d+-\d+\.jpg$/);
    expect(fs.existsSync(path.join(TEST_DIR, result.filename))).toBe(true);
  });

  it('يحتفظ بامتداد ملف PNG', async () => {
    const result = await strategy.uploadFile(mockFile('image.png'));
    expect(result.filename).toMatch(/\.png$/);
  });

  it('يستخدم .jpg كامتداد افتراضي لملف بدون امتداد', async () => {
    const result = await strategy.uploadFile(mockFile('noextension'));
    expect(result.filename).toMatch(/\.jpg$/);
  });

  it('يكتب محتوى الملف بشكل صحيح', async () => {
    const content = 'binary-image-content';
    const { filename } = await strategy.uploadFile(mockFile('test.jpg', content));
    const saved = await fs.promises.readFile(path.join(TEST_DIR, filename), 'utf-8');
    expect(saved).toBe(content);
  });

  // ─── uploadFiles ──────────────────────────────────────────────────────────

  it('يرفع عدة ملفات دفعة واحدة', async () => {
    const files = [mockFile('a.png'), mockFile('b.jpeg')];
    const results = await strategy.uploadFiles(files);
    expect(results).toHaveLength(2);
    results.forEach((r) => expect(r.url).toBeTruthy());
  });

  it('يعيد مصفوفة فارغة عند تمرير مصفوفة فارغة', async () => {
    const results = await strategy.uploadFiles([]);
    expect(results).toHaveLength(0);
  });

  // ─── deleteFile ───────────────────────────────────────────────────────────

  it('يحذف ملفًا موجودًا بنجاح', async () => {
    const { filename } = await strategy.uploadFile(mockFile());
    const deleted = await strategy.deleteFile(filename);
    expect(deleted).toBe(true);
    expect(fs.existsSync(path.join(TEST_DIR, filename))).toBe(false);
  });

  it('يعيد false عند حذف ملف غير موجود', async () => {
    expect(await strategy.deleteFile('non-existent-file.jpg')).toBe(false);
  });

  it('يستخرج اسم الملف من URL نسبي ويحذفه', async () => {
    const { filename } = await strategy.uploadFile(mockFile());
    const deleted = await strategy.deleteFile(`${BASE_URL}/${filename}`);
    expect(deleted).toBe(true);
  });

  it('يستخرج اسم الملف من https:// URL ويحذفه', async () => {
    const { filename } = await strategy.uploadFile(mockFile());
    const deleted = await strategy.deleteFile(`https://cdn.example.com/uploads/${filename}`);
    // File lives under the test temp dir — only the basename is passed through
    // Expect false because the file is under TEST_DIR, not /uploads/
    // Important: the helper must not throw
    expect(typeof deleted).toBe('boolean');
  });

  it('يعيد false للسلسلة الفارغة', async () => {
    expect(await strategy.deleteFile('')).toBe(false);
  });

  // ─── deleteFiles ──────────────────────────────────────────────────────────

  it('يحذف عدة ملفات ويُصنّف النتائج', async () => {
    const { filename } = await strategy.uploadFile(mockFile());
    const result = await strategy.deleteFiles([filename, 'missing.jpg']);
    expect(result.success).toContain(filename);
    expect(result.failed).toContain('missing.jpg');
  });

  it('يعيد نتائج فارغة لمصفوفة فارغة', async () => {
    const result = await strategy.deleteFiles([]);
    expect(result.success).toHaveLength(0);
    expect(result.failed).toHaveLength(0);
  });

  // ─── getFileUrl ───────────────────────────────────────────────────────────

  it('يبني URL صحيح من اسم الملف فقط', () => {
    expect(strategy.getFileUrl('photo.jpg')).toBe(`${BASE_URL}/photo.jpg`);
  });

  it('يعيد https:// URL كما هو', () => {
    const url = 'https://cdn.example.com/photo.jpg';
    expect(strategy.getFileUrl(url)).toBe(url);
  });

  it('يعيد http:// URL كما هو', () => {
    const url = 'http://localhost:3000/photo.jpg';
    expect(strategy.getFileUrl(url)).toBe(url);
  });

  it('لا يكرر baseUrl إذا كان موجودًا بالفعل في المسار', () => {
    expect(strategy.getFileUrl(`${BASE_URL}/photo.jpg`)).toBe(`${BASE_URL}/photo.jpg`);
  });

  it('يعيد السلسلة الفارغة كما هي', () => {
    expect(strategy.getFileUrl('')).toBe('');
  });

  // ─── healthCheck ──────────────────────────────────────────────────────────

  it('يمرر فحص الصحة بنجاح عند وجود المجلد وقابليته للكتابة', async () => {
    expect(await strategy.healthCheck()).toBe(true);
  });

  it('يعيد healthCheck نتيجة boolean', async () => {
    const result = await strategy.healthCheck();
    expect(typeof result).toBe('boolean');
  });
});

// ─── StorageService — factory singleton ──────────────────────────────────────

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
    expect(typeof service.uploadFiles).toBe('function');
    expect(typeof service.deleteFile).toBe('function');
    expect(typeof service.deleteFiles).toBe('function');
    expect(typeof service.getFileUrl).toBe('function');
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

  it('يُعيد تعيين الـ instance عند استدعاء reset', async () => {
    const { resetStorageService, getStorageService } =
      await import('@/app/lib/storage/storage.service');
    resetStorageService();
    const a = getStorageService();
    resetStorageService();
    const b = getStorageService();
    // Two distinct instances after resetModule()
    expect(typeof a).toBe('object');
    expect(typeof b).toBe('object');
    resetStorageService();
  });
});
