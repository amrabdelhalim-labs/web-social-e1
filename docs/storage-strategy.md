# استراتيجية التخزين — صوري

> Strategy Pattern لتبديل مزود تخزين الملفات دون تغيير كود API.

---

## 1. الواجهة (IStorageStrategy)

جميع الاستراتيجيات تُنفّذ:

| الدالة                   | الوصف                                   |
| ------------------------ | --------------------------------------- |
| `uploadFile(file)`       | رفع ملف واحد، يُرجع `{ url, filename }` |
| `uploadFiles(files)`     | رفع عدة ملفات                           |
| `deleteFile(filename)`   | حذف ملف بالاسم/المفتاح                  |
| `deleteFiles(filenames)` | حذف جماعي، يُرجع `{ success, failed }`  |
| `getFileUrl(filename)`   | تحويل الاسم إلى URL كامل                |
| `healthCheck()`          | فحص الاتصال بالمزود                     |

---

## 2. الأنواع المدعومة

| STORAGE_TYPE | الوصف                      | المتغيرات البيئية                                                           |
| ------------ | -------------------------- | --------------------------------------------------------------------------- |
| `local`      | تخزين في `public/uploads/` | `LOCAL_BASE_URL` (افتراضي `/uploads`)                                       |
| `cloudinary` | Cloudinary CDN             | `CLOUDINARY_URL` أو الحقول المنفصلة                                         |
| `s3`         | AWS S3                     | `AWS_ACCESS_KEY_ID`، `AWS_SECRET_ACCESS_KEY`، `AWS_REGION`، `AWS_S3_BUCKET` |

---

## 3. الاستخدام

```typescript
import { getStorageService } from '@/app/lib/storage/storage.service';

const storage = getStorageService();

// رفع
const result = await storage.uploadFile({
  buffer,
  originalname: file.name,
  mimetype: file.type,
  size: file.size,
});
// result.url → يُخزّن في imageUrl أو avatarUrl

// حذف
await storage.deleteFile(urlOrKey);

// فحص الصحة
const ok = await storage.healthCheck();
```

---

## 4. نطاق الاستخدام

- **صور المنشورات** — رفع وحذف عبر `api/photos` و `api/photos/[id]`
- **صور الملف الشخصي** — رفع وحذف عبر `api/profile/avatar`

---

## 5. ملاحظات

- حزم Cloudinary و S3 في `optionalDependencies` — التثبيت تلقائي، والفشل لا يوقف `npm install`
- عند رفع ناجح ثم فشل حفظ السجل في DB، يُحذف الملف تلقائيًا (cleanup)
- عند حذف حساب، تُحذف جميع ملفات المستخدم (صور + صورة شخصية) قبل حذف السجلات

---

_للمتغيرات البيئية الكاملة، راجع [deployment.md](deployment.md)._
