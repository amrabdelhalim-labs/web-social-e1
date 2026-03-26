# فهرس الدروس — صوري

> دروس تعليمية لشرح مشروع صوري من البنية الأساسية حتى الاختبارات، مرتبة من البسيط إلى المعقد.

---

## لمحة تقنية

صوري تطبيق ويب Full-Stack مبني بـ **Next.js 16** (App Router) و **TypeScript** و **MongoDB**. الواجهة عربية (RTL) باستخدام **MUI 7**. المصادقة عبر **JWT** (موقّع على الخادم) مخزَّن في **Cookie HttpOnly** مع **bcrypt**، وحماية مسارات عبر **Edge Middleware** و`ProtectedRoute`. طبقة البيانات تعتمد **نمط المستودعات**. رفع الصور: استراتيجية تخزين قابلة للتبديل + **التحقق من محتوى الملف (Magic Bytes)** على الخادم. الاختبارات بـ **Vitest** و **Testing Library** (~٢٩ ملفًا).

في الإصدار الحالي، التوثيق يشمل أيضًا مسار نشر بالحاويات عبر **Docker**:

- صورة إنتاج `standalone` لـ Next.js
- تكديس محلي عبر `docker compose` (تطبيق + MongoDB)
- خط أنابيب نشر صورة إلى `ghcr.io` عبر GitHub Actions
- بوابات جودة ثم مسح **Trivy** (filesystem ثم الصورة) مع ملف **`.trivyignore`** الموثَّق (`trivyignores` في `docker-publish.yml`)؛ **`overrides`** في `package.json` لا تغطي تبعيات Next.js المجمّعة تحت `next/dist/compiled`

| الطبقة   | التقنية                                                         |
| -------- | --------------------------------------------------------------- |
| الواجهة  | React، MUI، Emotion، RTL                                        |
| الخادم   | Next.js API Routes، SSR                                         |
| البيانات | MongoDB، Mongoose، Repositories                                 |
| الملفات  | Storage Strategy (local / cloudinary / s3)                      |
| المصادقة | JWT في cookie HttpOnly، Middleware، AuthContext، ProtectedRoute |
| الاختبار | Vitest، jsdom، @testing-library/react                           |

---

## فهرس الدروس (١١ درسًا)

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

## مسارات التعلم

| المسار                   | الوصف                             | الدروس المقترحة                                               |
| ------------------------ | --------------------------------- | ------------------------------------------------------------- |
| **من الصفر**             | تريد فهم المشروع من البداية       | 01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10 → 11          |
| **التركيز على البيانات** | نماذج، مستودعات، تخزين            | 02، 03، 05، 06                                                |
| **التركيز على الواجهة**  | سمات، تخطيط، صفحات، مكونات        | 07، 08، 09، 10                                                |
| **المراجعة السريعة**     | تذكرت الأساس وتريد تثبيت المفاهيم | [quick-reference.md](quick-reference.md) ثم أي درس حسب الحاجة |

---

## ملفات مساندة

| الملف                                    | الغرض                                                                                               |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------- |
| [concepts-guide.md](concepts-guide.md)   | شرح المفاهيم (Next.js، TypeScript، MongoDB، Repository، JWT+Cookie، Strategy، getUserMedia، Vitest) |
| [quick-reference.md](quick-reference.md) | خريطة الملفات، أوامر npm، مسارات API، روابط الدروس                                                  |

---

_للتوثيق المرجعي (API، قاعدة البيانات، التخزين، الاختبار، النشر) راجع [../api-endpoints.md](../api-endpoints.md) وما في [../](../)._
