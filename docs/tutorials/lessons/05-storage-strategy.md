# الدرس 05: استراتيجية التخزين

> هدف الدرس: فهم [استراتيجية التخزين](../concepts-guide.md#6-استراتيجية-التخزين-strategy-pattern) في صوري — الواجهة الموحدة، التنفيذات الثلاث (محلي، Cloudinary، S3)، والمصنع الذي يختار الاستراتيجية عند التشغيل.

---

## 1. لمحة عامة

مسارات الرفع والحذف لا تعرف أين الملف فعلياً. واجهة واحدة (`IStorageStrategy`) وتنفيذات متعددة. يُختار التنفيذ عند التشغيل حسب `STORAGE_TYPE` — دون تغيير كود API.

**تشبيه:** نفس "طلب توصيل" واحد، لكن شركة التوصيل تتغير حسب العنوان (محلي، Cloudinary، S3).

---

## 2. IStorageStrategy — الواجهة الموحدة

### ٢.١ الفكرة

كل استراتيجية تُنفّذ نفس العقد. المسار يمرّر `StorageFile` (buffer + اسم + نوع MIME) ويستقبل `{ url, filename }`. الحذف يقبل اسم الملف أو URL كامل — كل استراتيجية تستخرج المفتاح المناسب داخلياً.

### ٢.٢ العمليات

| الدالة      | الوصف                              |
| ----------- | ---------------------------------- |
| uploadFile  | رفع ملف واحد → `{ url, filename }` |
| uploadFiles | رفع عدة ملفات                      |
| deleteFile  | حذف ملف بالاسم/المفتاح/URL         |
| deleteFiles | حذف جماعي → `{ success, failed }`  |
| getFileUrl  | تحويل الاسم إلى URL كامل           |
| healthCheck | فحص الاتصال بالمزود                |

### ٢.٣ الكود

```typescript
// storage.interface.ts — IStorageStrategy
export interface IStorageStrategy {
  uploadFile(file: StorageFile): Promise<UploadResult>;
  uploadFiles(files: StorageFile[]): Promise<UploadResult[]>;
  deleteFile(filename: string): Promise<boolean>;
  deleteFiles(filenames: string[]): Promise<{ success: string[]; failed: string[] }>;
  getFileUrl(filename: string): string;
  healthCheck(): Promise<boolean>;
}
```

---

## 3. storage.service — المصنع والـ Singleton

### ٣.١ الفكرة

`getStorageService()` يُرجع نسخة واحدة تُنشأ عند أول استدعاء. النوع يُحدَّد من `process.env.STORAGE_TYPE` (افتراضي `local`).

### ٣.٢ createStrategy

```typescript
// storage.service.ts — createStrategy
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
```

### ٣.٣ resetStorageService

تُستدعى في الاختبارات لإجبار إعادة إنشاء النسخة (مثلاً لتبديل النوع بين الاختبارات).

---

## 4. LocalStorageStrategy — التخزين المحلي

### ٤.١ الفكرة

الملفات تُحفظ في `public/uploads/`. Next.js يقدّمها ثابتاً على `/uploads/<filename>`. مناسب للتطوير وليس للإنتاج متعدد النسخ أو serverless.

### ٤.٢ uploadFile

```typescript
// local.strategy.ts — uploadFile مقتطف
async uploadFile(file: StorageFile): Promise<UploadResult> {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const ext = path.extname(file.originalname) || '.jpg';
  const filename = uniqueSuffix + ext;
  const filePath = path.join(this.uploadsDir, filename);

  await fs.promises.writeFile(filePath, file.buffer);
  return { url: `${this.baseUrl}/${filename}`, filename };
}
```

- اسم فريد: timestamp + عشوائي لتجنب التصادم.
- `extractFilename`: يقبل اسم ملف، مسار، أو URL كامل — يستخرج الاسم العاري للحذف.

---

## 5. CloudinaryStorageStrategy — التخزين السحابي

### ٥.١ الفكرة

الرفع عبر `upload_stream` (buffer → stream) دون كتابة ملف مؤقت. الاعتماديات في `optionalDependencies` — تُحمَّل ديناميكياً عند أول استخدام.

### ٥.٢ الاعتمادات

| المصدر          | الأولوية                                                         |
| --------------- | ---------------------------------------------------------------- |
| CLOUDINARY_URL  | صيغة كاملة `cloudinary://api_key:api_secret@cloud_name`          |
| الحقول المنفصلة | CLOUDINARY_CLOUD_NAME، CLOUDINARY_API_KEY، CLOUDINARY_API_SECRET |

### ٥.٣ upload_stream و extractPublicId

```typescript
// cloudinary.strategy.ts — upload_stream
const stream = this.cloudinary!.uploader.upload_stream(
  { folder: this.folder, resource_type: 'image', quality: 'auto:good' },
  (error, result) => {
    if (error) return reject(new Error(`Cloudinary upload failed: ${error.message}`));
    resolve({ url: result.secure_url, filename: result.public_id, publicId: result.public_id });
  }
);
stream.end(file.buffer);
```

- `extractPublicId`: يحوّل URL كامل إلى `public_id` للحذف (يزيل الإصدار والامتداد).

---

## 6. S3StorageStrategy — AWS S3

### ٦.١ الفكرة

الرفع عبر `PutObjectCommand` (buffer مباشر). الحزمة `@aws-sdk/client-s3` في `optionalDependencies` — تُحمَّل ديناميكياً.

### ٦.٢ المتغيرات المطلوبة

| المتغير               | الوصف                       |
| --------------------- | --------------------------- |
| AWS_S3_BUCKET         | اسم الحاوية                 |
| AWS_ACCESS_KEY_ID     | مفتاح IAM                   |
| AWS_SECRET_ACCESS_KEY | السر                        |
| AWS_REGION            | المنطقة (افتراضي us-east-1) |

### ٦.٣ PutObjectCommand و extractKey

```typescript
// s3.strategy.ts — uploadFile مقتطف
const key = `${this.folder}/${uniqueSuffix}${ext}`;
await this.s3Client!.send(
  new sdk.PutObjectCommand({
    Bucket: this.bucket,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  })
);
return { url: `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`, filename: key };
```

- `extractKey`: يحوّل URL كامل إلى مفتاح S3 للحذف.

---

## 7. نطاق الاستخدام و Cleanup

### ٧.١ أين تُستخدم الاستراتيجية

| المسار                     | الاستخدام                         |
| -------------------------- | --------------------------------- |
| POST /api/photos           | رفع صورة منشور                    |
| DELETE /api/photos/[id]    | حذف ملف الصورة                    |
| PUT /api/profile/avatar    | رفع صورة شخصية                    |
| DELETE /api/profile/avatar | حذف صورة شخصية                    |
| DELETE /api/profile        | حذف جميع ملفات المستخدم (cascade) |

### ٧.٢ Cleanup عند الفشل

عند رفع ناجح ثم فشل حفظ السجل في DB، يُحذف الملف تلقائياً. عند حذف حساب، تُجمع كل الملفات (صور + avatar) وتُحذف قبل حذف السجلات.

---

## 8. ملخص

| ما تعلمناه                   | الملف المسؤول            |
| ---------------------------- | ------------------------ |
| الواجهة IStorageStrategy     | `storage.interface.ts`   |
| المصنع و getStorageService   | `storage.service.ts`     |
| التخزين المحلي               | `local.strategy.ts`      |
| التخزين السحابي (Cloudinary) | `cloudinary.strategy.ts` |
| التخزين السحابي (S3)         | `s3.strategy.ts`         |

للدليل التقني ← [storage-strategy.md](../../storage-strategy.md)

---

_الدرس السابق ← [04 — المصادقة والحماية](04-authentication.md)_  
_العودة إلى [فهرس الدروس](../README.md)_  
_الدرس التالي → [06 — مسارات API](06-api-routes.md)_
