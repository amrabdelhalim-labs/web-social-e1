# الدرس 04: المصادقة والحماية

> هدف الدرس: فهم نظام المصادقة في صوري — [JWT](../concepts-guide.md#5-jwt-json-web-token) و bcrypt، التحقق من المدخلات، حماية المسارات، والسياق العميل.

---

## 1. لمحة عامة

المصادقة في صوري **عديمة الحالة** على الخادم (لا جدول جلسات): الـ JWT يحمل المعرّف ويُتحقق من توقيعه. **تخزين الجلسة في المتصفح:** Cookie **HttpOnly** (`auth-token`) وليس localStorage. التحقق من المدخلات يحدث قبل قاعدة البيانات؛ **حماية الصفحات** تتم على مستويين: **Proxy** يمنع الوصول بدون cookie، ومكونات `ProtectedRoute` / `GuestRoute` تكمّل التجربة على العميل.

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

`authenticateRequest(request)` يقرأ الـ JWT من **cookie `auth-token` أولاً**، ثم من رأس `Authorization: Bearer <token>` كبديل. يتحقق عبر `verifyToken` ويُرجع إما `{ userId }` أو `{ error: NextResponse }`. لا يرمي استثناءات — المسار يتفرّع حسب النتيجة.

### ٥.٢ الكود (مبسّط)

```typescript
// auth.middleware.ts — أولوية: cookie ثم Bearer
const cookieToken = request.cookies.get(AUTH_COOKIE_NAME)?.value ?? null;
const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
const token = cookieToken ?? bearerToken;
if (!token) return { error: unauthorizedError('رمز المصادقة مفقود.') };
// ثم verifyToken(token) → userId
```

إعدادات الـ cookie مركّزة في `lib/authCookie.ts` (`httpOnly`, `sameSite`, `secure` في الإنتاج).

### ٥.٣ Proxy — حماية المسارات

ملف **`src/proxy.ts`** يعمل قبل رندر الصفحة: إن زار مستخدم غير مسجّل مساراتًا محمية (`/my-photos`، `/profile`) بلا cookie، يُعاد توجيهه إلى `/login?next=...`.  
أما صفحات الضيف (`/login`، `/register`) فيديرها العميل عبر `GuestRoute` (وليست ضمن redirect logic في Proxy). التحقق في Proxy هو **وجود الـ cookie** فقط؛ التحقق الكامل من صلاحية JWT و`sessionVersion` يبقى في مسارات API.

---

## 6. مسارات API — login، register، logout، me

### ٦.١ تدفق تسجيل الدخول

```text
# Login flow
POST /api/auth/login { email, password }
  → validateLoginInput
  → userRepo.findByEmail
  → comparePassword
  → generateToken
  → Set-Cookie: auth-token=...
  → JSON: { data: { user } }   (بدون token في الجسم)
```

### ٦.٢ تدفق التسجيل

```text
# Register flow
POST /api/auth/register { ... }
  → ... إنشاء مستخدم
  → generateToken
  → Set-Cookie + { data: { user } }
```

### ٦.٣ تسجيل الخروج

```text
POST /api/auth/logout
  → يمسح cookie auth-token من الاستجابة
```

### ٦.٤ تدفق جلب المستخدم الحالي

```text
# Me flow
GET /api/auth/me  (الـ cookie تُرسَل تلقائيًا من المتصفح)
  → authenticateRequest (401 إن فشل)
  → userRepo.findById
  → { user } (بدون password)
```

---

## 7. AuthContext و useAuth

### ٧.١ AuthContext

يدير **المستخدم في الذاكرة فقط** — لا يخزّن JWT في JavaScript. عند التحميل يستدعي `GET /api/auth/me` (الـ cookie تُرسَل تلقائيًا)؛ عند 401 يُصفَّر المستخدم. `login` / `register` يحدّثان `user` من جسم الاستجابة بعد أن يضبط الخادم الـ cookie. `logout` يستدعي `POST /api/auth/logout` ثم يصفّر المستخدم محليًا.

| القيمة     | الوصف                                              |
| ---------- | -------------------------------------------------- |
| user       | المستخدم الحالي أو null                            |
| loading    | أثناء التحقق الأولي (`/api/auth/me`)               |
| login      | تسجيل الدخول — الخادم يضبط الـ cookie              |
| register   | إنشاء حساب — الخادم يضبط الـ cookie                |
| logout     | مسح الجلسة على الخادم + تصفير المستخدم محليًا      |
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

للصفحات المحمية (my-photos، profile). إن لم يكن المستخدم مسجّلاً يُعاد توجيهه إلى `/login`. يكمّل **Middleware** الذي يمنع رندر الصفحة بدون cookie من الأساس.

```tsx
// ProtectedRoute — استخدام
<ProtectedRoute>
  <MyPhotosContent />
</ProtectedRoute>
```

---

## 9. ملخص

| ما تعلمناه                         | الملف / الموقع        |
| ---------------------------------- | --------------------- |
| JWT و bcrypt                       | `auth.ts`             |
| التحقق من المدخلات                 | `validators/index.ts` |
| رسائل الخطأ الموحدة                | `apiErrors.ts`        |
| استخراج التوكن (cookie + Bearer)   | `auth.middleware.ts`  |
| خيارات cookie الجلسة               | `lib/authCookie.ts`   |
| مسارات login، register، logout، me | `api/auth/*`          |
| حماية مسارات Proxy                 | `src/proxy.ts`        |
| حالة المستخدم في العميل            | `AuthContext.tsx`     |
| خطاف useAuth                       | `useAuth.ts`          |
| حماية صفحات الضيوف                 | `GuestRoute.tsx`      |
| حماية الصفحات المسجّلة             | `ProtectedRoute.tsx`  |

---

_الدرس السابق ← [03 — نمط المستودعات](03-repository-pattern.md)_  
_العودة إلى [فهرس الدروس](../README.md)_  
_الدرس التالي → [05 — استراتيجية التخزين](05-storage-strategy.md)_
