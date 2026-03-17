# الدرس 04: المصادقة والحماية

> هدف الدرس: فهم نظام المصادقة في صوري — [JWT](../concepts-guide.md#5-jwt-json-web-token) و bcrypt، التحقق من المدخلات، حماية المسارات، والسياق العميل.

---

## 1. لمحة عامة

المصادقة في صوري **عديمة الحالة** (stateless): الخادم لا يخزّن جلسات. التوكن يحمل المعرّف؛ العميل يرسله في كل طلب. التحقق من المدخلات يحدث قبل قاعدة البيانات؛ وحماية الصفحات تتم عبر مكونات تغلّف المحتوى وتعيد التوجيه حسب حالة المستخدم.

**تشبيه:** JWT تذكرة موقّعة: تحمل هويتك، وأي باب (مسار API) يتحقق من التوقيع يقبلك دون الرجوع إلى مركز التذاكر في كل مرة.

---

## 2. auth.ts — JWT و bcrypt

### ٢.١ الفكرة

`auth.ts` يجمع كل العمليات التشفيرية: إنشاء التوكن، التحقق منه، تشفير كلمة المرور، ومقارنتها. لا يُستدعى Mongoose من هنا — المسارات تجلب المستخدم ثم تستدعي هذه الدوال.

### ٢.٢ الدوال

| الدالة          | الوصف                                                   |
| --------------- | ------------------------------------------------------- |
| generateToken   | توقيع JWT يحتوي `{ id: userId }`، صلاحية 7 أيام         |
| verifyToken     | التحقق من التوقيع والصلاحية، يُرجع `{ id }` أو يرمي خطأ |
| hashPassword    | تشفير bcrypt (12 جولة)                                  |
| comparePassword | مقارنة النص مع الـ hash                                 |

### ٢.٣ الكود

```typescript
// auth.ts — generateToken و verifyToken
export function generateToken(userId: string): string {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JwtPayload {
  const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
  if (!payload?.id || typeof payload.id !== 'string') {
    throw new Error('Invalid token payload');
  }
  return payload;
}
```

- `JWT_SECRET`: من `process.env.JWT_SECRET` — مطلوب في الإنتاج.
- 12 جولة bcrypt: توازن بين الأمان وزمن الاستجابة (~300 ms).

---

## 3. validators — التحقق من المدخلات

### ٣.١ الفكرة

دوال نقية (بدون DB) تُرجع مصفوفة رسائل خطأ عربية. تُستدعى في مسارات API وفي النماذج (اختياري). الحقل المفقود يُضاف أولاً؛ الحقول الاختيارية تُتخطى إن كانت `undefined`.

### ٣.٢ دوال المصادقة

| الدالة                      | المدخلات                                      | القيود                                           |
| --------------------------- | --------------------------------------------- | ------------------------------------------------ |
| validateRegisterInput       | name, email, password, confirmPassword        | اسم 3–50، بريد صحيح، كلمة مرور 6+، تطابق التأكيد |
| validateLoginInput          | email, password                               | بريد صحيح، كلمة مرور 6+                          |
| validateUpdateUserInput     | name?, email?                                 | واحد على الأقل، نفس قيود الاسم والبريد           |
| validateChangePasswordInput | currentPassword, newPassword, confirmPassword | الجديدة 6+، تطابق، مختلفة عن الحالية             |

### ٣.٣ مثال

```typescript
// validators — validateLoginInput مقتطف
export function validateLoginInput(input: LoginInput): string[] {
  const errors: string[] = [];
  if (!input.email || !isValidEmail(input.email.trim())) {
    errors.push('صيغة البريد الإلكتروني غير صحيحة.');
  }
  if (!input.password || input.password.length < 6) {
    errors.push('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
  }
  return errors;
}
```

---

## 4. apiErrors — رسائل الخطأ الموحدة

### ٤.١ الشكل الموحد

```typescript
// apiErrors — شكل الاستجابة
{ error: { code: string, message: string } }
```

### ٤.٢ الدوال المساعدة

| الدالة            | الحالة | الاستخدام               |
| ----------------- | ------ | ----------------------- |
| validationError   | 400    | فشل التحقق من المدخلات  |
| unauthorizedError | 401    | توكن مفقود أو غير صالح  |
| forbiddenError    | 403    | غير مصرح بتنفيذ الإجراء |
| notFoundError     | 404    | المورد غير موجود        |
| conflictError     | 409    | تعارض (بريد مُسجّل)     |
| serverError       | 500    | خطأ غير متوقع           |

```typescript
// apiErrors — استخدام في المسار
if (errors.length > 0) return validationError(errors);
if (!foundUser) return unauthorizedError('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
```

---

## 5. auth.middleware — استخراج التوكن

### ٥.١ الفكرة

`authenticateRequest(request)` يقرأ رأس `Authorization: Bearer <token>`، يتحقق من التوكن، ويُرجع إما `{ userId }` أو `{ error: NextResponse }`. لا يرمي استثناءات — المسار يتفرّع حسب النتيجة.

### ٥.٢ الكود

```typescript
// auth.middleware.ts — authenticateRequest
export function authenticateRequest(request: NextRequest): AuthResult {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: unauthorizedError('رمز المصادقة مفقود.') };
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyToken(token);
    return { userId: payload.id };
  } catch {
    return { error: unauthorizedError('رمز المصادقة غير صالح أو منتهي الصلاحية.') };
  }
}
```

---

## 6. مسارات API — login، register، me

### ٦.١ تدفق تسجيل الدخول

```text
# Login flow
POST /api/auth/login { email, password }
  → validateLoginInput
  → userRepo.findByEmail
  → comparePassword
  → generateToken
  → { token, user }
```

### ٦.٢ تدفق التسجيل

```text
# Register flow
POST /api/auth/register { name, email, password, confirmPassword }
  → validateRegisterInput
  → userRepo.emailExists (409 إن وُجد)
  → hashPassword
  → userRepo.create
  → generateToken
  → { token, user }
```

### ٦.٣ تدفق جلب المستخدم الحالي

```text
# Me flow
GET /api/auth/me + Authorization: Bearer <token>
  → authenticateRequest (401 إن فشل)
  → userRepo.findById
  → { user } (بدون password)
```

---

## 7. AuthContext و useAuth

### ٧.١ AuthContext

يدير حالة المصادقة في العميل: التوكن في localStorage، المستخدم في الذاكرة. عند التحميل يقرأ التوكن ويستدعي `/api/auth/me`؛ عند 401 يمسح الجلسة.

| القيمة     | الوصف                                              |
| ---------- | -------------------------------------------------- |
| user       | المستخدم الحالي أو null                            |
| token      | التوكن (للإرسال مع الطلبات)                        |
| loading    | أثناء التحقق الأولي                                |
| login      | تسجيل الدخول وحفظ التوكن                           |
| register   | إنشاء حساب وتسجيل الدخول                           |
| logout     | مسح التوكن والمستخدم                               |
| updateUser | تحديث المستخدم في الذاكرة (بعد تعديل الملف الشخصي) |

### ٧.٢ useAuth

```typescript
// useAuth — خطاف مختصر
export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
```

- يُستدعى داخل `AuthProvider` فقط. لا تستخدم `useContext(AuthContext)` مباشرة — استخدم `useAuth()`.

---

## 8. GuestRoute و ProtectedRoute

### ٨.١ GuestRoute

للصفحات التي يراها الضيوف فقط (login، register). إن كان المستخدم مسجّلاً يُعاد توجيهه إلى `/` (أو `redirectTo`).

```tsx
// GuestRoute — استخدام
<GuestRoute>
  <LoginForm />
</GuestRoute>
```

- أثناء `loading` أو عند وجود `user`: يعرض مؤشر تحميل لتجنب وميض النموذج قبل إعادة التوجيه.

### ٨.٢ ProtectedRoute

للصفحات المحمية (my-photos، profile). إن لم يكن المستخدم مسجّلاً يُعاد توجيهه إلى `/login`.

```tsx
// ProtectedRoute — استخدام
<ProtectedRoute>
  <MyPhotosContent />
</ProtectedRoute>
```

---

## 9. ملخص

| ما تعلمناه                 | الملف المسؤول         |
| -------------------------- | --------------------- |
| JWT و bcrypt               | `auth.ts`             |
| التحقق من المدخلات         | `validators/index.ts` |
| رسائل الخطأ الموحدة        | `apiErrors.ts`        |
| استخراج التوكن من الرأس    | `auth.middleware.ts`  |
| مسارات login، register، me | `api/auth/*`          |
| حالة المصادقة في العميل    | `AuthContext.tsx`     |
| خطاف useAuth               | `useAuth.ts`          |
| حماية صفحات الضيوف         | `GuestRoute.tsx`      |
| حماية الصفحات المسجّلة     | `ProtectedRoute.tsx`  |

---

_الدرس السابق ← [03 — نمط المستودعات](03-repository-pattern.md)_  
_العودة إلى [فهرس الدروس](../README.md)_  
_الدرس التالي → [05 — استراتيجية التخزين](05-storage-strategy.md)_
