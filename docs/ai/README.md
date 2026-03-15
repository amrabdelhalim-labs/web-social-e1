# صوري (My Photos) — AI Assistant Reference

> اقرأ هذا الملف أولاً قبل إجراء أي تعديل على هذا المشروع.

## هوية المشروع

| الحقل      | القيمة                                               |
| ---------- | ---------------------------------------------------- |
| الاسم      | صوري (My Photos)                                     |
| النوع      | Full-Stack SSR (Next.js App Router)                  |
| المكدس     | Next.js 16 + TypeScript + MongoDB + Mongoose + MUI 7 |
| الإصدار    | v0.1.0                                               |
| الاختبارات | قيد الإنشاء                                          |
| النشر      | Heroku (auto-deploy من GitHub `main`)                |
| Node       | >= 20.x, npm >= 10.x                                 |

## الوصف

موقع ويب لمشاركة الصور يتيح للمستخدمين رفع صور PNG/JPEG أو التقاطها مباشرة
من الكاميرا، مع عناوين وأوصاف، ومشاهدة صور الآخرين، والتفاعل معها بالإعجاب.
يدعم الوضع الفاتح والداكن مع معايير WCAG AA.

## القواعد الحرجة

1. **لا تستورد** الـ models مباشرة — استخدم `getRepositoryManager()`
2. **لا تستخدم** `process.env` في المكونات — استخدم `config.ts`
3. **لا تستخدم** `useContext()` مباشرة — استخدم custom hooks (`useAuth`, `useThemeMode`)
4. **تحقق دائمًا** من المدخلات مع رسائل خطأ بالعربية
5. **استخدم دائمًا** Conventional Commits (بالإنجليزية)
6. **Storage Service لكل الملفات** — صور المنشورات + صور الملف الشخصي (avatars)
7. **Cascade delete**: عند حذف صورة → أزل الإعجابات + الملف؛ عند حذف حساب → أزل كل شيء
8. **لا GitHub Actions** — Heroku ينشر تلقائيًا من GitHub `main`
9. **useCamera hook** لالتقاط الصور — لا تستخدم مكتبات خارجية للكاميرا
10. **ليس تطبيق PWA** — لا service worker، لا offline cache، لا device trust، لا push notifications
11. **ThemeContext يستخدم `CacheProvider` من Emotion** — لا `AppRouterCacheProvider` (يتجنب خطأ "Functions cannot be passed to Client Components")

## خريطة الملفات الرئيسية

| الملف/المجلد                      | الغرض                                                                  |
| --------------------------------- | ---------------------------------------------------------------------- |
| `src/app/config.ts`               | جميع الثوابت (MAX*FILE_SIZE, CAMERA*\_, AVATAR\_\_)                    |
| `src/app/types.ts`                | جميع واجهات TypeScript (User مع avatarUrl, CameraState)                |
| `src/app/providers.tsx`           | شجرة المزودين (Theme > Auth)                                           |
| `src/app/context/AuthContext.tsx` | user state + `updateUser()` للتحديث بعد تعديل الملف                    |
| `src/app/hooks/useCamera.ts`      | `getUserMedia` + capture + iOS fallback                                |
| `src/app/lib/api.ts`              | طبقة HTTP المركزية (جميع endpoints)                                    |
| `src/app/lib/storage/`            | Storage Strategy Pattern (local/cloudinary/s3)                         |
| `src/app/models/User.ts`          | يشمل `avatarUrl: String \| null`                                       |
| `src/app/repositories/`           | Repository Pattern (data access)                                       |
| `src/app/validators/`             | Input validation functions                                             |
| `src/app/api/profile/`            | profile info + password + avatar endpoints                             |
| `src/app/api/photos/`             | photos CRUD + likes                                                    |
| `src/app/components/camera/`      | CameraCapture مكوّن مشترك                                              |
| `src/app/components/profile/`     | AvatarUploader, ProfileEditor, ChangePasswordForm, DeleteAccountDialog |

## الصفحات

| المسار       | الحماية  | الوصف                                                |
| ------------ | -------- | ---------------------------------------------------- |
| `/`          | عام      | الصفحة الرئيسية — صور الجميع                         |
| `/login`     | ضيوف فقط | تسجيل الدخول                                         |
| `/register`  | ضيوف فقط | إنشاء حساب                                           |
| `/my-photos` | مسجل     | صور المستخدم + رفع/التقاط/تعديل/حذف                  |
| `/profile`   | مسجل     | الملف الشخصي: avatar + بيانات + كلمة مرور + حذف حساب |

## الكاميرا — نقاط الاستخدام

- **صفحة صوري** (`/my-photos`): تبويب "التقاط بالكاميرا" في `PhotoUploadForm`
- **صفحة الملف الشخصي** (`/profile`): خيار "التقاط بالكاميرا" في `AvatarUploader`

## التشغيل السريع

```bash
cp .env.example .env.local
npm install
npm run dev
```

## تشغيل اختبارات التكامل الحية (Heroku)

```bash
node scripts/test-api.mjs https://<your-heroku-app>.herokuapp.com
```

- يبدأ دائمًا بفحص `GET /api/health` ثم يكتشف نوع التخزين الفعلي من الخادم.
- يستخدم صورًا حقيقية (PNG) للـ avatar والمنشورات.
- ينفّذ cleanup في نهاية التشغيل (حذف الصورة والحساب التجريبي).

## ملاحظات نشر إنتاجية

- عند `STORAGE_TYPE=cloudinary` يجب وجود `cloudinary` ضمن `optionalDependencies` في المشروع المنشور.
- عند استخدام MongoDB Atlas: إذا كلمة المرور تحتوي رموزًا خاصة، يجب ترميزها داخل `DATABASE_URL` بصيغة URL-encoding.

## إضافة ميزة جديدة

راجع `docs/ai/architecture.md` للمعمارية التفصيلية و `docs/ai/feature-guide.md` للخطوات.
