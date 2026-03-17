# الدرس 06: مسارات API

> هدف الدرس: فهم بنية [مسارات API في Next.js](../concepts-guide.md#1-nextjs) في صوري — شكل الاستجابة الموحد، مساعدات الأخطاء، مسارات المصادقة والملف الشخصي والصور، وطبقة العميل `lib/api.ts`.

---

## 1. لمحة عامة

كل مسار API في صوري ملف `route.ts` داخل `app/api/`. المجلد يحدّد المسار: `api/auth/login` → `api/auth/login/route.ts`. كل ملف يُصدّر دوالاً بأسماء HTTP: `GET`، `POST`، `PUT`، `DELETE`. العميل يستدعي `fetch` عبر دوال موحّدة في `lib/api.ts` تُحقن التوكن تلقائياً.

**تشبيه:** مسارات API نوافذ خدمة في نفس المبنى — كل نافذة تخدم طلباً مختلفاً، لكن القواعد الموحّدة (شكل الاستجابة، رموز الأخطاء) تجعل التعامل معها متسقاً.

---

## 2. شكل الاستجابة الموحد

### ٢.١ النجاح

```json
{
  "data": { ... },
  "message": "رسالة اختيارية بالعربية"
}
```

### ٢.٢ الخطأ

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "رسالة الخطأ بالعربية"
  }
}
```

### ٢.٣ رموز الأخطاء

| الرمز            | الحالة | الوصف                          |
| ---------------- | ------ | ------------------------------ |
| VALIDATION_ERROR | 400    | فشل التحقق من المدخلات         |
| UNAUTHORIZED     | 401    | توكن مفقود أو غير صالح         |
| FORBIDDEN        | 403    | غير مصرح بتنفيذ الإجراء        |
| NOT_FOUND        | 404    | المورد غير موجود               |
| CONFLICT         | 409    | تعارض (مثل بريد مُسجّل مسبقاً) |
| SERVER_ERROR     | 500    | خطأ غير متوقع في الخادم        |

---

## 3. apiErrors.ts — مساعدات الأخطاء

### ٣.١ الفكرة

بدلاً من كتابة `NextResponse.json({ error: {...} }, { status: 401 })` في كل مسار، نستدعي دوالاً جاهزة مثل `unauthorizedError('رسالة')` أو `validationError(['خطأ ١', 'خطأ ٢'])`. الرسائل تُجمَع بالفاصلة العربية عند التحقق.

### ٣.٢ الكود

```typescript
// apiErrors.ts — مساعدات الأخطاء
export function validationError(messages: string[]): NextResponse<ApiResponse<null>> {
  return apiError('VALIDATION_ERROR', messages.join('، '), 400);
}

export function unauthorizedError(message = 'غير مصرح. يرجى تسجيل الدخول أولًا.') {
  return apiError('UNAUTHORIZED', message, 401);
}

export function forbiddenError(message = 'ليس لديك صلاحية لتنفيذ هذا الإجراء.') {
  return apiError('FORBIDDEN', message, 403);
}

export function notFoundError(message = 'العنصر المطلوب غير موجود.') {
  return apiError('NOT_FOUND', message, 404);
}

export function conflictError(message = 'حدث تعارض في البيانات المدخلة.') {
  return apiError('CONFLICT', message, 409);
}

export function serverError(message = 'حدث خطأ غير متوقع في الخادم.') {
  return apiError('SERVER_ERROR', message, 500);
}
```

---

## 4. مسار الصحة — GET /api/health

### ٤.١ الفكرة

يُستخدم لفحص حالة التطبيق وقاعدة البيانات والتخزين. يدعم `HEAD` للتحقق الخفيف من الاتصال. يُرجع 200 عند الصحة الكاملة و 503 عند الفشل.

### ٤.٢ التدفق

1. محاولة الاتصال بقاعدة البيانات.
2. فحص التخزين (`storage.healthCheck`) حتى لو فشلت DB.
3. فحص المستودعات (فقط عند نجاح DB).
4. تجميع النتيجة وإرجاعها.

### ٤.٣ الكود

```typescript
// api/health/route.ts — GET
const allHealthy = !dbError && health.status === 'healthy' && storageHealthy;

return NextResponse.json(
  {
    status: allHealthy ? 'healthy' : 'degraded',
    database: dbError ? 'error' : health.database,
    repositories: health.repositories,
    storage: { type: getStorageType(), healthy: storageHealthy },
    timestamp: new Date().toISOString(),
  },
  { status: allHealthy ? 200 : 503 }
);
```

---

## 5. مسارات المصادقة — auth

### ٥.١ POST /api/auth/register

إنشاء حساب جديد. التحقق من المدخلات → التحقق من عدم تكرار البريد → تشفير كلمة المرور → إنشاء المستخدم → إنشاء JWT وإرجاعه مع بيانات المستخدم.

### ٥.٢ POST /api/auth/login

تسجيل الدخول. التحقق من المدخلات → البحث بالبريد → مقارنة كلمة المرور → إنشاء JWT وإرجاعه.

### ٥.٣ GET /api/auth/me

جلب بيانات المستخدم الحالي. يتطلب `authenticateRequest(request)` — عند الفشل يُرجع `auth.error` مباشرة.

### ٥.٤ نمط مشترك

```typescript
// api/auth/login/route.ts — نمط مشترك
const errors = validateLoginInput(body);
if (errors.length > 0) return validationError(errors);

await connectDB();
const userRepo = getUserRepository();
const foundUser = await userRepo.findByEmail(body.email);
if (!foundUser) return unauthorizedError('البريد الإلكتروني أو كلمة المرور غير صحيحة.');

const isMatch = await comparePassword(body.password, foundUser.password);
if (!isMatch) return unauthorizedError('...');

const token = generateToken(foundUser._id.toString());
return NextResponse.json({ data: { token, user }, message: '...' }, { status: 200 });
```

---

## 6. مسارات الملف الشخصي — profile

### ٦.١ جدول المسارات

| Method | المسار                | الوصف                                   |
| ------ | --------------------- | --------------------------------------- |
| PUT    | /api/profile          | تحديث الاسم و/أو البريد                 |
| DELETE | /api/profile          | حذف الحساب (يتطلب كلمة المرور، cascade) |
| PUT    | /api/profile/password | تغيير كلمة المرور                       |
| PUT    | /api/profile/avatar   | رفع صورة شخصية (multipart)              |
| DELETE | /api/profile/avatar   | حذف الصورة الشخصية                      |

### ٦.٢ حذف الحساب — Cascade

عند حذف الحساب: التحقق من كلمة المرور → جمع صور المستخدم + avatarUrl → حذف المستخدم (cascade: صور، إعجابات) → حذف الملفات من التخزين.

```typescript
// api/profile/route.ts — DELETE مقتطف
const userPhotos = await photoRepo.findAll({ user: auth.userId });
const filesToDelete = userPhotos.map((p) => p.imageUrl);
if (foundUser.avatarUrl) filesToDelete.push(foundUser.avatarUrl);

await userRepo.deleteUserCascade(auth.userId);
if (filesToDelete.length > 0) await storage.deleteFiles(filesToDelete);
```

---

## 7. مسارات الصور — photos

### ٧.١ جدول المسارات

| Method | المسار                | Auth    | الوصف                                                 |
| ------ | --------------------- | ------- | ----------------------------------------------------- |
| GET    | /api/photos           | اختياري | قائمة الصور العامة (pagination، isLiked عند وجود JWT) |
| POST   | /api/photos           | مطلوب   | رفع صورة (multipart: photo، title، description)       |
| GET    | /api/photos/mine      | مطلوب   | صور المستخدم الحالي                                   |
| PUT    | /api/photos/[id]      | مطلوب   | تعديل عنوان/وصف (المالك فقط)                          |
| DELETE | /api/photos/[id]      | مطلوب   | حذف صورة (المالك فقط)                                 |
| POST   | /api/photos/[id]/like | مطلوب   | تبديل الإعجاب                                         |

### ٧.٢ رفع الصورة — Cleanup عند الفشل

```typescript
// api/photos/route.ts — POST مقتطف
let uploadedUrl: string | null = null;
try {
  const result = await storage.uploadFile(storageFile);
  uploadedUrl = result.url;
  const photo = await photoRepo.create({ ... });
  return NextResponse.json({ data: serialized }, { status: 201 });
} catch (error) {
  if (uploadedUrl) {
    await getStorageService().deleteFile(uploadedUrl).catch(() => {});
  }
  return serverError();
}
```

عند رفع ناجح ثم فشل حفظ السجل في DB، يُحذف الملف تلقائياً.

### ٧.٣ تبديل الإعجاب

```typescript
// api/photos/[id]/like/route.ts — POST
const result = await likeRepo.toggleLike(auth.userId, photoId);
const delta = result.liked ? 1 : -1;
const updatedPhoto = await photoRepo.updateLikesCount(photoId, delta);
return NextResponse.json({ data: { liked: result.liked, likesCount } }, { status: 200 });
```

---

## 8. lib/api.ts — طبقة العميل

### ٨.١ الفكرة

ملف `'use client'` يوفر دوالاً موحّدة لاستدعاء API. `fetchApi` و `fetchFormApi` يقرآن التوكن من `localStorage` ويحقنانه في `Authorization: Bearer <token>`. عند أي استجابة غير 2xx يُرمى `Error` برسالة الخادم العربية.

### ٨.٢ الدوال الأساسية

| الدالة       | الاستخدام                                   |
| ------------ | ------------------------------------------- |
| fetchApi     | JSON (يضبط Content-Type تلقائياً)           |
| fetchFormApi | multipart/form-data (المتصفح يضبط boundary) |

### ٨.٣ دوال المسارات

```typescript
// lib/api.ts — أمثلة
export function loginApi(input: LoginInput) {
  return fetchApi<ApiResponse<{ token: string; user: User }>>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function uploadPhotoApi(file: File, title: string, description?: string) {
  const form = new FormData();
  form.append('photo', file);
  form.append('title', title);
  if (description) form.append('description', description);
  return fetchFormApi<ApiResponse<Photo>>('/api/photos', form, 'POST');
}

export function toggleLikeApi(photoId: string) {
  return fetchApi<ApiResponse<{ liked: boolean; likesCount: number }>>(
    `/api/photos/${photoId}/like`,
    { method: 'POST' }
  );
}
```

---

## 9. ملخص

| ما تعلمناه                  | الملف المسؤول                                                  |
| --------------------------- | -------------------------------------------------------------- |
| شكل الاستجابة ورموز الأخطاء | `api-endpoints.md`                                             |
| مساعدات الأخطاء             | `lib/apiErrors.ts`                                             |
| مسار الصحة                  | `api/health/route.ts`                                          |
| مسارات المصادقة             | `api/auth/login`, `register`, `me`                             |
| مسارات الملف الشخصي         | `api/profile`, `profile/avatar`, `profile/password`            |
| مسارات الصور                | `api/photos`, `photos/mine`, `photos/[id]`, `photos/[id]/like` |
| طبقة العميل                 | `lib/api.ts`                                                   |

للمرجع الكامل ← [api-endpoints.md](../../api-endpoints.md)

---

_الدرس السابق ← [05 — استراتيجية التخزين](05-storage-strategy.md)_  
_العودة إلى [فهرس الدروس](../README.md)_  
_الدرس التالي → [07 — نظام السمات والتخطيط](07-theme-and-layout.md)_
