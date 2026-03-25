# النشر — صوري

> خطوات النشر عبر Docker أو Heroku والمتغيرات البيئية المطلوبة.

---

## 1. المتطلبات المسبقة

### Docker (اختياري)

- [Docker Engine](https://docs.docker.com/engine/) و [Docker Compose](https://docs.docker.com/compose/) (مثلاً Docker Desktop)

### Heroku

- حساب Heroku
- MongoDB Atlas (أو مزود MongoDB سحابي آخر)
- حساب Cloudinary (موصى به لصور الإنتاج)

---

## 2. Docker

### 2.1 الفكرة

- البناء يستخدم وضع **Next.js standalone** (`output: 'standalone'` في `next.config.mjs`) لنسخة تشغيل أخف داخل الحاوية.
- أثناء `docker build` يُضبط `JWT_SECRET` وهمي **للمرحلة فقط**؛ أسرار الإنتاج تُمرَّر **عند التشغيل** (`docker run` / `docker compose`) ولا تُخزَّن في طبقات الصورة.

### 2.2 بناء الصورة محليًا

```bash
docker build -t web-social-e1:local .
```

### 2.3 تشغيل الحاوية (مع MongoDB خارج الصورة)

```bash
docker run --rm -p 3000:3000 \
  -e DATABASE_URL="mongodb+srv://..." \
  -e JWT_SECRET="your-secure-secret" \
  -e STORAGE_TYPE=cloudinary \
  -e CLOUDINARY_URL="cloudinary://..." \
  web-social-e1:local
```

### 2.4 Docker Compose (تطبيق + MongoDB محليًا)

1. أنشئ ملف `.env` في جذر المستودع (غير مُتتبَّع في Git) وضع فيه على الأقل:

   ```env
   JWT_SECRET=سلسلة-عشوائية-طويلة
   ```

   يمكنك الاستئناس بـ [`.env.docker.example`](../.env.docker.example).

2. من جذر المشروع:

   ```bash
   docker compose up --build
   ```

3. التطبيق على المنفذ **3000**، وقاعدة البيانات داخل شبكة Compose على `mongodb://mongo:27017/myphotos`.

**التخزين المحلي (`STORAGE_TYPE=local`):** يُستخدم مجلد حجم (volume) اسمه `uploads-data` لـ `public/uploads` حتى لا تُفقد الصور عند إعادة إنشاء الحاوية.

**للإنتاج الحقيقي:** يُفضَّل `cloudinary` أو `s3` مع نفس المتغيرات الموضحة في القسم 4 أدناه.

### 2.5 GitHub Container Registry (ghcr.io)

عند دفع إلى الفرع `main` أو وسم يبدأ بـ `v`، يعمل سير العمل [`.github/workflows/docker-publish.yml`](../.github/workflows/docker-publish.yml) ببناء الصورة ودفعها إلى:

`ghcr.io/<owner>/<repo>`

**الصلاحيات:** في المستودع → **Settings** → **Actions** → **General** → **Workflow permissions** يجب السماح بقراءة وكتابة الحزم إن لزم.

**سحب وتشغيل مثال:**

```bash
docker pull ghcr.io/OWNER/web-social-e1:main
docker run --rm -p 3000:3000 \
  -e DATABASE_URL="..." \
  -e JWT_SECRET="..." \
  -e STORAGE_TYPE=cloudinary \
  -e CLOUDINARY_URL="cloudinary://..." \
  ghcr.io/OWNER/web-social-e1:main
```

استبدل `OWNER` باسم المستخدم أو المنظمة على GitHub (أحرف صغيرة في عنوان الصورة).

### 2.6 Quality gates قبل نشر الصورة

قبل بناء/دفع الصورة في GitHub Actions، يمر المستودع عبر بوابات الجودة التالية:

1. `npm run format:check`
2. `npm run lint`
3. `npm run typecheck`
4. `npm test`
5. `npm run docker:check`
6. `npm run build` (مع `JWT_SECRET` خاص ببيئة CI للبناء فقط)

إذا فشلت أي خطوة، **لا يتم دفع الصورة** إلى `ghcr.io`.

### 2.7 التحقق

```bash
curl http://localhost:3000/api/health
```

---

## 3. إعداد التطبيق على Heroku

### 3.1 إنشاء التطبيق

```bash
heroku create myphotos-app
```

### 3.2 ربط المستودع

```bash
heroku git:remote -a myphotos-app
```

### 3.3 Procfile

الملف `Procfile` في جذر المشروع:

```text
web: npm start
```

Heroku يشغّل `npm start` الذي ينفّذ `next start`.

---

## 4. المتغيرات البيئية (Config Vars)

### 4.1 إلزامية

| المتغير        | الوصف                                        | مثال                                                   |
| -------------- | -------------------------------------------- | ------------------------------------------------------ |
| `DATABASE_URL` | رابط اتصال MongoDB                           | `mongodb+srv://user:pass@cluster.mongodb.net/myphotos` |
| `JWT_SECRET`   | مفتاح توقيع JWT (يُولّد عشوائيًا في الإنتاج) | سلسلة طويلة عشوائية                                    |

### 4.2 التخزين

| المتغير        | الوصف       | القيم                       |
| -------------- | ----------- | --------------------------- |
| `STORAGE_TYPE` | نوع التخزين | `local`، `cloudinary`، `s3` |

**ملاحظة:** `local` غير مناسب للإنتاج — الملفات تُفقد عند إعادة النشر. يُوصى بـ `cloudinary`.

#### Cloudinary (`STORAGE_TYPE=cloudinary`)

| المتغير                 | الوصف                                                    |
| ----------------------- | -------------------------------------------------------- |
| `CLOUDINARY_URL`        | صيغة كاملة: `cloudinary://API_KEY:API_SECRET@CLOUD_NAME` |
| أو الحقول المنفصلة:     |                                                          |
| `CLOUDINARY_CLOUD_NAME` | اسم السحابة                                              |
| `CLOUDINARY_API_KEY`    | مفتاح API                                                |
| `CLOUDINARY_API_SECRET` | السر                                                     |
| `CLOUDINARY_FOLDER`     | مجلد اختياري (مثل `my-photos`)                           |

#### S3 (`STORAGE_TYPE=s3`)

| المتغير                 | الوصف        |
| ----------------------- | ------------ |
| `AWS_S3_BUCKET`         | اسم الحاوية  |
| `AWS_REGION`            | المنطقة      |
| `AWS_ACCESS_KEY_ID`     | مفتاح الوصول |
| `AWS_SECRET_ACCESS_KEY` | السر         |

### 4.3 اختيارية

| المتغير    | الوصف        | الافتراضي               |
| ---------- | ------------ | ----------------------- |
| `PORT`     | منفذ التطبيق | Heroku يحدده تلقائيًا   |
| `NODE_ENV` | بيئة التشغيل | `production` على Heroku |

---

## 5. إعداد المتغيرات من سطر الأوامر (Heroku)

```bash
heroku config:set DATABASE_URL="mongodb+srv://..."
heroku config:set JWT_SECRET="your-secure-random-string"
heroku config:set STORAGE_TYPE=cloudinary
heroku config:set CLOUDINARY_URL="cloudinary://..."
```

---

## 6. النشر (Heroku)

```bash
git push heroku main
```

كل push إلى `main` يُحدّث التطبيق تلقائيًا إذا كان Heroku متصلًا بالمستودع.

---

## 7. التحقق بعد النشر

### 7.1 نقطة الصحة

```bash
curl https://myphotos-app.herokuapp.com/api/health
```

يجب أن يعرض:

- `database: "connected"`
- `storage.healthy: true` (عند استخدام cloudinary/s3)

### 7.2 سكربت التحقق (إن وُجد)

```bash
node scripts/test-api.mjs https://myphotos-app.herokuapp.com
```

يفحص التسجيل، المصادقة، الرفع، والحذف.

---

## 8. ملاحظات مهمة

- **كلمة مرور MongoDB:** إذا احتوت رموزًا خاصة (`&`, `%`, `#`, `$`) يجب ترميزها URL-encoding قبل وضعها في `DATABASE_URL`.
- **الحزم الاختيارية:** `cloudinary` و `@aws-sdk/client-s3` في `optionalDependencies` — يجب أن تبقى مثبتة في الإنتاج عند استخدام التخزين السحابي.
- **Build:** Heroku يشغّل `npm install` ثم `npm run build` تلقائيًا عند النشر.

---

_لتفاصيل استراتيجية التخزين، راجع [storage-strategy.md](storage-strategy.md)._
