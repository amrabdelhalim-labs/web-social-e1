# النشر — صوري

> خطوات النشر على Heroku والمتغيرات البيئية المطلوبة.

---

## 1. المتطلبات المسبقة

- حساب Heroku
- MongoDB Atlas (أو مزود MongoDB سحابي آخر)
- حساب Cloudinary (موصى به لصور الإنتاج)

---

## 2. إعداد التطبيق على Heroku

### 2.1 إنشاء التطبيق

```bash
heroku create myphotos-app
```

### 2.2 ربط المستودع

```bash
heroku git:remote -a myphotos-app
```

### 2.3 Procfile

الملف `Procfile` في جذر المشروع:

```text
web: npm start
```

Heroku يشغّل `npm start` الذي ينفّذ `next start`.

---

## 3. المتغيرات البيئية (Config Vars)

### 3.1 إلزامية

| المتغير | الوصف | مثال |
|---------|-------|------|
| `DATABASE_URL` | رابط اتصال MongoDB | `mongodb+srv://user:pass@cluster.mongodb.net/myphotos` |
| `JWT_SECRET` | مفتاح توقيع JWT (يُولّد عشوائيًا في الإنتاج) | سلسلة طويلة عشوائية |

### 3.2 التخزين

| المتغير | الوصف | القيم |
|---------|-------|-------|
| `STORAGE_TYPE` | نوع التخزين | `local`، `cloudinary`، `s3` |

**ملاحظة:** `local` غير مناسب للإنتاج — الملفات تُفقد عند إعادة النشر. يُوصى بـ `cloudinary`.

#### Cloudinary (`STORAGE_TYPE=cloudinary`)

| المتغير | الوصف |
|---------|-------|
| `CLOUDINARY_URL` | صيغة كاملة: `cloudinary://API_KEY:API_SECRET@CLOUD_NAME` |
| أو الحقول المنفصلة: | |
| `CLOUDINARY_CLOUD_NAME` | اسم السحابة |
| `CLOUDINARY_API_KEY` | مفتاح API |
| `CLOUDINARY_API_SECRET` | السر |
| `CLOUDINARY_FOLDER` | مجلد اختياري (مثل `my-photos`) |

#### S3 (`STORAGE_TYPE=s3`)

| المتغير | الوصف |
|---------|-------|
| `AWS_S3_BUCKET` | اسم الحاوية |
| `AWS_REGION` | المنطقة |
| `AWS_ACCESS_KEY_ID` | مفتاح الوصول |
| `AWS_SECRET_ACCESS_KEY` | السر |

### 3.3 اختيارية

| المتغير | الوصف | الافتراضي |
|---------|-------|-----------|
| `PORT` | منفذ التطبيق | Heroku يحدده تلقائيًا |
| `NODE_ENV` | بيئة التشغيل | `production` على Heroku |

---

## 4. إعداد المتغيرات من سطر الأوامر

```bash
heroku config:set DATABASE_URL="mongodb+srv://..."
heroku config:set JWT_SECRET="your-secure-random-string"
heroku config:set STORAGE_TYPE=cloudinary
heroku config:set CLOUDINARY_URL="cloudinary://..."
```

---

## 5. النشر

```bash
git push heroku main
```

كل push إلى `main` يُحدّث التطبيق تلقائيًا إذا كان Heroku متصلًا بالمستودع.

---

## 6. التحقق بعد النشر

### 6.1 نقطة الصحة

```bash
curl https://myphotos-app.herokuapp.com/api/health
```

يجب أن يعرض:

- `database: "connected"`
- `storage.healthy: true` (عند استخدام cloudinary/s3)

### 6.2 سكربت التحقق (إن وُجد)

```bash
node scripts/test-api.mjs https://myphotos-app.herokuapp.com
```

يفحص التسجيل، المصادقة، الرفع، والحذف.

---

## 7. ملاحظات مهمة

- **كلمة مرور MongoDB:** إذا احتوت رموزًا خاصة (`&`, `%`, `#`, `$`) يجب ترميزها URL-encoding قبل وضعها في `DATABASE_URL`.
- **الحزم الاختيارية:** `cloudinary` و `@aws-sdk/client-s3` في `optionalDependencies` — يجب أن تبقى مثبتة في الإنتاج عند استخدام التخزين السحابي.
- **Build:** Heroku يشغّل `npm install` ثم `npm run build` تلقائيًا عند النشر.

---

*لتفاصيل استراتيجية التخزين، راجع [storage-strategy.md](storage-strategy.md).*
