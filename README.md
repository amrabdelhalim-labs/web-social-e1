# صوري — موقع مشاركة الصور 📷

> ارفع صورك، التقطها من كاميرتك، وشاركها مع الجميع.

---

## لمحة عامة

**صوري** موقع ويب Full-Stack لمشاركة الصور، مبني بـ Next.js مع دعم Server-Side Rendering.
يتيح للمستخدمين رفع صور PNG/JPEG أو التقاطها مباشرة من كاميرا الجهاز، وإضافة عنوان ووصف لكل صورة، ومشاهدة صور المجتمع، والتفاعل معها بالإعجاب.

---

## الميزات الرئيسية

| الميزة            | التفاصيل                                               |
| ----------------- | ------------------------------------------------------ |
| **مشاركة الصور**  | رفع PNG/JPEG مع عنوان ووصف                             |
| **كاميرا مباشرة** | التقاط صورة من الكاميرا عبر `getUserMedia`             |
| **صفحة المجتمع**  | عرض صور جميع المستخدمين مع pagination                  |
| **الإعجاب**       | إضافة/إزالة إعجاب مع عداد فوري                         |
| **الملف الشخصي**  | تعديل البيانات، الصورة الشخصية، وكلمة المرور           |
| **المصادقة**      | JWT + bcrypt، حماية المسارات، تحديث تلقائي للـ context |
| **وضع داكن/فاتح** | تبديل السمة مع الحفاظ على WCAG AA                      |
| **تخزين مرن**     | محلي / Cloudinary / S3 عبر Strategy Pattern            |
| **حذف الحساب**    | حذف متسلسل: صور + إعجابات + ملفات التخزين              |

---

## الحزمة التقنية

| التقنية         | الإصدار | الغرض                                      |
| --------------- | ------- | ------------------------------------------ |
| Next.js         | 16      | إطار العمل (SSR + API Routes + App Router) |
| TypeScript      | 5       | أمان الأنواع عبر المشروع كاملًا            |
| MUI             | 7       | مكتبة المكونات + دعم RTL                   |
| MongoDB         | —       | قاعدة البيانات                             |
| Mongoose        | —       | ODM + تعريف النماذج                        |
| JWT             | —       | توكن المصادقة عديم الحالة                  |
| bcrypt          | —       | تشفير كلمات المرور                         |
| Vitest          | —       | إطار الاختبارات                            |
| Testing Library | —       | اختبارات مكونات React                      |
| Cloudinary      | اختياري | تخزين الصور في الإنتاج                     |
| AWS S3          | اختياري | تخزين الصور البديل                         |

---

## التثبيت والتشغيل المحلي

### المتطلبات المسبقة

- Node.js >= 20
- npm >= 10
- MongoDB (محلي أو Atlas)

### خطوات التشغيل

```bash
# 1. استنساخ المستودع
git clone https://github.com/<user>/web-social-e1.git
cd web-social-e1

# 2. تثبيت الاعتماديات
npm install

# 3. إعداد المتغيرات البيئية
cp .env.example .env.local
# عدّل .env.local وأضف DATABASE_URL و JWT_SECRET

# 4أ. قاعدة بيانات محلية
npm run db:init

# 4ب. أو استخدم MongoDB Atlas — راجع docs/setup-local.md

# 5. تشغيل خادم التطوير
npm run dev
```

ثم افتح [http://localhost:3000](http://localhost:3000)

### المتغيرات البيئية الأساسية

| المتغير        | الوصف              | مثال                                      |
| -------------- | ------------------ | ----------------------------------------- |
| `DATABASE_URL` | رابط اتصال MongoDB | `mongodb://127.0.0.1:27017/web-social-e1` |
| `JWT_SECRET`   | مفتاح توقيع JWT    | سلسلة عشوائية طويلة                       |
| `STORAGE_TYPE` | نوع التخزين        | `local` \| `cloudinary` \| `s3`           |

للتفاصيل الكاملة: [docs/setup-local.md](docs/setup-local.md)

### Docker (تشغيل سريع مع MongoDB)

1. أنشئ ملف `.env` في جذر المشروع يحتوي على `JWT_SECRET` (انظر [`.env.docker.example`](.env.docker.example)).
2. نفّذ:

```bash
docker compose up --build
```

3. افتح [http://localhost:3000](http://localhost:3000) وتحقق من `/api/health`.

لبناء الصورة يدويًا أو النشر على **GitHub Container Registry**، راجع [docs/deployment.md](docs/deployment.md).

---

## هيكل المجلدات

```text
web-social-e1/
├── Dockerfile
├── docker-compose.yml
├── src/app/
│   ├── api/              ← REST API Routes (auth, photos, profile, health)
│   ├── components/       ← مكونات React (photos, profile, camera, layout, common)
│   ├── context/          ← AuthContext + ThemeContext
│   ├── hooks/            ← useAuth, useThemeMode, usePhotos, useMyPhotos, useCamera
│   ├── lib/              ← auth.ts, mongodb.ts, api.ts, storage/, apiErrors.ts
│   ├── models/           ← User.ts, Photo.ts, Like.ts
│   ├── repositories/     ← Repository Pattern (طبقة الوصول للبيانات)
│   ├── validators/       ← دوال التحقق من المدخلات
│   ├── utils/            ← دوال مساعدة
│   └── tests/            ← 27 ملف اختبار
├── docs/                 ← التوثيق الكامل
│   ├── plans/            ← خطة المشروع وخطة التوثيق
│   ├── ai/               ← دليل AI للمشروع
│   └── tutorials/        ← دروس تعليمية (قيد الإنشاء)
├── public/uploads/       ← ملفات التخزين المحلي
└── scripts/              ← سكربتات المساعدة (db:init, test-api)
```

---

## الأوامر المتاحة

| الأمر                   | الوصف                                           |
| ----------------------- | ----------------------------------------------- |
| `npm run dev`           | خادم التطوير (Webpack)                          |
| `npm run build`         | بناء للإنتاج                                    |
| `npm start`             | تشغيل خادم الإنتاج                              |
| `npm test`              | تشغيل الاختبارات مرة واحدة                      |
| `npm run test:watch`    | تشغيل الاختبارات في وضع المراقبة                |
| `npm run test:coverage` | تشغيل الاختبارات مع تقرير التغطية               |
| `npm run lint`          | فحص الكود بـ ESLint                             |
| `npm run format`        | تنسيق الكود بـ Prettier                         |
| `npm run format:check`  | التحقق من التنسيق فقط                           |
| `npm run validate`      | format:check + lint + test (فحص شامل قبل الدفع) |
| `npm run db:init`       | إنشاء قاعدة البيانات المحلية                    |

---

## الاختبارات

المشروع يحتوي **27 ملف اختبار** يغطي:

- الوحدات: دوال المصادقة، التحقق من المدخلات، عميل API، استراتيجيات التخزين
- المكونات: PhotoCard، PhotoGrid، CameraCapture، AvatarUploader، LikeButton، وغيرها
- الصفحات: login، register، not-found
- الخطافات: usePhotos، useMyPhotos، useCamera

```bash
npm test                    # تشغيل واحد
npm run test:watch          # watch mode
```

للتفاصيل: [docs/testing.md](docs/testing.md)

---

## النشر

**Docker:** `docker build -t web-social-e1:local .` ثم تمرير `DATABASE_URL` و`JWT_SECRET` وإعدادات التخزين عند `docker run` — التفاصيل في [docs/deployment.md](docs/deployment.md).

**Heroku:**

```bash
heroku config:set DATABASE_URL="mongodb+srv://..."
heroku config:set JWT_SECRET="your-secret"
heroku config:set STORAGE_TYPE=cloudinary
heroku config:set CLOUDINARY_URL="cloudinary://..."
git push heroku main
```

للدليل الكامل (Docker + Heroku + ghcr.io): [docs/deployment.md](docs/deployment.md)

---

## التوثيق

| الملف                                                                    | الموضوع                          |
| ------------------------------------------------------------------------ | -------------------------------- |
| [docs/api-endpoints.md](docs/api-endpoints.md)                           | جميع مسارات API مع أمثلة         |
| [docs/database-abstraction.md](docs/database-abstraction.md)             | نمط المستودعات وطبقة البيانات    |
| [docs/repository-quick-reference.md](docs/repository-quick-reference.md) | مرجع سريع لعمليات المستودعات     |
| [docs/storage-strategy.md](docs/storage-strategy.md)                     | Strategy Pattern للتخزين         |
| [docs/testing.md](docs/testing.md)                                       | استراتيجية الاختبار والتغطية     |
| [docs/deployment.md](docs/deployment.md)                                 | النشر: Docker و Heroku و ghcr.io |
| [docs/setup-local.md](docs/setup-local.md)                               | إعداد البيئة المحلية             |
| [docs/ai/README.md](docs/ai/README.md)                                   | دليل AI للمشروع                  |
| [docs/ai/architecture.md](docs/ai/architecture.md)                       | مخطط الطبقات وتدفق البيانات      |
| [docs/ai/feature-guide.md](docs/ai/feature-guide.md)                     | خطوات إضافة ميزة جديدة           |
| [docs/plans/project-plan.md](docs/plans/project-plan.md)                 | خطة المشروع المفصلة              |
| [docs/plans/documentation-plan.md](docs/plans/documentation-plan.md)     | خطة التوثيق الشامل               |

---

## المساهمة

راجع [CONTRIBUTING.md](CONTRIBUTING.md) لمعايير الكود وإرشادات الإيداع.

---

## سجل التغييرات

### v0.1.2 — Docker والنشر عبر الحاويات

- **docker:** `Dockerfile` متعدد المراحل مع Next.js `standalone`، مستخدم غير جذر، وفحص صحة (healthcheck).
- **compose:** `docker-compose.yml` للتطبيق + MongoDB 7 مع مجلد حجم للرفوعات المحلية.
- **ci:** سير عمل GitHub Actions لبناء الصورة ودفعها إلى `ghcr.io`.
- **docs:** تحديث [docs/deployment.md](docs/deployment.md) وملف مثال [`.env.docker.example`](.env.docker.example).

### v0.1.0 — جودة وتوثيق (220 اختبار)

- **auth:** اشتراط JWT_SECRET في الإنتاج مع fallback للتطوير فقط
- **refactor:** استخراج usePaginatedPhotos وتقليل التكرار في usePhotos و useMyPhotos
- **ui:** إصلاح ExpandableText و ResizeObserver mock وتنظيف تحذيرات lint
- **ui:** لف صفحات تسجيل الدخول والتسجيل بـ GuestRoute
- **test:** استقرار الاختبارات (مهلة، fixtures، PhotoCard)
- **docs:** توحيد أوامر الاختبار وإضافة test:coverage ودروس 07–11
- **style:** تطبيق Prettier على التوثيق والدروس

### v0.1.1 — تحسينات الأداء والبيئة

- إعداد قاعدة بيانات محلية: سكربت `db:init`
- إصلاح اتصال IPv6 بقاعدة البيانات
- تحسين تباين الواجهة وفق WCAG AA
- AppBar: شريط علوي بعرض كامل مع padding متجاوب
- إصلاح تحذيرات React 19 مع `SyntheticEvent<SubmitEvent>`
- إزالة Docker والإعداد المعقد لصالح بيئة تطوير مباشرة

### v0.1.0 — الهيكل الأولي

- إعداد مشروع Next.js مع TypeScript و MUI
- بنية المجلدات الكاملة
- ملفات الإعداد والجودة
- التوثيق الأساسي

---

**الترخيص:** MIT
