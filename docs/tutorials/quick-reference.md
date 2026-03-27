# مرجع سريع — صوري

> خريطة الملفات، الأوامر، مسارات API، وروابط الدروس في مكان واحد.

---

## 1. خريطة الملفات (حسب الطبقة)

| الطبقة           | المسار                    | أمثلة                                                                                         |
| ---------------- | ------------------------- | --------------------------------------------------------------------------------------------- |
| الصفحات          | `src/app/*/page.tsx`      | `page.tsx` (RSC + `HomePageFeed`)، `login/page.tsx`، `my-photos/page.tsx`، `profile/page.tsx` |
| Proxy            | `src/proxy.ts`            | حماية `/my-photos`، `/profile`؛ إعادة توجيه الضيف من `/login` إن وُجدت جلسة                   |
| مسارات API       | `src/app/api/**/route.ts` | `api/auth/login/route.ts`, `api/auth/logout/route.ts`, `api/photos/route.ts` …                |
| المكونات         | `src/app/components/`     | `photos/PhotoCard.tsx`, `layout/UserMenu.tsx`, `profile/AvatarUploader.tsx`                   |
| السياقات         | `src/app/context/`        | `AuthContext.tsx`, `ThemeContext.tsx`                                                         |
| الخطافات         | `src/app/hooks/`          | `useAuth.ts`, `usePhotos.ts`, `useMyPhotos.ts`, `useCamera.ts`                                |
| المكتبات         | `src/app/lib/`            | `auth.ts`, `authCookie.ts`, `fileValidation.ts`, `photoSerializer.ts`, `api.ts`, `storage/`   |
| النماذج          | `src/app/models/`         | `User.ts`, `Photo.ts`, `Like.ts`                                                              |
| المستودعات       | `src/app/repositories/`   | `user.repository.ts`, `photo.repository.ts`, `like.repository.ts`                             |
| المحققون         | `src/app/validators/`     | `index.ts`                                                                                    |
| الاختبارات       | `src/app/tests/`          | `auth.test.ts`, `PhotoCard.test.tsx`, `login.test.tsx`                                        |
| الإعداد والأنواع | جذر `src/app/`            | `config.ts`, `types.ts`, `providers.tsx`, `layout.tsx`                                        |

---

## 2. أوامر npm

| الأمر                   | الوصف                        |
| ----------------------- | ---------------------------- |
| `npm run dev`           | خادم التطوير                 |
| `npm run build`         | بناء للإنتاج                 |
| `npm start`             | تشغيل خادم الإنتاج           |
| `npm test`              | اختبارات تشغيل واحد          |
| `npm run test:watch`    | اختبارات (watch)             |
| `npm run test:coverage` | اختبارات مع تقرير التغطية    |
| `npm run lint`          | ESLint                       |
| `npm run format`        | Prettier                     |
| `npm run format:check`  | التحقق من التنسيق            |
| `npm run typecheck`     | فحص TypeScript بدون إخراج    |
| `npm run docker:check`  | فحص إعدادات Docker الأساسية  |
| `npm run validate`      | format:check + lint + test   |
| `npm run db:init`       | إنشاء قاعدة البيانات المحلية |

---

## 3. مسارات API (ملخص)

**Auth:** «جلسة» = cookie `auth-token` (المتصفح) أو `Authorization: Bearer` (بديل). انظر [api-endpoints.md](../api-endpoints.md).

| Method | Path                  | Auth    | الوصف               |
| ------ | --------------------- | ------- | ------------------- |
| POST   | /api/auth/register    | —       | إنشاء حساب + cookie |
| POST   | /api/auth/login       | —       | تسجيل دخول + cookie |
| POST   | /api/auth/logout      | —       | مسح الجلسة          |
| GET    | /api/auth/me          | جلسة    | بيانات المستخدم     |
| PUT    | /api/profile          | جلسة    | تحديث البيانات      |
| PUT    | /api/profile/password | جلسة    | تغيير كلمة المرور   |
| PUT    | /api/profile/avatar   | جلسة    | رفع صورة شخصية      |
| DELETE | /api/profile/avatar   | جلسة    | حذف الصورة الشخصية  |
| DELETE | /api/profile          | جلسة    | حذف الحساب          |
| GET    | /api/photos           | اختياري | قائمة الصور العامة  |
| POST   | /api/photos           | جلسة    | رفع صورة            |
| GET    | /api/photos/mine      | جلسة    | صور المستخدم        |
| PUT    | /api/photos/[id]      | جلسة    | تعديل صورة          |
| DELETE | /api/photos/[id]      | جلسة    | حذف صورة            |
| POST   | /api/photos/[id]/like | جلسة    | تبديل الإعجاب       |
| GET    | /api/health           | —       | فحص الصحة           |

للتفاصيل والأمثلة: [../api-endpoints.md](../api-endpoints.md).

---

## 4. أوامر Docker السريعة

| الأمر                                   | الوصف                                                  |
| --------------------------------------- | ------------------------------------------------------ |
| `docker build -t web-social-e1:local .` | بناء صورة التطبيق محليًا                               |
| `docker compose up --build`             | تشغيل التطبيق + MongoDB محليًا                         |
| `docker compose down`                   | إيقاف الخدمات مع الحفاظ على الأحجام                    |
| `docker compose down -v`                | إيقاف الخدمات وحذف الأحجام (يشمل بيانات Mongo المحلية) |

قبل `docker compose up` أنشئ ملف `.env` من `.env.docker.example` وضع قيمة قوية لـ `JWT_SECRET`.

**CI / الأمان:** سير `docker-publish.yml` يشغّل Trivy على المستودع ثم على صورة `web-social-e1:scan`؛ كلا الخطوتين تستخدمان **`.trivyignore`** (`trivyignores`). راجع [../deployment.md](../deployment.md) لسياسة `overrides` وثغرات Next.js المجمّعة.

---

## 5. روابط الدروس

| #   | الدرس                          | الرابط                                                       |
| --- | ------------------------------ | ------------------------------------------------------------ |
| 01  | إعداد المشروع والبنية الأساسية | [01-project-setup.md](lessons/01-project-setup.md)           |
| 02  | نماذج قاعدة البيانات           | [02-database-models.md](lessons/02-database-models.md)       |
| 03  | نمط المستودعات                 | [03-repository-pattern.md](lessons/03-repository-pattern.md) |
| 04  | المصادقة والحماية              | [04-authentication.md](lessons/04-authentication.md)         |
| 05  | استراتيجية التخزين             | [05-storage-strategy.md](lessons/05-storage-strategy.md)     |
| 06  | مسارات API                     | [06-api-routes.md](lessons/06-api-routes.md)                 |
| 07  | نظام السمات والتخطيط           | [07-theme-and-layout.md](lessons/07-theme-and-layout.md)     |
| 08  | صفحات المصادقة                 | [08-auth-pages.md](lessons/08-auth-pages.md)                 |
| 09  | واجهة الصور (CRUD + الإعجاب)   | [09-photos-crud.md](lessons/09-photos-crud.md)               |
| 10  | الملف الشخصي                   | [10-profile.md](lessons/10-profile.md)                       |
| 11  | الاختبارات الشاملة             | [11-testing.md](lessons/11-testing.md)                       |

---

_العودة إلى [فهرس الدروس](README.md) أو [دليل المفاهيم](concepts-guide.md)._
