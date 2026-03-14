# صوري (My Photos) — AI Assistant Reference

> اقرأ هذا الملف أولاً قبل إجراء أي تعديل على هذا المشروع.

## هوية المشروع

| الحقل | القيمة |
|-------|--------|
| الاسم | صوري (My Photos) |
| النوع | Full-Stack SSR (Next.js App Router) |
| المكدس | Next.js 16 + TypeScript + MongoDB + Mongoose + MUI 7 |
| الإصدار | v0.1.0 |
| الاختبارات | قيد الإنشاء |
| النشر | Vercel (auto-deploy من main) |
| Node | >= 20.x, npm >= 10.x |

## الوصف

موقع ويب لمشاركة الصور يتيح للمستخدمين رفع صور PNG/JPEG أو التقاطها مباشرة
من الكاميرا، مع عناوين وأوصاف، ومشاهدة صور الآخرين، والتفاعل معها بالإعجاب.
يدعم الوضع الفاتح والداكن مع معايير WCAG AA.

## القواعد الحرجة

1. **لا تستورد** الـ models مباشرة — استخدم `getRepositoryManager()`
2. **لا تستخدم** `process.env` في المكونات — استخدم `config.ts`
3. **لا تستخدم** `useContext()` مباشرة — استخدم custom hooks
4. **تحقق دائمًا** من المدخلات مع رسائل خطأ بالعربية
5. **استخدم دائمًا** Conventional Commits (بالإنجليزية)
6. **Storage Service لكل الملفات** — صور المنشورات + صور الملف الشخصي (avatars)
7. **Cascade delete**: عند حذف صورة → أزل الإعجابات + الملف؛ عند حذف حساب → أزل كل شيء
8. **لا GitHub Actions** — Vercel ينشر تلقائيًا من `main`
9. **useCamera hook** لالتقاط الصور — لا تستخدم مكتبات خارجية للكاميرا

## خريطة الملفات الرئيسية

| الملف/المجلد | الغرض |
|-------------|-------|
| `src/app/config.ts` | جميع الثوابت (MAX_FILE_SIZE, CAMERA_*, AVATAR_*) |
| `src/app/types.ts` | جميع واجهات TypeScript (User مع avatarUrl, CameraState) |
| `src/app/providers.tsx` | شجرة المزودين (Theme > Auth) |
| `src/app/context/AuthContext.tsx` | user state + `updateUser()` للتحديث بعد تعديل الملف |
| `src/app/hooks/useCamera.ts` | `getUserMedia` + capture + iOS fallback |
| `src/app/lib/api.ts` | طبقة HTTP المركزية (جميع endpoints) |
| `src/app/lib/storage/` | Storage Strategy Pattern (local/cloudinary/s3) |
| `src/app/models/User.ts` | يشمل `avatarUrl: String \| null` |
| `src/app/repositories/` | Repository Pattern (data access) |
| `src/app/validators/` | Input validation functions |
| `src/app/api/profile/` | profile info + password + avatar endpoints |
| `src/app/api/photos/` | photos CRUD + likes |
| `src/app/components/camera/` | CameraCapture مكوّن مشترك |
| `src/app/components/profile/` | AvatarUploader, ProfileEditor, ChangePasswordForm, DeleteAccountDialog |

## الصفحات

| المسار | الحماية | الوصف |
|--------|---------|-------|
| `/` | عام | الصفحة الرئيسية — صور الجميع |
| `/login` | ضيوف فقط | تسجيل الدخول |
| `/register` | ضيوف فقط | إنشاء حساب |
| `/my-photos` | مسجل | صور المستخدم + رفع/التقاط/تعديل/حذف |
| `/profile` | مسجل | الملف الشخصي: avatar + بيانات + كلمة مرور + حذف حساب |

## الكاميرا — نقاط الاستخدام

- **صفحة صوري** (`/my-photos`): تبويب "التقاط بالكاميرا" في `PhotoUploadForm`
- **صفحة الملف الشخصي** (`/profile`): خيار "التقاط بالكاميرا" في `AvatarUploader`

## التشغيل السريع

```bash
cp .env.example .env.local
npm install
npm run dev
```

## إضافة ميزة جديدة

راجع `docs/ai/architecture.md` للمعمارية التفصيلية و `docs/ai/feature-guide.md` للخطوات.
