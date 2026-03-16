# مرجع مسارات API — صوري

> توثيق شامل لجميع نقاط واجهة برمجة التطبيقات في صوري.

---

## 1. شكل الاستجابة الموحد

### النجاح

```json
{
  "data": { ... },
  "message": "رسالة اختيارية بالعربية"
}
```

### الخطأ

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "رسالة الخطأ بالعربية"
  }
}
```

### رموز الأخطاء

| الرمز | الحالة | الوصف |
|-------|--------|-------|
| `VALIDATION_ERROR` | 400 | فشل التحقق من المدخلات |
| `UNAUTHORIZED` | 401 | توكن مفقود أو غير صالح |
| `FORBIDDEN` | 403 | غير مصرح بتنفيذ الإجراء |
| `NOT_FOUND` | 404 | المورد غير موجود |
| `CONFLICT` | 409 | تعارض (مثل بريد مُسجّل مسبقًا) |
| `SERVER_ERROR` | 500 | خطأ غير متوقع في الخادم |

---

## 2. المصادقة

### POST /api/auth/register

إنشاء حساب جديد وإرجاع JWT تلقائيًا.

| الحقل | النوع | مطلوب | الوصف |
|-------|-------|-------|-------|
| name | string | نعم | 3–50 حرف |
| email | string | نعم | صيغة بريد صحيحة |
| password | string | نعم | 6 أحرف على الأقل |
| confirmPassword | string | نعم | مطابق لـ password |

**مثال طلب:**

```json
{
  "name": "أحمد محمد",
  "email": "ahmed@example.com",
  "password": "secret123",
  "confirmPassword": "secret123"
}
```

**استجابة ناجحة (201):**

```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "_id": "...",
      "name": "أحمد محمد",
      "email": "ahmed@example.com",
      "avatarUrl": null,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  },
  "message": "تم إنشاء الحساب بنجاح."
}
```

**أخطاء محتملة:** 400 (تحقق)، 409 (البريد مُسجّل مسبقًا)

---

### POST /api/auth/login

تسجيل الدخول بالبريد وكلمة المرور.

| الحقل | النوع | مطلوب |
|-------|-------|-------|
| email | string | نعم |
| password | string | نعم |

**استجابة ناجحة (200):** نفس شكل `register` مع `data.token` و `data.user`

**أخطاء محتملة:** 400 (تحقق)، 401 (بيانات الاعتماد غير صحيحة)

---

### GET /api/auth/me

جلب بيانات المستخدم الحالي. يتطلب رأس `Authorization: Bearer <token>`.

**استجابة ناجحة (200):**

```json
{
  "data": {
    "_id": "...",
    "name": "أحمد محمد",
    "email": "ahmed@example.com",
    "avatarUrl": "https://...",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**أخطاء محتملة:** 401 (توكن مفقود أو منتهي)

---

## 3. الملف الشخصي

### PUT /api/profile

تحديث الاسم و/أو البريد. يتطلب JWT.

| الحقل | النوع | مطلوب | الوصف |
|-------|-------|-------|-------|
| name | string | لا | 3–50 حرف |
| email | string | لا | صيغة بريد صحيحة |

**أخطاء محتملة:** 400، 401، 404، 409 (البريد مُسجّل)

---

### PUT /api/profile/password

تغيير كلمة المرور. يتطلب JWT.

| الحقل | النوع | مطلوب |
|-------|-------|-------|
| currentPassword | string | نعم |
| newPassword | string | نعم |
| confirmPassword | string | نعم |

**أخطاء محتملة:** 400، 401 (كلمة المرور الحالية خاطئة)

---

### PUT /api/profile/avatar

رفع صورة الملف الشخصي. `multipart/form-data` مع حقل `avatar`. يتطلب JWT.

**أخطاء محتملة:** 400، 401، 413 (حجم الملف يتجاوز 2 ميجابايت)

---

### DELETE /api/profile/avatar

حذف صورة الملف الشخصي والعودة للافتراضي. يتطلب JWT.

---

### DELETE /api/profile

حذف الحساب نهائيًا. يتطلب JWT وكلمة المرور للتأكيد.

**مثال طلب:**

```json
{
  "password": "كلمة المرور الحالية"
}
```

**أخطاء محتملة:** 400، 401 (كلمة المرور خاطئة)، 404

---

## 4. الصور

### GET /api/photos

قائمة الصور العامة (مع pagination). اختياري: JWT لعرض حالة الإعجاب للمستخدم.

**معاملات الاستعلام:**

| المعامل | النوع | الافتراضي | الوصف |
|---------|-------|-----------|-------|
| page | number | 1 | رقم الصفحة |
| limit | number | 12 | عدد العناصر (حد أقصى 50) |

**استجابة ناجحة (200):**

```json
{
  "data": [
    {
      "_id": "...",
      "title": "عنوان الصورة",
      "description": "الوصف",
      "imageUrl": "https://...",
      "user": {
        "_id": "...",
        "name": "أحمد",
        "avatarUrl": null
      },
      "likesCount": 5,
      "isLiked": false,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "pagination": {
    "page": 1,
    "totalPages": 3,
    "total": 25,
    "limit": 12
  }
}
```

---

### POST /api/photos

رفع صورة جديدة. يتطلب JWT. `multipart/form-data`:

| الحقل | النوع | مطلوب | الوصف |
|-------|-------|-------|-------|
| title | string | نعم | 1–200 حرف |
| description | string | لا | حتى 2000 حرف |
| photo | File | نعم | PNG أو JPEG، حد أقصى 5 ميجابايت |

**أخطاء محتملة:** 400، 401، 413

---

### GET /api/photos/mine

صور المستخدم الحالي. يتطلب JWT. يدعم `page` و `limit`.

---

### PUT /api/photos/[id]

تعديل عنوان/وصف صورة. المالك فقط. يتطلب JWT.

| الحقل | النوع | مطلوب |
|-------|-------|-------|
| title | string | لا |
| description | string | لا |

**أخطاء محتملة:** 400، 401، 403، 404

---

### DELETE /api/photos/[id]

حذف صورة. المالك فقط. يتطلب JWT.

**أخطاء محتملة:** 401، 403، 404

---

### POST /api/photos/[id]/like

تبديل الإعجاب (like/unlike). يتطلب JWT.

**استجابة ناجحة (200):**

```json
{
  "data": {
    "liked": true,
    "likesCount": 6
  }
}
```

**أخطاء محتملة:** 401، 404

---

## 5. الصحة

### GET /api/health

فحص حالة التطبيق وقاعدة البيانات والتخزين.

**استجابة ناجحة (200):**

```json
{
  "status": "healthy",
  "database": "connected",
  "repositories": {
    "user": true,
    "photo": true,
    "like": true
  },
  "storage": {
    "type": "local",
    "healthy": true
  },
  "timestamp": "2026-03-14T12:00:00.000Z"
}
```

**استجابة متدهورة (503):** عند فشل قاعدة البيانات أو التخزين.

---

## 6. ملخص سريع

| Method | Path | Auth | الوصف |
|--------|------|------|-------|
| POST | /api/auth/register | — | إنشاء حساب |
| POST | /api/auth/login | — | تسجيل الدخول |
| GET | /api/auth/me | JWT | بيانات المستخدم |
| PUT | /api/profile | JWT | تحديث البيانات |
| PUT | /api/profile/password | JWT | تغيير كلمة المرور |
| PUT | /api/profile/avatar | JWT | رفع صورة شخصية |
| DELETE | /api/profile/avatar | JWT | حذف الصورة الشخصية |
| DELETE | /api/profile | JWT | حذف الحساب |
| GET | /api/photos | اختياري | قائمة الصور العامة |
| POST | /api/photos | JWT | رفع صورة |
| GET | /api/photos/mine | JWT | صور المستخدم |
| PUT | /api/photos/[id] | JWT | تعديل صورة |
| DELETE | /api/photos/[id] | JWT | حذف صورة |
| POST | /api/photos/[id]/like | JWT | تبديل الإعجاب |
| GET | /api/health | — | فحص الصحة |
