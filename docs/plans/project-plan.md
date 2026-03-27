# خطة المشروع (محدّثة بعد التدقيق)

> هذا الملف لم يعد "خطة تنفيذ مستقبلية" بقدر ما هو **مرجع حالة المشروع الحالية**.
> المصدر التشغيلي الأهم يظل: `README.md` + ملفات `docs/*.md` التخصصية.

---

## 1) الحالة الحالية

- **اسم المشروع:** صوري (My Photos)
- **النوع:** Next.js App Router (Full-Stack, SSR + API Routes)
- **اللغة:** TypeScript
- **البيانات:** MongoDB + Mongoose
- **المصادقة:** JWT داخل Cookie HttpOnly (`auth-token`) مع `sessionVersion`
- **التخزين:** Strategy Pattern (`local` / `cloudinary` / `s3`)
- **الاختبارات:** Vitest + Testing Library
- **النشر المدعوم:** Docker/Compose + GHCR workflow + Heroku

---

## 2) القرارات المعمارية الثابتة

1. **Repository Pattern** في طبقة البيانات (`src/app/repositories`).
2. **Validation-first** قبل أي معالجة DB أو تخزين (`src/app/validators`).
3. **Cookie-first auth** (Bearer fallback للبرمجة/الاختبارات فقط).
4. **Proxy + Guards**:
   - `src/proxy.ts` يحمي `/my-photos` و`/profile` عند التنقل.
   - `GuestRoute`/`ProtectedRoute` تكمل سلوك العميل.
5. **Storage abstraction** موحدة عبر `getStorageService()`.

---

## 3) معالم التنفيذ المكتملة

- نماذج البيانات (`User`, `Photo`, `Like`) وفهارسها.
- مسارات API:
  - auth (`login`, `register`, `logout`, `me`)
  - profile (`route`, `password`, `avatar`)
  - photos (`route`, `mine`, `[id]`, `[id]/like`)
  - health (`GET`, `HEAD`)
- واجهات المستخدم الأساسية:
  - الصفحة الرئيسية SSR + `HomePageFeed`
  - صفحات المصادقة
  - صفحة "صوري"
  - صفحة الملف الشخصي
- الكاميرا (`useCamera` + `CameraCapture`) مع fallback.
- التوثيق التعليمي (الدروس 01–11) متوفر.

---

## 4) وضع الاختبار والجودة

- أوامر الجودة الفعلية في `package.json`:
  - `lint`, `typecheck`, `test`, `docker:check`, `validate`
- سكربت `validate` الفعلي: تنظيف `.next` + تحقق ملفات أساسية + lint + typecheck + test + docker checks.
- اختبارات التطبيق موجودة بالكامل داخل `src/app/tests`.

---

## 5) وضع النشر الحالي

- **Docker local:** عبر `Dockerfile` + `docker-compose.yml`.
- **CI/CD للحاويات:** `.github/workflows/docker-publish.yml`
  - Quality gates
  - Trivy fs/image scan
  - GHCR push (tags/manual)
- **Heroku:** ما زال مدعومًا عبر `Procfile` و`docs/deployment.md`.

---

## 6) سياسة تحديث هذا الملف

- يُستخدم هذا الملف كـ **snapshot عالي المستوى** فقط.
- لا نضع فيه جردًا تفصيليًا دقيقًا للملفات أو أعداد الاختبارات لتقليل drift.
- أي تفاصيل تشغيلية دقيقة تُحدّث في:
  - `README.md`
  - `docs/api-endpoints.md`
  - `docs/testing.md`
  - `docs/deployment.md`

---

_آخر تحديث: تزامن توثيق شامل مع تطبيق فعلي (مارس 2026)._
