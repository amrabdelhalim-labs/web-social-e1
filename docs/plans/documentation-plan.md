# خطة التوثيق الشامل — مشروع صوري 📷

> **المستودع:** `web-social-e1`
> **الإصدار:** `v0.1.0`
> **الحالة:** مرحلة التوثيق — التطوير مكتمل
> **تاريخ الإنشاء:** مارس ٢٠٢٦

---

## جدول المحتويات

1. [الرؤية والأهداف](#1-الرؤية-والأهداف)
2. [أنواع التوثيق](#2-أنواع-التوثيق)
3. [البنية المستهدفة](#3-البنية-المستهدفة)
4. [التوثيقات الانتاجية — التفاصيل والترتيب](#4-التوثيقات-الانتاجية--التفاصيل-والترتيب)
5. [التوثيقات التعليمية — التفاصيل والترتيب](#5-التوثيقات-التعليمية--التفاصيل-والترتيب)
6. [الجرد الموجز لملفات المشروع](#6-الجرد-الموجز-لملفات-المشروع)
7. [استراتيجية الربط التبادلي](#7-استراتيجية-الربط-التبادلي)
8. [معايير الجودة والمراجعة](#8-معايير-الجودة-والمراجعة)
9. [خطة التنفيذ والإيداعات](#9-خطة-التنفيذ-والإيداعات)

---

## 1. الرؤية والأهداف

### المبدأ التوجيهي

> تخيل نفسك في مقام مدرّس ذي خبرة عالية تساعد مبتدئًا يتعامل مع هذا المشروع لأول مرة، وتعطيه مفاهيم عميقة مستنبطة من الكود.

### الأهداف

| الهدف | الوصف |
|-------|-------|
| **شمولية كاملة** | توثيق كل ملف في المشروع بترتيب منطقي مبني على المعمارية وتدفق التنفيذ |
| **نوعان متكاملان** | توثيقات تعليمية (للتعلم) + توثيقات انتاجية (للمرجعية والنشر) |
| **ربط سلس** | كل وثيقة تربط بالوثائق ذات العلاقة ذهابًا وإيابًا |
| **استقلالية** | كل وثيقة مكتفية بذاتها — لا إحالة لمشاريع خارجية |
| **ثنائية اللغة المنهجية** | النثر بالعربية، أسماء الملفات بالإنجليزية، الكود كما هو مع تعليقات عربية |

### الجمهور المستهدف

| النوع | الجمهور | مستوى الخبرة |
|-------|---------|-------------|
| **التعليمي** | مطور مبتدئ يتعلم بناء تطبيقات ويب حقيقية | مبتدئ → متوسط |
| **الانتاجي** | مطور يريد فهم المشروع أو المساهمة فيه أو نشره | متوسط → متقدم |
| **AI** | أدوات الذكاء الاصطناعي التي تعدل الكود | — |

### نطاق المشروع

صوري تطبيق ويب Full-Stack SSR بواجهة عربية. يتيح للمستخدمين رفع صور PNG/JPEG أو التقاطها مباشرة من الكاميرا، مع عناوين وأوصاف. يدعم مشاهدة صور المجتمع، الإعجاب، وإدارة الملف الشخصي. التخزين قابل للتبديل عبر Strategy Pattern (محلي / Cloudinary / S3).

---

## 2. أنواع التوثيق

### ٢.١ التوثيقات الانتاجية (Production Documentation)

توثيقات مرجعية تقنية تخدم المطور الذي يريد فهم المشروع بسرعة، المساهمة فيه، أو نشره.

| الملف | الغرض | اللغة |
|-------|-------|-------|
| `README.md` (جذر المشروع) | بطاقة المشروع + التثبيت + الأوامر + البنية | عربي + إنجليزي |
| `docs/api-endpoints.md` | جميع مسارات API مع أمثلة طلبات واستجابات | عربي |
| `docs/database-abstraction.md` | شرح نمط المستودعات وطبقة البيانات | عربي |
| `docs/repository-quick-reference.md` | مرجع سريع لعمليات المستودعات | عربي |
| `docs/storage-strategy.md` | Strategy Pattern للتخزين (local/Cloudinary/S3) | عربي |
| `docs/testing.md` | استراتيجية الاختبار + الأوامر + التغطية | عربي |
| `docs/deployment.md` | خطوات النشر على Heroku + المتغيرات البيئية | عربي |
| `docs/setup-local.md` | موجود — إعداد البيئة المحلية | عربي |
| `docs/ai/README.md` | موجود — بطاقة هوية المشروع + القواعد الحاسمة | إنجليزي |
| `docs/ai/architecture.md` | مخطط الطبقات + الأنماط + تدفق البيانات | إنجليزي |
| `docs/ai/feature-guide.md` | دليل إضافة ميزة جديدة خطوة بخطوة | إنجليزي |

### ٢.٢ التوثيقات التعليمية (Educational Tutorials)

دروس تفصيلية تشرح كل ملف في المشروع بترتيب منطقي (الأساسيات ثم الطبقات ثم سيناريوهات التشغيل ثم الاختبارات).

| الملف | الغرض |
|-------|-------|
| `docs/tutorials/README.md` | فهرس الدروس + لمحة تقنية + مسارات التعلم |
| `docs/tutorials/concepts-guide.md` | شرح كل مفهوم تقني من الصفر للمبتدئ |
| `docs/tutorials/quick-reference.md` | مرجع سريع + جداول الأوامر + روابط لكل درس |
| `docs/tutorials/lessons/01-*.md` → `11-*.md` | ١١ درسًا تعليميًا (تفاصيل في القسم ٥) |

---

## 3. البنية المستهدفة

```text
web-social-e1/
├── README.md
├── CONTRIBUTING.md
│
├── docs/
│   ├── plans/
│   │   ├── project-plan.md
│   │   └── documentation-plan.md
│   │
│   ├── api-endpoints.md
│   ├── database-abstraction.md
│   ├── repository-quick-reference.md
│   ├── storage-strategy.md
│   ├── testing.md
│   ├── deployment.md
│   ├── setup-local.md
│   │
│   ├── ai/
│   │   ├── README.md
│   │   ├── architecture.md
│   │   └── feature-guide.md
│   │
│   └── tutorials/
│       ├── README.md
│       ├── concepts-guide.md
│       ├── quick-reference.md
│       └── lessons/
│           ├── 01-project-setup.md
│           ├── 02-database-models.md
│           ├── 03-repository-pattern.md
│           ├── 04-authentication.md
│           ├── 05-storage-strategy.md
│           ├── 06-api-routes.md
│           ├── 07-theme-and-layout.md
│           ├── 08-auth-pages.md
│           ├── 09-photos-crud.md
│           ├── 10-profile.md
│           └── 11-testing.md
```

---

## 4. التوثيقات الانتاجية — التفاصيل والترتيب

### مرحلة ٤-أ: `README.md` (جذر المشروع)

**المحتوى المطلوب:**

```markdown
# (README structure — Arabic headings below)
# صوري — موقع مشاركة الصور 📷

## لمحة عامة
## الميزات الرئيسية
## الحزمة التقنية (جدول)
## التثبيت والتشغيل المحلي
  - المتطلبات المسبقة
  - الاستنساخ والتثبيت
  - إعداد المتغيرات البيئية
  - تشغيل خادم التطوير
## هيكل المجلدات (شجرة مبسطة)
## الأوامر المتاحة (جدول: dev, build, test, format, lint)
## الاختبارات
## النشر (Heroku)
## التوثيق (روابط لكل ملف في docs/)
## المساهمة (رابط CONTRIBUTING.md)
## الترخيص
```

### مرحلة ٤-ب: التوثيقات التقنية

**ترتيب الكتابة:**

| الترتيب | الملف | يغطي | يعتمد على |
|---------|-------|-------|-----------|
| 1 | `api-endpoints.md` | مسارات API + أمثلة الطلبات والاستجابات + رموز الأخطاء | — |
| 2 | `database-abstraction.md` | ٣ نماذج + نمط المستودعات + الطبقات | `api-endpoints.md` |
| 3 | `repository-quick-reference.md` | عمليات المستودعات مع أمثلة كود | `database-abstraction.md` |
| 4 | `storage-strategy.md` | واجهة التخزين + local/Cloudinary/S3 + Factory | — |
| 5 | `testing.md` | استراتيجية + إعداد Vitest + أوامر | — |
| 6 | `deployment.md` | Heroku + المتغيرات البيئية + الإعداد + المراقبة | `testing.md` |

### مرحلة ٤-ج: توثيقات AI (`docs/ai/`)

| الملف | المحتوى |
|-------|---------|
| `README.md` | موجود — تحديث عدد الاختبارات وروابط architecture/feature-guide |
| `architecture.md` | مخطط الطبقات (ASCII)، كل طبقة مع أنماطها، تدفق البيانات: رفع صورة، تسجيل دخول، toggle like، حذف حساب |
| `feature-guide.md` | خطوات لإضافة كيان/ميزة جديدة: نموذج → مستودع → تحقق → API Route → خطاف → مكون → اختبار |

---

## 5. التوثيقات التعليمية — التفاصيل والترتيب

### ٥.١ المبادئ الأساسية للدروس

| المبدأ | التفصيل |
|--------|---------|
| **هدف الدرس** | كل درس يبدأ بـ blockquote: `> هدف الدرس: ...` |
| **من البسيط إلى المعقد** | كل قسم يبدأ بالمفهوم ثم التنفيذ ثم الحالات الحدية |
| **تشبيه واحد على الأقل** | لكل نمط مجرد تشبيه محلي طبيعي يقرب المفهوم |
| **جدول واحد على الأقل** | كل درس يحتوي جدولًا واحدًا على الأقل |
| **الكود كما هو** | كتل الكود تُنسخ من المصدر مع تعليقات عربية |
| **ملخص** | كل درس ينتهي بقسم "ملخص" مع جدول |
| **استقلالية** | لا إحالة لمشاريع خارجية في النص |
| **الاختبار آخرًا** | درس الاختبار هو الأخير (درس ١١) |

### ٥.٢ قالب الدرس

```markdown
# الدرس XX: [عنوان الدرس بالعربية]

> هدف الدرس: [جملة واحدة]

---

## 1. [المفهوم الأول]
### ١.١ [الفكرة]
### ١.٢ [التنفيذ في صوري]
### ١.٣ [شرح الكود سطرًا بسطر]

## X. ملخص

| ما تعلمناه | الملف المسؤول |
|------------|--------------|
| ... | ... |

---
*الدرس التالي → [رابط]*
```

### ٥.٣ فهرس الدروس (١١ درسًا)

| # | عنوان الدرس | الملفات المشمولة |
|---|------------|------------------|
| 01 | إعداد المشروع والبنية الأساسية | `package.json`, `tsconfig.json`, `next.config.mjs`, `eslint.config.mjs`, `vitest.config.ts`, `layout.tsx`, `providers.tsx`, `config.ts`, `globals.css` |
| 02 | نماذج قاعدة البيانات | `User.ts`, `Photo.ts`, `Like.ts`, `mongodb.ts`, `types.ts` |
| 03 | نمط المستودعات | `repository.interface.ts`, `base.repository.ts`, `user.repository.ts`, `photo.repository.ts`, `like.repository.ts`, `index.ts` |
| 04 | المصادقة والحماية | `auth.ts`, `validators/index.ts`, `auth.middleware.ts`, `api/auth/*`, `apiErrors.ts`, `AuthContext.tsx`, `useAuth.ts`, `GuestRoute.tsx`, `ProtectedRoute.tsx` |
| 05 | استراتيجية التخزين | `storage.interface.ts`, `storage.service.ts`, `local.strategy.ts`, `cloudinary.strategy.ts`, `s3.strategy.ts` |
| 06 | مسارات API | `api/health`, `api/auth`, `api/profile`, `api/photos`, `lib/api.ts` |
| 07 | نظام السمات والتخطيط | `ThemeContext.tsx`, `useThemeMode.ts`, `ThemeToggle.tsx`, `AppBar.tsx`, `UserMenu.tsx`, `MainLayout.tsx` |
| 08 | صفحات المصادقة | `AuthFormLayout.tsx`, `PasswordField.tsx`, `SubmitButton.tsx`, `login/page.tsx`, `register/page.tsx` |
| 09 | واجهة الصور (CRUD + الإعجاب) | `useCamera.ts`, `CameraCapture.tsx`, `PhotoUploadForm.tsx`, `PhotoCard.tsx`, `PhotoGrid.tsx`, `PhotoEditDialog.tsx`, `PhotoDetailModal.tsx`, `PhotoLightbox.tsx`, `LikeButton.tsx`, `ExpandableText.tsx`, `OptimizedPhotoImage.tsx`, `usePhotos.ts`, `useMyPhotos.ts`, `page.tsx`, `my-photos/page.tsx` |
| 10 | الملف الشخصي | `AvatarUploader.tsx`, `ProfileEditor.tsx`, `ChangePasswordForm.tsx`, `DeleteAccountDialog.tsx`, `profile/page.tsx` |
| 11 | الاختبارات الشاملة | `setup.ts`, `utils.tsx`, جميع ملفات `tests/*.test.{ts,tsx}` |

### ٥.٤ الملفات المساندة

| الملف | المحتوى |
|-------|---------|
| `tutorials/README.md` | فهرس الدروس + لمحة تقنية + مسارات التعلم |
| `tutorials/concepts-guide.md` | شرح المفاهيم: Next.js, TypeScript, MongoDB, Repository Pattern, JWT, Strategy Pattern, getUserMedia, Vitest |
| `tutorials/quick-reference.md` | خريطة الملفات، أوامر npm، مسارات API، روابط الدروس |

---

## 6. الجرد الموجز لملفات المشروع

### ٦.١ ملفات المصدر (حسب الطبقات)

| الطبقة | عدد الملفات | أمثلة |
|--------|-------------|-------|
| المكونات | ~25 | PhotoCard, PhotoGrid, UserMenu, AvatarUploader |
| الخطافات | 5 | useAuth, useThemeMode, usePhotos, useMyPhotos, useCamera |
| السياقات | 2 | AuthContext, ThemeContext |
| المكتبات | ~10 | api.ts, auth.ts, mongodb.ts, storage/* |
| النماذج | 3 | User, Photo, Like |
| المستودعات | 6 | user, photo, like, base, interface, index |
| مسارات API | 11 | auth, profile, photos, health |
| الصفحات | 6 | page, login, register, my-photos, profile, not-found |
| المحققون | 1 | validators/index.ts |
| توثيقات AI وإرشادات المشروع | 4 | docs/ai/README, architecture, feature-guide, CONTRIBUTING |

### ٦.٢ الاختبارات

| الفئة | عدد الملفات |
|-------|-------------|
| اختبارات الوحدة | ~25 |
| إعداد | setup.ts, utils.tsx |

### ٦.٣ حالة التوثيق الحالية (تنفيذ فعلي)

| المسار | الحالة |
|--------|--------|
| التوثيقات الانتاجية (`docs/*.md`) | مكتملة |
| توثيقات AI (`docs/ai/*.md`) | مكتملة |
| بنية الدروس (`tutorials/README`, `concepts-guide`, `quick-reference`) | مكتملة |
| الدروس التعليمية المنفذة | 01 → 06 |
| الدروس المتبقية | 07 → 11 |

---

## 7. استراتيجية الربط التبادلي

### ٧.١ الربط بين التوثيقات التعليمية

| من | إلى | النوع |
|----|-----|-------|
| كل درس | `tutorials/README.md` | رابط "العودة إلى الفهرس" |
| كل درس | الدرس السابق والتالي | "الدرس السابق" + "الدرس التالي →" |
| كل درس يذكر مفهومًا | `concepts-guide.md#القسم` | رابط مضمّن |
| `tutorials/README.md` | كل درس | جدول فهرس الدروس |
| `quick-reference.md` | كل درس | خريطة الملفات + روابط |

### ٧.٢ الربط بين التوثيقات الانتاجية

| من | إلى | النوع |
|----|-----|-------|
| `README.md` | كل ملف في `docs/` | قسم "التوثيق" |
| `api-endpoints.md` | `database-abstraction.md` | عند ذكر النماذج |
| `database-abstraction.md` | `repository-quick-reference.md` | "لمرجع سريع ←" |
| `storage-strategy.md` | `deployment.md` | عند ذكر STORAGE_TYPE |
| `testing.md` | الملفات الأخرى | عند ذكر ما يُختبر |

### ٧.٣ الربط بين التعليمي والانتاجي

| من (تعليمي) | إلى (انتاجي) | متى |
|-------------|-------------|-----|
| درس ٠٦ (API) | `api-endpoints.md` | "للمرجع الكامل ←" |
| درس ٠٣ (Repository) | `database-abstraction.md`, `repository-quick-reference.md` | "للمرجع التقني ←" |
| درس ٠٥ (Storage) | `storage-strategy.md` | "للدليل التقني ←" |
| درس ١١ (Testing) | `testing.md` | "لاستراتيجية الاختبار ←" |
| أي درس | `CONTRIBUTING.md` | عند ذكر معايير الكود |

---

## 8. معايير الجودة والمراجعة

### ٨.١ قائمة التحقق لكل ملف توثيق

- [ ] النثر بالعربية، الكود بالإنجليزية مع تعليقات عربية
- [ ] لا إحالة لمشاريع خارجية
- [ ] **توافق الرموز**: في النثر العربي استخدم الرموز العربية؛ في كتل الكود استخدم الرموز اللاتينية
- [ ] **أول سطر في أي بلوكة كود لاتيني (LTR)**: السطر الأول بعد فتح البلوكة يجب أن يكون كوداً أو تعليقاً لاتينياً (مثل `//` أو `import` أو `{`) حتى لا يُفسَّر المحتوى كاتجاه RTL في المحررات والعرض؛ التعليقات العربية تأتي في الأسطر التالية إن لزم
- [ ] اسم التطبيق **صوري** في النثر (وليس `web-social-e1`)
- [ ] جميع الروابط التبادلية تعمل
- [ ] مسافات بادئة ٢ (تتوافق مع Prettier)
- [ ] لا كتل كود بدون سياق عربي

### ٨.٢ قائمة التحقق للدروس التعليمية

- [ ] يبدأ بـ `> هدف الدرس: ...`
- [ ] يحتوي تشبيهًا واحدًا على الأقل
- [ ] يحتوي جدولًا واحدًا على الأقل
- [ ] ينتهي بقسم "ملخص" مع جدول
- [ ] رابط "الدرس السابق" و"الدرس التالي" في الأسفل

### ٨.٣ قائمة التحقق لتوثيقات AI

- [ ] مكتوبة بالإنجليزية بالكامل
- [ ] تحتوي عدد الاختبارات الحالي
- [ ] تحتوي أوامر التشغيل والاختبار
- [ ] تحتوي مسارات الملفات الحرجة

---

## 9. خطة التنفيذ والإيداعات

### مراحل التنفيذ

```text
# Phase A: Production docs (Arabic labels below)
المرحلة أ: التوثيقات الانتاجية
    ├── أ.١  README.md (تحديث شامل)
    ├── أ.٢  docs/api-endpoints.md
    ├── أ.٣  docs/database-abstraction.md
    ├── أ.٤  docs/repository-quick-reference.md
    ├── أ.٥  docs/storage-strategy.md
    ├── أ.٦  docs/testing.md
    └── أ.٧  docs/deployment.md
    ↓
المرحلة ب: توثيقات AI
    ├── ب.١  docs/ai/README.md (تحديث)
    ├── ب.٢  docs/ai/architecture.md
    └── ب.٣  docs/ai/feature-guide.md
    ↓
المرحلة ج: التوثيقات التعليمية — البنية
    ├── ج.١  docs/tutorials/README.md
    ├── ج.٢  docs/tutorials/concepts-guide.md
    └── ج.٣  docs/tutorials/quick-reference.md
    ↓
المرحلة د: التوثيقات التعليمية — الدروس
    ├── د.١  lessons/01-project-setup.md
    ├── د.٢  lessons/02-database-models.md
    ├── د.٣  lessons/03-repository-pattern.md
    ├── د.٤  lessons/04-authentication.md
    ├── د.٥  lessons/05-storage-strategy.md
    ├── د.٦  lessons/06-api-routes.md
    ├── د.٧  lessons/07-theme-and-layout.md
    ├── د.٨  lessons/08-auth-pages.md
    ├── د.٩  lessons/09-photos-crud.md
    ├── د.١٠ lessons/10-profile.md
    └── د.١١ lessons/11-testing.md
```

### إيداعات Git المتوقعة

| الإيداع | الرسالة | النطاق |
|---------|---------|--------|
| 1 | `docs: add documentation plan` | هذا الملف |
| 2 | `docs: update README and add production documentation` | المرحلة أ |
| 3 | `docs(ai): add architecture, feature guide, update AI README` | المرحلة ب |
| 4 | `docs(tutorials): add tutorial index, concepts guide, quick reference` | المرحلة ج |
| 5 | `docs(tutorials): add lessons 01-06 (setup through API routes)` | المرحلة د (النصف الأول) |
| 6 | `docs(tutorials): add lessons 07-11 (theme through testing)` | المرحلة د (النصف الثاني) |

### العلامة المرجعية (Tag)

بعد اكتمال جميع المراحل:

```bash
git tag -a v0.2.0 -m "Release v0.2.0 — Comprehensive Documentation"
git push origin v0.2.0
```

---

*هذه الخطة تعيش في `docs/plans/documentation-plan.md` وتُستخدم كمرجع أثناء تنفيذ المرحلة ١٣ من خطة البناء.*
