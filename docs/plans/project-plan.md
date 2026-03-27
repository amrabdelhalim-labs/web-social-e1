# خطة مشروع صوري — My Photos

> خطة تطوير شاملة ومفصلة لموقع مشاركة الصور.
> هذا الملف هو المرجع الأساسي لتطوير المشروع من البداية حتى النشر.
> يمكن تحديثه وتعديله مع تقدم التطوير.

---

## 1. هوية المشروع

| الحقل            | القيمة                                                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| الاسم العربي     | صوري                                                                                                                                  |
| الاسم الإنجليزي  | My Photos                                                                                                                             |
| مجلد المستودع    | `web-social-e1`                                                                                                                       |
| الوصف            | موقع ويب لمشاركة الصور يتيح للمستخدمين رفع الصور أو التقاطها (PNG/JPEG) مع عناوين وأوصاف، ومشاهدة صور الآخرين، والتفاعل معها بالإعجاب |
| نوع المشروع      | Full-Stack SSR (Next.js App Router)                                                                                                   |
| المنصة المستهدفة | الويب                                                                                                                                 |
| اللغة            | TypeScript (strict mode)                                                                                                              |
| واجهة المستخدم   | عربية (RTL)                                                                                                                           |
| الترخيص          | MIT                                                                                                                                   |

---

## 2. القرارات التقنية

| القرار         | الاختيار                                   | المبرر                                                                 |
| -------------- | ------------------------------------------ | ---------------------------------------------------------------------- |
| إطار العمل     | Next.js App Router                         | SSR + API routes في deploy واحد، أداء SEO ممتاز للصفحة الرئيسية العامة |
| قاعدة البيانات | MongoDB + Mongoose                         | مرونة عالية للبيانات، تكامل ممتاز مع Next.js                           |
| واجهة المستخدم | MUI + Emotion                              | مكتبة مكونات شاملة مع دعم RTL مدمج وتخصيص سهل                          |
| لغة البرمجة    | TypeScript (strict)                        | أمان الأنواع، تجربة تطوير أفضل، اكتشاف مبكر للأخطاء                    |
| المصادقة       | JWT (7 أيام) + bcrypt (12 rounds)          | بدون حالة، ملائم لبيئة serverless                                      |
| تخزين الصور    | Strategy Pattern (Local / Cloudinary / S3) | مرونة التبديل بين بيئات التطوير والإنتاج                               |
| إدارة الحالة   | React Context + Custom Hooks               | كافية للمشروع، لا حاجة لمكتبات خارجية                                  |
| التنسيق        | Prettier (standard config)                 | اتساق الكود عبر المشروع                                                |
| الاختبارات     | Vitest + Testing Library                   | سريع، حديث، متوافق مع Next.js                                          |
| النمط المعماري | Repository Pattern + Validators            | فصل طبقات الوصول للبيانات والتحقق                                      |
| الكاميرا       | getUserMedia API + input capture           | التقاط فوري للصور من المتصفح بدون مكتبات خارجية                        |
| النشر          | Heroku (auto-deploy من GitHub `main`)      | نشر تلقائي بعد كل push إلى `main` مع إدارة متغيرات البيئة من Heroku    |

### ما لا يحتاجه المشروع (حاليًا)

| الميزة                | السبب                                 |
| --------------------- | ------------------------------------- |
| i18n (تعدد اللغات)    | الواجهة عربية فقط                     |
| PWA / Service Worker  | لا حاجة للعمل بدون اتصال              |
| Push Notifications    | لا حاجة للإشعارات                     |
| Real-time (Socket.IO) | لا حاجة لتحديثات فورية                |
| Rich Text Editor      | الأوصاف نص عادي فقط                   |
| GitHub Actions CI/CD  | Heroku ينشر تلقائيًا من GitHub `main` |

---

## 3. تصميم قاعدة البيانات

### 3.1 نموذج المستخدم (User)

```text
User {
  _id:          ObjectId (auto)
  name:         String, required, trim, min 3, max 50
  email:        String, required, unique, lowercase, trim
  password:     String, required, min 6 (hashed)
  avatarUrl:    String, optional (URL from storage service, null = default avatar)
  createdAt:    Date (auto)
  updatedAt:    Date (auto)
}

Indexes:
  - email: unique
```

**ملاحظة على الصورة الشخصية:**

- `null` أو `undefined` → يُعرض avatar مُولَّد من الاسم (MUI Avatar fallback)
- قيمة موجودة → URL من Storage Service (local/cloudinary/s3)
- عند حذف الحساب: حذف ملف الصورة من التخزين (إذا وُجد) قبل حذف المستخدم

### 3.2 نموذج الصورة (Photo)

```text
Photo {
  _id:          ObjectId (auto)
  title:        String, required, trim, min 1, max 200
  description:  String, optional, trim, max 2000
  imageUrl:     String, required (URL or path from storage service)
  user:         ObjectId, ref: 'User', required
  likesCount:   Number, default 0 (cached counter for performance)
  createdAt:    Date (auto)
  updatedAt:    Date (auto)
}

Indexes:
  - user: 1 (query user's photos)
  - createdAt: -1 (sort by newest)
```

### 3.3 نموذج الإعجاب (Like)

```text
Like {
  _id:          ObjectId (auto)
  user:         ObjectId, ref: 'User', required
  photo:        ObjectId, ref: 'Photo', required
  createdAt:    Date (auto)
}

Indexes:
  - { user: 1, photo: 1 }: unique compound (prevent duplicate likes)
  - photo: 1 (query likes per photo)
```

### 3.4 العلاقات

```text
User  ──< Photo   (one-to-many: المستخدم يملك عدة صور)
User  ──< Like    (one-to-many: المستخدم يضع عدة إعجابات)
Photo ──< Like    (one-to-many: الصورة تملك عدة إعجابات)
```

### 3.5 استراتيجية عدد الإعجابات

- يُخزن `likesCount` مباشرة في نموذج الصورة لتجنب `count()` في كل طلب عرض
- يُحدّث عند كل toggle like/unlike باستخدام `$inc: { likesCount: +1 }` أو `$inc: { likesCount: -1 }`
- يضمن الفهرس المركب `{ user, photo }` عدم تكرار الإعجاب

---

## 4. تصميم واجهة API

### 4.1 نقاط المصادقة

| Method | Path                 | Auth | الوصف                                                             |
| ------ | -------------------- | ---- | ----------------------------------------------------------------- |
| POST   | `/api/auth/register` | —    | إنشاء حساب + **Set-Cookie** (`auth-token`) + `{ data: { user } }` |
| POST   | `/api/auth/login`    | —    | تسجيل دخول + cookie كما أعلاه                                     |
| POST   | `/api/auth/logout`   | —    | مسح cookie الجلسة                                                 |
| GET    | `/api/auth/me`       | جلسة | جلب بيانات المستخدم (cookie أو `Authorization: Bearer`)           |

### 4.2 نقاط الملف الشخصي

| Method | Path                    | Auth | الوصف                                             |
| ------ | ----------------------- | ---- | ------------------------------------------------- |
| PUT    | `/api/profile`          | جلسة | تحديث الاسم أو البريد الإلكتروني                  |
| PUT    | `/api/profile/password` | جلسة | تغيير كلمة المرور (يتطلب كلمة المرور الحالية)     |
| PUT    | `/api/profile/avatar`   | جلسة | رفع/تغيير صورة المستخدم (multipart + Magic Bytes) |
| DELETE | `/api/profile/avatar`   | جلسة | حذف صورة المستخدم (العودة إلى الافتراضي)          |
| DELETE | `/api/profile`          | جلسة | حذف الحساب نهائيًا (يتطلب كلمة المرور)            |

### 4.3 نقاط الصور

| Method | Path               | Auth | الوصف                                                     |
| ------ | ------------------ | ---- | --------------------------------------------------------- |
| GET    | `/api/photos`      | —    | جلب الصور العامة (مع pagination؛ `isLiked` عند وجود جلسة) |
| POST   | `/api/photos`      | جلسة | رفع صورة (multipart + **Magic Bytes** للتحقق من PNG/JPEG) |
| GET    | `/api/photos/mine` | جلسة | جلب صور المستخدم الحالي (مع pagination)                   |
| PUT    | `/api/photos/[id]` | جلسة | تعديل عنوان/وصف صورة (المالك فقط)                         |
| DELETE | `/api/photos/[id]` | جلسة | حذف صورة (المالك فقط) + حذف الملف + إعجابات مرتبطة        |

### 4.4 نقاط الإعجابات

| Method | Path                    | Auth | الوصف                       |
| ------ | ----------------------- | ---- | --------------------------- |
| POST   | `/api/photos/[id]/like` | جلسة | تبديل الإعجاب (like/unlike) |

### 4.5 نقطة الصحة

| Method | Path          | Auth | الوصف                        |
| ------ | ------------- | ---- | ---------------------------- |
| GET    | `/api/health` | —    | حالة التطبيق وقاعدة البيانات |

### 4.6 شكل الاستجابة الموحد

```typescript
// Response shapes — أشكال الاستجابة الموحدة
// Success:   { data: T, message?: string }
// Error:     { error: { code: string, message: string } }
// Paginated: { data: T[], pagination: { page, totalPages, total, limit } }
```

### 4.7 رفع الصور في Next.js

- يُستخدم `request.formData()` (Web API المدمجة)
- الحد الأقصى لحجم الملف: 5 ميجابايت
- الصيغ المسموحة: `image/png`, `image/jpeg`, `image/jpg`
- يُمرر Buffer الملف إلى Storage Service مباشرة
- عند الخطأ بعد الرفع، تُحذف الصورة المرفوعة (cleanup)
- تنطبق نفس القواعد على صور المنشورات **وصور الملف الشخصي (avatars)**

---

## 5. تصميم الصفحات والمكونات

### 5.1 الصفحات

#### الصفحة الرئيسية (`/`)

- **الحالة:** عامة (مرئية للجميع)
- **المحتوى:**
  - شريط علوي (AppBar) مع اسم التطبيق وزر تبديل الوضع (فاتح/داكن)
  - شبكة صور (PhotoGrid) تعرض أحدث الصور
  - كل صورة تعرض كمصغرة قابلة للضغط لتكبيرها (Lightbox)
  - أسفل كل صورة: العنوان + الوصف (مقتطع مع "عرض المزيد")
  - زر إعجاب مع عدد الإعجابات (العدد مرئي للجميع، الزر يعمل للمسجلين فقط)
  - تحميل المزيد عند التمرير أو زر "المزيد" (Pagination)
- **بيانات:** `GET /api/photos` (عام)

#### صفحة تسجيل الدخول (`/login`)

- **الحالة:** ضيوف فقط — إعادة توجيه المسجلين إلى `/`
- **المحتوى:**
  - نموذج: البريد الإلكتروني + كلمة المرور
  - تحقق فوري من المدخلات (client-side)
  - عرض رسائل الخطأ بوضوح (بريد خاطئ، كلمة مرور خاطئة)
  - رابط لصفحة إنشاء الحساب

#### صفحة إنشاء الحساب (`/register`)

- **الحالة:** ضيوف فقط — إعادة توجيه المسجلين إلى `/`
- **المحتوى:**
  - نموذج: الاسم + البريد الإلكتروني + كلمة المرور + تأكيد كلمة المرور
  - تحقق فوري (client-side)
  - بعد النجاح: تسجيل دخول تلقائي + إعادة توجيه إلى `/`

#### صفحة صوري (`/my-photos`)

- **الحالة:** محمية — مسجلي الدخول فقط
- **المحتوى:**
  - زر رفع صورة جديدة (FAB) → يفتح نموذج الرفع مع خيار **التقاط من الكاميرا**
  - شبكة صور المستخدم مع أزرار (تعديل، حذف)
  - حالة فارغة واضحة عند عدم وجود صور

#### صفحة الملف الشخصي (`/profile`)

- **الحالة:** محمية — مسجلي الدخول فقط
- **المحتوى:**
  - **قسم الصورة الشخصية:** Avatar دائري كبير مع أيقونة كاميرا عند التحويم
    - عند الضغط: اختر بين "رفع من الجهاز" أو "التقاط بالكاميرا"
    - معاينة فورية قبل الحفظ + زر "حذف الصورة" للعودة للافتراضي
  - **قسم البيانات الشخصية:** تعديل inline للحقول
    - الاسم (name) — مع تحقق: 3-50 حرف
    - البريد الإلكتروني — مع تحقق من الصيغة والتكرار
    - نمط التعديل: حقل نص قابل للتفعيل بالضغط على زر التعديل، تأكيد أو إلغاء
  - **قسم تغيير كلمة المرور:**
    - نموذج: كلمة المرور الحالية + الجديدة + تأكيد الجديدة
    - يُرسل دفعة واحدة بعد التحقق client-side
  - **منطقة الخطر (Danger Zone):** حذف الحساب
    - زر احمر → يفتح Dialog
    - يتطلب إدخال كلمة المرور للتأكيد
    - بعد الحذف: تسجيل خروج وإعادة توجيه إلى `/`
- **بيانات:** `GET /api/auth/me`

### 5.2 المكونات

```text
components/
├── layout/
│   ├── AppBar.tsx              ← شريط علوي: شعار + تنقل + ThemeToggle + avatar المستخدم
│   └── MainLayout.tsx          ← غلاف الصفحة: AppBar + محتوى رئيسي
├── common/
│   ├── ThemeToggle.tsx         ← زر تبديل الوضع الفاتح/الداكن
│   └── Loading.tsx             ← مؤشر تحميل
├── auth/
│   └── GuestRoute.tsx          ← يمنع المسجلين من رؤية صفحات الضيوف
├── camera/
│   └── CameraCapture.tsx       ← مكوّن الكاميرا المباشرة (stream → capture → Blob)
├── photos/
│   ├── PhotoCard.tsx           ← بطاقة موحدة: variant=public (إعجاب) | owner (تعديل/حذف)، عرض الناشر
│   ├── PhotoGrid.tsx           ← شبكة صور (variant + onEdit/onDelete لصفحة صوري)
│   ├── PhotoUploadForm.tsx     ← نموذج رفع صورة (ملف أو كاميرا)
│   ├── PhotoEditDialog.tsx     ← حوار تعديل العنوان والوصف
│   ├── PhotoDetailModal.tsx    ← نافذة التفاصيل الكاملة (عنوان + ناشر + وصف)
│   ├── DeleteConfirmDialog.tsx ← حوار تأكيد الحذف
│   ├── PhotoLightbox.tsx       ← عرض الصورة بحجمها الكامل (overlay)
│   ├── LikeButton.tsx          ← زر الإعجاب مع العدد (optimistic update)
│   ├── ExpandableText.tsx      ← نص مقتطع مع "عرض المزيد" (فقط عند الاقتطاع)
│   ├── OptimizedPhotoImage.tsx ← next/image مع priority للـ LCP
│   └── PhotoGridSkeleton.tsx   ← هيكل تحميل للشبكة
└── profile/
    ├── AvatarUploader.tsx      ← صورة المستخدم + أيقونة كاميرا + اختيار رفع/كاميرا
    ├── ProfileEditor.tsx       ← محرر البيانات الشخصية (inline editing)
    ├── ChangePasswordForm.tsx  ← نموذج تغيير كلمة المرور (3 حقول)
    ├── DeleteAccountDialog.tsx ← حوار حذف الحساب (password-protected)
    └── UserMenu.tsx            ← قائمة حساب: ضيف (تسجيل الدخول، إنشاء حساب) | مسجّل (ملفي، خروج)
```

### 5.3 التخطيط العام

```text
┌─────────────────────────────────────────────┐
│  AppBar                                     │
│  [صوري]          [صوري] [الوضع] [👤 Avatar] │
├─────────────────────────────────────────────┤
│                                             │
│  Main Content Area                          │
│                                             │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐   │
│  │ صورة │  │ صورة │  │ صورة │  │ صورة │   │
│  │      │  │      │  │      │  │      │   │
│  │العنوان│  │العنوان│  │العنوان│  │العنوان│   │
│  │الوصف │  │الوصف │  │الوصف │  │الوصف │   │
│  │♡ 12  │  │♥ 5   │  │♡ 0   │  │♡ 3   │   │
│  └──────┘  └──────┘  └──────┘  └──────┘   │
│                                             │
│               [تحميل المزيد]               │
│                                             │
└─────────────────────────────────────────────┘
```

### 5.4 صفحة الملف الشخصي (تفصيلي)

```text
┌─────────────────────────────────────────────┐
│  AppBar                                     │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─── صورتي الشخصية ───────────────────┐   │
│  │   [ 🖼️ Avatar ← أيقونة كاميرا ]    │   │
│  │   [رفع من الجهاز] [التقاط بالكاميرا]│   │
│  │   [حذف الصورة الحالية]              │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─── البيانات الشخصية ────────────────┐   │
│  │   الاسم:  [Ahmed Mohamed     ✏️]    │   │
│  │   البريد: [ahmed@email.com   ✏️]    │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─── تغيير كلمة المرور ───────────────┐   │
│  │   كلمة المرور الحالية: [________]  │   │
│  │   كلمة المرور الجديدة: [________]  │   │
│  │   تأكيد الجديدة:       [________]  │   │
│  │              [ تغيير كلمة المرور ] │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─── منطقة الخطر ─────────────────────┐   │
│  │  [ 🗑️ حذف حسابي نهائيًا ]          │   │
│  └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

### 5.5 التصميم المتجاوب

| الشاشة       | الأعمدة | ملاحظات                     |
| ------------ | ------- | --------------------------- |
| xs (< 600px) | 1       | عمود واحد، بطاقات بعرض كامل |
| sm (600px+)  | 2       | عمودان                      |
| md (900px+)  | 3       | ثلاثة أعمدة                 |
| lg (1200px+) | 4       | أربعة أعمدة                 |

---

## 6. مراحل التطوير

### المرحلة 1: الهيكل الأولي (Scaffold) ✅

**الهدف:** مشروع Next.js قابل للتشغيل مع كل ملفات الإعداد والتوثيق الأساسي.

**المخرجات (مكتملة):**

- بنية المجلدات الكاملة
- ملفات الإعداد: `tsconfig.json`, `.prettierrc.json`, `.gitattributes`, `eslint.config.mjs`, `vitest.config.ts`
- `package.json` مع جميع الاعتماديات والسكريبتات
- `.env.example` مع جميع المتغيرات
- `README.md` + `CONTRIBUTING.md` + `docs/ai/README.md`
- صفحة placeholder + health endpoint
- `scripts/format.mjs` + `scripts/validate-workflow.mjs`

**الإيداع:**

```text
feat(init): scaffold My Photos (صوري) project baseline
```

---

### المرحلة 2: طبقة البيانات والمصادقة ✅

**الهدف:** إنشاء النماذج، المستودعات، المُحققين، وسلسلة المصادقة.

**المهام:**

1. Mongoose models: `User` (مع `avatarUrl`), `Photo`, `Like`
2. Repository interface + BaseRepository (Mongoose)
3. UserRepository, PhotoRepository, LikeRepository
4. RepositoryManager singleton (`getRepositoryManager()`)
5. Validators: `validateRegisterInput`, `validateLoginInput`, `validatePhotoInput`, `validateUpdatePhotoInput`, `validateUpdateUserInput`, `validateChangePasswordInput`
6. `lib/auth.ts` — JWT (7 أيام) + bcrypt (12 rounds)
7. `lib/mongodb.ts` — اتصال singleton مع دعم `DATABASE_URL` / `MONGODB_URI` / `DB_URL`
8. `lib/apiErrors.ts` — استجابات خطأ موحدة بالعربية
9. `middlewares/auth.middleware.ts` — authenticateRequest()

**الإيداع:**

```text
feat(db): add Mongoose models, Repository Pattern, validators, and auth utilities
```

---

### المرحلة 3: طبقة التخزين (Storage Service) ✅

**الهدف:** بناء Storage Strategy Pattern لإدارة الملفات.

**المهام:**

1. `lib/storage/storage.interface.ts` — عقد الواجهة
2. `lib/storage/local.strategy.ts` — تخزين محلي في `public/uploads/`
3. `lib/storage/cloudinary.strategy.ts` — Cloudinary (CLOUDINARY_URL أو الحقول المنفصلة)
4. `lib/storage/s3.strategy.ts` — AWS S3
5. `lib/storage/storage.service.ts` — Factory Singleton (يختار حسب `STORAGE_TYPE`)

**ملاحظة:** الـ Storage Service يُستخدم لصور المنشورات **وصور الملف الشخصي (avatars)** معًا.

**الإيداع:**

```text
feat(storage): add pluggable storage service with local, Cloudinary, and S3 strategies
```

---

### المرحلة 4: نقاط API ✅

**الهدف:** تشغيل جميع نقاط API الخلفية.

**المهام:**

1. `POST /api/auth/register` — إنشاء حساب + cookie جلسة + `{ user }`
2. `POST /api/auth/login` — تسجيل دخول + cookie جلسة + `{ user }`
3. `POST /api/auth/logout` — مسح الجلسة
4. `GET /api/auth/me` — بيانات المستخدم الحالي
5. `PUT /api/profile` — تحديث name / email (تحقق من تكرار البريد)
6. `PUT /api/profile/password` — تغيير كلمة المرور (التحقق من الحالية + تشفير الجديدة)
7. `PUT /api/profile/avatar` — رفع صورة الملف الشخصي (formData → **Magic Bytes** → Storage → avatarUrl)
8. `DELETE /api/profile/avatar` — حذف صورة الملف الشخصي (storage.deleteFile + avatarUrl → null)
9. `DELETE /api/profile` — حذف الحساب (password confirmation → cascade delete: photos + likes + avatar file)
10. `GET /api/photos` — الصور العامة (paginated, مع حالة isLiked للمستخدم)
11. `POST /api/photos` — رفع صورة (formData → **Magic Bytes** → Storage Service)
12. `GET /api/photos/mine` — صور المستخدم الحالي
13. `PUT /api/photos/[id]` — تعديل عنوان/وصف (مالك فقط)
14. `DELETE /api/photos/[id]` — حذف صورة + ملف + إعجابات مرتبطة
15. `POST /api/photos/[id]/like` — toggle like/unlike
16. `GET /api/health` — فحص الصحة

**الإيداع:**

```text
feat(api): add auth, profile management, photos CRUD, and likes API routes
```

---

### المرحلة 5: البنية التحتية للعميل ✅

**الهدف:** الأساسيات: السمة، المصادقة، التخطيط، التنقل.

**المهام:**

1. `ThemeContext.tsx` — MUI theme مع dark/light + RTL + Cairo font + WCAG AA
2. `AuthContext.tsx` — حالة المستخدم في الذاكرة؛ جلسة عبر **HttpOnly cookie**؛ login/register/logout + updateUser
3. `src/proxy.ts` — حماية `/my-photos` و`/profile` قبل الرندر
4. `providers.tsx` — شجرة Providers
5. `useAuth.ts`, `useThemeMode.ts` — custom hooks
6. `lib/api.ts` — طبقة HTTP (بدون حقن Bearer؛ الـ cookie تُرسَل تلقائيًا) + `logoutApi`
7. `AppBar.tsx` — شريط علوي مع avatar المستخدم + UserMenu
8. `UserMenu.tsx` — قائمة dropdown: ضيف (تسجيل الدخول، إنشاء حساب) | مسجّل (ملفي، تسجيل خروج)
9. `MainLayout.tsx` — غلاف الصفحة
10. `ThemeToggle.tsx` — زر تبديل الوضع
11. `GuestRoute.tsx` — حماية صفحات الضيوف
12. `page.tsx` + `HomePageFeed.tsx` — الصفحة الرئيسية: RSC + عميل للتصفح

**الإيداع:**

```text
feat(ui): add theme system, auth context, layout, and client infrastructure
```

---

### المرحلة 6: صفحات المصادقة ✅

**الهدف:** صفحات تسجيل الدخول وإنشاء الحساب.

**المهام:**

1. `login/page.tsx` — نموذج مع التحقق ورسائل الخطأ
2. `register/page.tsx` — نموذج مع تأكيد كلمة المرور + تسجيل دخول تلقائي

**الإيداع:**

```text
feat(auth): add login and register pages with form validation
```

---

### المرحلة 7: الكاميرا (Hook مشترك) ✅

**الهدف:** بناء hook وmكوّن مشتركين لالتقاط الصور من الكاميرا، يُستخدمان في صفحتي الملف الشخصي وصوري.

**المهام:**

1. `hooks/useCamera.ts` — hook لإدارة الكاميرا:
   - `isSupported`: هل المتصفح يدعم `getUserMedia`؟
   - `isActive`: هل الكاميرا مفتوحة؟
   - `startCamera()`: فتح الكاميرا (`getUserMedia({ video: true })`)
   - `stopCamera()`: إيقاف الـ stream وإغلاق الكاميرا
   - `capturePhoto()`: التقاط الإطار الحالي → Canvas → Blob → File
   - `hasPermission`: حالة الإذن (`granted` / `denied` / `prompt`)
2. `components/camera/CameraCapture.tsx` — مكوّن UI مكتمل:
   - عرض الـ video stream بالكامل
   - زر التقاط (دائري كبير)
   - زر إلغاء / إغلاق
   - معاينة الصورة الملتقطة مع خياري "استخدام" أو "إعادة التقاط"
   - رسالة خطأ واضحة عند رفض إذن الكاميرا

**استراتيجية التوافق:**

- **Desktop/Android (Chrome/Firefox):** `getUserMedia` + Canvas
- **iOS Safari:** `<input type="file" accept="image/*" capture="environment">` كبديل (لا يدعم `getUserMedia` بنفس الطريقة)
- يكتشف `useCamera` تلقائيًا النوع المتاح

**الإيداع:**

```text
feat(camera): add useCamera hook and CameraCapture component for instant photo capture
```

---

### المرحلة 8: الصفحة الرئيسية ✅

**الهدف:** عرض الصور العامة مع الإعجابات والتكبير.

**المهام:**

1. `hooks/usePhotos.ts` — hook للصور (جلب، pagination، toggleLike بتحديث تفاؤلي)
2. `ExpandableText.tsx` — نص مقتطع مع "عرض المزيد" / "عرض أقل"
3. `LikeButton.tsx` — زر إعجاب (optimistic update + rollback)
4. `PhotoCard.tsx` — بطاقة صورة كاملة (عنوان، وصف، إعجاب، lightbox)
5. `PhotoGrid.tsx` — شبكة متجاوبة (xs:1, sm:2, md:3, lg:4)
6. `PhotoLightbox.tsx` — عرض الصورة الكامل في overlay
7. `page.tsx` (الرئيسية) — تركيب المكونات مع زر "تحميل المزيد"

**الإيداع:**

```text
feat(home): add public photo feed with grid, lightbox, likes, and pagination
```

---

### المرحلة 9: صفحة صوري ✅

**الهدف:** إدارة صور المستخدم مع دعم الكاميرا.

**المهام:**

1. `hooks/useMyPhotos.ts` — hook لجلب صور المستخدم، الرفع، التعديل، والحذف
2. `PhotoUploadForm.tsx` — نموذج رفع صورة مع **tab للاختيار:**
   - تبويب "رفع من الجهاز": file picker
   - تبويب "التقاط بالكاميرا": يفتح `<CameraCapture>` → صورة ملتقطة → معاينة → رفع
3. `PhotoEditDialog.tsx` — Dialog لتعديل العنوان والوصف
4. `DeleteConfirmDialog.tsx` — Dialog تأكيد الحذف
5. `PhotoCard` مع `variant="owner"` — بطاقة صورة المستخدم (قائمة تعديل/حذف في نفس موضع الإعجاب)
6. `my-photos/page.tsx` — صفحة محمية مع FAB و PhotoGrid (ProtectedRoute)

**الاختبارات المضافة (المراحل 7–9):**

- `useCamera.test.ts`, `CameraCapture.test.tsx` — المرحلة 7
- `usePhotos.test.ts`, `ExpandableText.test.tsx`, `LikeButton.test.tsx`, `PhotoCard.test.tsx`, `PhotoGrid.test.tsx`, `PhotoLightbox.test.tsx` — المرحلة 8
- `useMyPhotos.test.ts`, `PhotoUploadForm.test.tsx`, `PhotoEditDialog.test.tsx`, `DeleteConfirmDialog.test.tsx`, `PhotoCard.test.tsx` (variant=owner) — المرحلة 9
- `setup.ts` — mock لـ getUserMedia و Canvas (getContext, toBlob) لاختبارات الكاميرا

**تحديثات MUI (هجر الـ APIs المُهملة):**

- `PaperProps` → `slotProps.paper` (Dialog في PhotoLightbox)
- `inputProps` → `slotProps.htmlInput`، `InputProps` → `slotProps.input` (TextField في login, register, PhotoUploadForm, PhotoEditDialog)

**الإيداع:**

```text
feat(my-photos): add user gallery with photo upload, camera capture, edit, and delete
```

---

### المرحلة 10: صفحة الملف الشخصي ✅

**الهدف:** إدارة الحساب الكاملة (صورة، بيانات، كلمة مرور، حذف).

**المهام:**

1. `AvatarUploader.tsx` — صورة شخصية مع:
   - Overlay كاميرا عند التحويم
   - Menu عند الضغط: "رفع من الجهاز" + "التقاط بالكاميرا"
   - المصدران يُنتجان File يُرفع إلى `PUT /api/profile/avatar`
   - زر "حذف الصورة الحالية" → `DELETE /api/profile/avatar`
   - معاينة فورية (optimistic) قبل حفظ الخادم
2. `ProfileEditor.tsx` — تعديل inline للحقول:
   - الاسم والبريد: كل حقل قابل للتعديل بزر قلم
   - تأكيد بزر ✓ أو إلغاء بزر ✗
   - رسالة نجاح/خطأ عند كل حقل
3. `ChangePasswordForm.tsx` — نموذج 3 حقول
4. `DeleteAccountDialog.tsx` — Dialog احمر مع password input
5. `profile/page.tsx` — تجميع الأقسام

**الإيداع:**

```text
feat(profile): add profile page with avatar upload, camera capture, info edit, and account deletion
```

---

### المرحلة 11: التحسين والصقل

**الهدف:** تحسين تجربة المستخدم وإمكانية الوصول.

**المهام:**

1. حالات التحميل (Skeleton/Spinner) لجميع العمليات
2. حالات الخطأ المرئية (Snackbar/Alert)
3. صفحة 404 مخصصة
4. تحسين إمكانية الوصول: WCAG AA contrast ratios، focus management، aria labels
5. تحسين الأداء: Next.js Image component + `sizes` + `priority`
6. تنسيق الكود بـ Prettier

**الإيداع:**

```text
fix(ux): add loading states, error handling, 404 page, and accessibility improvements
```

---

### المرحلة 12: الاختبارات ✅

**الهدف:** تغطية اختبارية شاملة.

**المهام:**

1. اختبارات validators (register, login, photo, profile)
2. اختبارات repositories (User, Photo, Like)
3. اختبارات API routes (auth, profile, photos, likes)
4. اختبارات hooks (useAuth, useThemeMode, usePhotos, useCamera)
5. اختبارات مكونات (PhotoCard, LikeButton, forms, AvatarUploader)
6. اختبارات config + types

**الإيداع:**

```text
test: add comprehensive test suite for all layers
```

---

### المرحلة 13: التوثيق والنشر

**الهدف:** توثيق شامل + ضبط Heroku.

**المرجع:** راجع `docs/plans/documentation-plan.md` للخطة الكاملة.

**المهام:**

**مرحلة أ — التوثيقات الانتاجية ✅**

- [x] تحديث `README.md` الكامل (ميزات، هيكل، أوامر، روابط)
- [x] `docs/api-endpoints.md` — جميع مسارات API مع أمثلة
- [x] `docs/database-abstraction.md` — نمط المستودعات والنماذج
- [x] `docs/repository-quick-reference.md` — مرجع سريع لعمليات المستودعات
- [x] `docs/storage-strategy.md` — Strategy Pattern للتخزين
- [x] `docs/testing.md` — استراتيجية الاختبار وفهرس ملفات الاختبار
- [x] `docs/deployment.md` — خطوات النشر على Heroku

**مرحلة ب — توثيقات AI ✅**

- [x] `docs/ai/README.md` — تحديث عدد الاختبارات (27 ملف) + روابط
- [x] `docs/ai/architecture.md` — مخطط الطبقات + 4 تدفقات بيانات
- [x] `docs/ai/feature-guide.md` — دليل إضافة ميزة جديدة خطوة بخطوة

**مرحلة ج — التوثيقات التعليمية (قيد التنفيذ)**

- [ ] `docs/tutorials/README.md` — فهرس الدروس ومسارات التعلم
- [ ] `docs/tutorials/concepts-guide.md` — شرح المفاهيم التقنية
- [ ] `docs/tutorials/quick-reference.md` — مرجع سريع
- [ ] `docs/tutorials/lessons/01-11` — ١١ درسًا تعليميًا

**مرحلة د — النشر والتحقق**

- [ ] ربط تطبيق Heroku بمستودع GitHub (auto-deploy من `main`)
- [ ] تنفيذ اختبار حقيقي بعد النشر عبر `scripts/test-api.mjs`

**ملاحظة على النشر:**

- لا حاجة إلى GitHub Actions في هذا المشروع
- كل push إلى `main` يُشغّل نشرًا تلقائيًا على Heroku
- المتغيرات البيئية تُضبط من Heroku Config Vars
- يجب التحقق من `/api/health` ثم تشغيل اختبار API الحقيقي بعد كل نشر مهم

**الإيداع:**

```text
docs: add comprehensive documentation and deployment guide
```

---

## 7. هيكل المجلدات الكامل

```text
web-social-e1/
├── .env.example
├── .gitattributes
├── .gitignore
├── .prettierrc.json
├── .prettierignore
├── eslint.config.mjs
├── next.config.mjs
├── tsconfig.json
├── vitest.config.ts
├── package.json
├── README.md
├── CONTRIBUTING.md
├── LICENSE
│
├── scripts/
│   ├── format.mjs
│   └── validate-workflow.mjs
│
├── src/
│   ├── proxy.ts                    ← Proxy (حماية مسارات محددة)
│   └── app/
│       ├── layout.tsx              ← Root layout (html, dir=rtl, fonts, anti-FOUC script)
│       ├── page.tsx                ← RSC: التغذية العامة؛ عميل: HomePageFeed.tsx
│       ├── not-found.tsx           ← صفحة 404
│       ├── globals.css             ← الأنماط العامة
│       ├── config.ts               ← ثوابت التطبيق
│       ├── types.ts                ← جميع واجهات TypeScript
│       ├── providers.tsx           ← شجرة المزودين (Theme > Auth)
│       │
│       ├── login/page.tsx          ← صفحة تسجيل الدخول
│       ├── register/page.tsx       ← صفحة إنشاء الحساب
│       ├── my-photos/page.tsx      ← صفحة صور المستخدم
│       ├── profile/page.tsx        ← صفحة الملف الشخصي
│       │
│       ├── api/
│       │   ├── health/route.ts
│       │   ├── auth/
│       │   │   ├── login/route.ts
│       │   │   ├── register/route.ts
│       │   │   ├── logout/route.ts
│       │   │   └── me/route.ts
│       │   ├── profile/
│       │   │   ├── route.ts        ← PUT (update info) + DELETE (delete account)
│       │   │   ├── password/route.ts ← PUT (change password)
│       │   │   └── avatar/route.ts ← PUT (upload) + DELETE (reset)
│       │   └── photos/
│       │       ├── route.ts        ← GET (list) + POST (upload)
│       │       ├── mine/route.ts   ← GET (user's photos)
│       │       └── [id]/
│       │           ├── route.ts    ← PUT + DELETE
│       │           └── like/route.ts ← POST (toggle)
│       │
│       ├── components/
│       │   ├── layout/
│       │   │   ├── AppBar.tsx
│       │   │   └── MainLayout.tsx
│       │   ├── common/
│       │   │   ├── ThemeToggle.tsx
│       │   │   └── Loading.tsx
│       │   ├── auth/
│       │   │   └── GuestRoute.tsx
│       │   ├── camera/
│       │   │   └── CameraCapture.tsx   ← video stream + capture + preview
│       │   ├── photos/
│       │   │   ├── HomePageFeed.tsx  ← عميل: pagination الصفحة الرئيسية
│       │   │   ├── PhotoCard.tsx
│       │   │   ├── PhotoGrid.tsx
│       │   │   ├── PhotoUploadForm.tsx ← tab: ملف | كاميرا
│       │   │   ├── PhotoEditDialog.tsx
│       │   │   ├── DeleteConfirmDialog.tsx
│       │   │   ├── PhotoLightbox.tsx
│       │   │   ├── LikeButton.tsx
│       │   │   └── ExpandableText.tsx
│       │   └── profile/
│       │       ├── AvatarUploader.tsx  ← avatar + camera overlay + upload/capture menu
│       │       ├── ProfileEditor.tsx   ← inline field editing
│       │       ├── ChangePasswordForm.tsx
│       │       ├── DeleteAccountDialog.tsx
│       │       └── UserMenu.tsx        ← AppBar dropdown menu
│       │
│       ├── context/
│       │   ├── AuthContext.tsx         ← user في الذاكرة؛ جلسة HttpOnly cookie
│       │   └── ThemeContext.tsx
│       │
│       ├── hooks/
│       │   ├── useAuth.ts
│       │   ├── useThemeMode.ts
│       │   ├── usePhotos.ts            ← جلب + pagination + like
│       │   └── useCamera.ts            ← getUserMedia + capture + iOS fallback
│       │
│       ├── lib/
│       │   ├── api.ts                  ← fetchApi + typed helpers (جلسة عبر cookie)
│       │   ├── apiErrors.ts            ← استجابات خطأ موحدة بالعربية
│       │   ├── auth.ts                 ← JWT + bcrypt
│       │   ├── authCookie.ts           ← خيارات cookie الجلسة
│       │   ├── fileValidation.ts       ← Magic Bytes للصور
│       │   ├── photoSerializer.ts      ← تسلسل Photo مشترك (API + RSC)
│       │   ├── mongodb.ts              ← singleton connection
│       │   └── storage/
│       │       ├── storage.interface.ts
│       │       ├── storage.service.ts
│       │       ├── local.strategy.ts
│       │       ├── cloudinary.strategy.ts
│       │       └── s3.strategy.ts
│       │
│       ├── middlewares/
│       │   └── auth.middleware.ts      ← cookie ثم Bearer
│       │
│       ├── models/
│       │   ├── User.ts                 ← يشمل avatarUrl: String (optional)
│       │   ├── Photo.ts
│       │   └── Like.ts
│       │
│       ├── repositories/
│       │   ├── repository.interface.ts
│       │   ├── base.repository.ts
│       │   ├── user.repository.ts      ← findByEmail + deleteUserCascade
│       │   ├── photo.repository.ts     ← findByUser + search
│       │   ├── like.repository.ts      ← toggleLike + getLikeStatus
│       │   └── index.ts                ← RepositoryManager singleton
│       │
│       ├── validators/
│       │   └── index.ts                ← register, login, photo, updatePhoto, updateUser, changePassword
│       │
│       ├── utils/
│       │   └── date.ts                 ← تنسيق التواريخ بالعربية
│       │
│       └── tests/
│           └── setup.ts
│
├── public/
│   └── uploads/                    ← تخزين محلي للصور
│       └── .gitkeep
│
└── docs/
    ├── plans/
    │   ├── project-plan.md
    │   └── documentation-plan.md
    ├── ai/
    │   ├── README.md
    │   ├── architecture.md
    │   └── feature-guide.md
    ├── api-endpoints.md
    ├── database-abstraction.md
    ├── repository-quick-reference.md
    ├── storage-strategy.md
    ├── testing.md
    ├── deployment.md
    ├── setup-local.md
    └── tutorials/
        ├── README.md
        ├── concepts-guide.md
        ├── quick-reference.md
        └── lessons/
            └── 01-*.md … 11-*.md
```

---

## 8. المتغيرات البيئية

```text
# ─── Server ───────────────────────────────────────────────────────────
NODE_ENV=development
PORT=3000

# ─── Database ─────────────────────────────────────────────────────────
DATABASE_URL=mongodb://localhost:27017/myphotos
# Fallbacks: MONGODB_URI, DB_URL

# ─── Auth ─────────────────────────────────────────────────────────────
JWT_SECRET=your-secret-here-change-in-production

# ─── Storage ──────────────────────────────────────────────────────────
STORAGE_TYPE=local
# Options: local, cloudinary, s3
# يُستخدم لصور المنشورات وصور الملف الشخصي معًا

# Cloudinary (if STORAGE_TYPE=cloudinary)
# Option A (recommended): CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
# Option B (manual):
# CLOUDINARY_CLOUD_NAME=
# CLOUDINARY_API_KEY=
# CLOUDINARY_API_SECRET=
# CLOUDINARY_FOLDER=my-photos

# S3 (if STORAGE_TYPE=s3)
# AWS_S3_BUCKET=
# AWS_REGION=
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
```

---

## 9. نظام السمة (Theme)

### 9.1 الوضع الفاتح

| العنصر         | اللون     | التباين      |
| -------------- | --------- | ------------ |
| Primary        | `#1565c0` | AA+ على أبيض |
| Background     | `#f5f5f5` | —            |
| Paper          | `#ffffff` | —            |
| Text Primary   | `#0d1117` | AAA على أبيض |
| Text Secondary | `#24292f` | AA على أبيض  |

### 9.2 الوضع الداكن

| العنصر         | اللون     | التباين      |
| -------------- | --------- | ------------ |
| Primary        | `#42a5f5` | AA+ على داكن |
| Background     | `#121212` | —            |
| Paper          | `#1e1e1e` | —            |
| Text Primary   | `#e8eaed` | AAA على داكن |
| Text Secondary | `#b0b8c4` | AA على داكن  |

### 9.3 مبادئ التصميم

- جميع الألوان المخصصة: WCAG AA كحد أدنى (4.5:1)
- خط عربي: Cairo (Google Fonts)
- اتجاه RTL مع `@mui/stylis-plugin-rtl`
- منع FOUC عبر blocking script في `<head>` + خلفية فورية في `globals.css` حسب `data-color-scheme` (يمنع الوميض الأبيض في الوضع الداكن)

---

## 10. استراتيجية الاختبارات

| الطبقة       | النوع       | الأمثلة                                                |
| ------------ | ----------- | ------------------------------------------------------ |
| Validators   | Unit        | `validateRegisterInput`, `validateChangePasswordInput` |
| Repositories | Unit        | `UserRepo.findByEmail`, `LikeRepo.toggleLike`          |
| API Routes   | Integration | `PUT /api/profile`, `POST /api/photos`                 |
| Hooks        | Unit        | `useAuth()`, `usePhotos()`, `useCamera()`              |
| Components   | Component   | `PhotoCard`, `AvatarUploader`, `CameraCapture`         |
| Config/Types | Unit        | ثوابت، type guards                                     |

- Vitest + jsdom + @testing-library/react
- أسماء الاختبارات بالإنجليزية: `'should reject duplicate email'`
- Mock لـ: localStorage, matchMedia, fetch, getUserMedia

---

## 11. ملاحظات تقنية مهمة

### 11.1 رفع الصور في Next.js API Routes

```typescript
const formData = await request.formData();
const file = formData.get('photo') as File;
const buffer = Buffer.from(await file.arrayBuffer());
const storage = getStorageService();
const result = await storage.uploadFile({
  buffer,
  originalname: file.name,
  mimetype: file.type,
  size: file.size,
});
```

### 11.2 الكاميرا — useCamera Hook

```typescript
// useCamera — core implementation pattern
// فتح الكاميرا
const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });

// التقاط صورة من video element
const canvas = document.createElement('canvas');
canvas.width = video.videoWidth;
canvas.height = video.videoHeight;
canvas.getContext('2d')!.drawImage(video, 0, 0);
const blob = await new Promise<Blob>((resolve) => canvas.toBlob(resolve!, 'image/jpeg', 0.9));
const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });

// إيقاف الكاميرا
stream.getTracks().forEach((track) => track.stop());
```

**التوافق:**

- Chrome/Firefox/Edge (Desktop + Android): `getUserMedia` مدعوم
- Safari iOS: يُستخدم `<input type="file" accept="image/*" capture="environment">` كبديل مباشر
- `useCamera.isSupported` يكتشف تلقائيًا الدعم

**أماكن الاستخدام:**

1. `PhotoUploadForm` (صفحة صوري) — تبويب "التقاط بالكاميرا"
2. `AvatarUploader` (صفحة الملف الشخصي) — خيار "التقاط بالكاميرا"

### 11.3 صورة الملف الشخصي (Avatar)

- `avatarUrl: null` → `<Avatar>` يعرض الحروف الأولى من الاسم (MUI fallback)
- عند الرفع: Storage Service → URL → تحديث `avatarUrl` في DB → تحديث `user` في AuthContext
- عند الحذف: حذف الملف من Storage → تعيين `avatarUrl = null` في DB
- عند حذف الحساب: يُحذف الـ avatar أولاً ثم الصور ثم الحساب (cascade)
- التحديث الفوري: `AuthContext.updateUser()` يُحدّث state العميل بدون reload

### 11.4 حماية المسارات (Client-side)

- `GuestRoute` → يعيد توجيه المسجلين إلى `/`
- `/my-photos` و `/profile` → يعيدان توجيه غير المسجلين إلى `/login`
- API routes → `authenticateRequest()` تُرجع 401 مع رسالة عربية

### 11.4.1 قائمة المستخدم (UserMenu) — حالتان

- **ضيف:** أيقونة AccountCircle → قائمة: تسجيل الدخول، إنشاء حساب
- **مسجّل:** أيقونة Avatar → قائمة: الاسم والبريد، ملفي الشخصي، تسجيل الخروج

### 11.5 الإعجاب التفاؤلي

1. تحديث العدد + حالة الزر فورًا في الواجهة
2. إرسال الطلب للخادم
3. عند الفشل: إرجاع القيمة السابقة (rollback)

### 11.6 حذف الصورة أو الحساب (Cascade)

**حذف صورة منشور:**

1. حذف إعجابات الصورة (`Like.deleteMany({ photo: id })`)
2. حذف الملف من التخزين (`storage.deleteFile(imageUrl)`)
3. حذف سجل الصورة

**حذف الحساب:**

1. التحقق من كلمة المرور
2. جمع جميع صور المنشورات + ملف الـ avatar
3. حذف جميع البيانات (photos, likes, user) بعملية آمنة
4. حذف جميع ملفات التخزين bulk
5. تسجيل خروج العميل + إعادة توجيه

**ملاحظة — MongoDB Standalone:**

- `deleteUserCascade` يستخدم transactions عند توفر Replica Set
- عند تشغيل MongoDB standalone (مثل التطوير المحلي): fallback تلقائي لعمليات متسلسلة بدون transaction (كود 20: IllegalOperation)
- يضمن عمل حذف الحساب في بيئة التطوير والإنتاج

### 11.7 ExpandableText وارتفاع البطاقات

- **"عرض المزيد":** يظهر فقط عند اقتطاع النص فعلياً (scrollHeight > clientHeight)
- **حد أدنى للنص:** `DESCRIPTION_TRUNCATE_MIN_CHARS = 100` — النصوص الأقصر لا تعرض الزر
- **ارتفاع مرن:** لا يوجد حد أدنى لارتفاع البطاقة — الارتفاع يتكيف مع المحتوى

### 11.8 عرض الناشر و LCP

- **الناشر:** PhotoCard و PhotoDetailModal يعرضان Avatar + "نشرها {الاسم}" من `photo.user`
- **LCP:** OptimizedPhotoImage يدعم `priority` — الصورة الأولى في الشبكة تُحمّل بـ `loading="eager"` لتحسين Largest Contentful Paint

### 11.9 النشر على Heroku

- لا يوجد GitHub Actions — Heroku متصل مباشرةً بفرع `main` على GitHub
- كل push إلى `main` → نشر إنتاجي تلقائي
- المتغيرات البيئية تُدار من Heroku Config Vars
- `STORAGE_TYPE=cloudinary` موصى به في الإنتاج (الصور لا تُفقد عند إعادة النشر)
- حزم التخزين السحابية (`cloudinary`, `@aws-sdk/client-s3`) موجودة كـ `optionalDependencies` ويجب أن تبقى مثبتة في بيئة الإنتاج
- عند استخدام MongoDB Atlas يجب أن تكون كلمة مرور `DATABASE_URL` مرمّزة URL-encoding إذا احتوت رموزًا خاصة (مثل `&`, `%`, `#`, `$`)
- مسار التحقق بعد النشر:
  1. `GET /api/health` يجب أن يعرض `database=connected` و `storage.healthy=true`
  2. تشغيل `node scripts/test-api.mjs <heroku-app-url>` للتحقق الحقيقي من التسجيل/المصادقة/الرفع/الحذف

---

## 12. Checklist الإيداع الأول

**المراحل المكتملة (1–9):**

- [x] المرحلة 1: البنية الأساسية
- [x] المرحلة 2: طبقة البيانات والمصادقة
- [x] المرحلة 3: طبقة التخزين
- [x] المرحلة 4: نقاط API
- [x] المرحلة 5: البنية التحتية للعميل
- [x] المرحلة 6: صفحات المصادقة
- [x] المرحلة 7: الكاميرا (useCamera + CameraCapture)
- [x] المرحلة 8: الصفحة الرئيسية (usePhotos + شبكة الصور + lightbox + إعجاب)
- [x] المرحلة 9: صفحة صوري (useMyPhotos + رفع + تعديل + حذف)

**المراحل المتبقية:** 13-ج (التوثيق التعليمي)، 13-د (النشر والتحقق)

- [x] بنية المجلدات كاملة
- [x] `package.json` مع الاعتماديات والسكريبتات + `engines`
- [x] `tsconfig.json` (strict mode)
- [x] `.prettierrc.json` + `.prettierignore`
- [x] `.gitattributes` (LF enforcement)
- [x] `eslint.config.mjs`
- [x] `vitest.config.ts`
- [x] `.env.example`
- [x] `next.config.mjs`
- [x] `README.md` أساسي
- [x] `CONTRIBUTING.md`
- [x] `docs/ai/README.md`
- [x] `docs/plans/project-plan.md`
- [x] `scripts/format.mjs`
- [x] `scripts/validate-workflow.mjs`
- [x] `src/app/layout.tsx` (root مع anti-FOUC)
- [x] `src/app/page.tsx` (الصفحة الرئيسية — عرض الصور العامة)
- [x] `src/app/globals.css`
- [x] `src/app/api/health/route.ts`
- [x] `src/app/tests/setup.ts`
- [x] `public/uploads/.gitkeep`

---

_هذه الخطة قابلة للتحديث مع تقدم التطوير._
_آخر تحديث: مارس 2026 — اكتمال مرحلة التوثيق أ (التوثيقات الانتاجية) وب (توثيقات AI)_
