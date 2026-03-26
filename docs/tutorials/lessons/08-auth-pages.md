# الدرس 08: صفحات المصادقة

> هدف الدرس: فهم صفحات تسجيل الدخول وإنشاء الحساب في صوري — المكونات المشتركة (`AuthFormLayout`، `PasswordField`، `SubmitButton`)، التحقق من المدخلات، حماية الضيوف (`GuestRoute` + **Edge Middleware**)، وربطها بـ [JWT والجلسة (Cookie HttpOnly)](../concepts-guide.md) — القسم 5.

---

## 1. لمحة عامة

صفحتا `/login` و `/register` تستخدمان نفس الهيكل: `MainLayout` → `AuthFormLayout` → نموذج. المكونات المشتركة (`AuthFormLayout`، `PasswordField`، `SubmitButton`) تُبنى مرة واحدة وتُعاد استخدامها. التحقق يحدث على العميل قبل استدعاء API؛ المستخدم المسجّل يُعاد توجيهه تلقائياً إلى الرئيسية.

**تشبيه:** صفحتا تسجيل الدخول وإنشاء الحساب كشاشتين في نفس المبنى — نفس التصميم (ورقة، عنوان، منطقة أخطاء، تذييل)، لكن الحقول والإجراءات تختلف.

---

## 2. AuthFormLayout — الهيكل المشترك

### ٢.١ الفكرة

`AuthFormLayout` يغلف النموذج في `Paper` موحد: عنوان، وصف فرعي، منطقة أخطاء (Alert)، فتحة للنموذج، وتذييل. الصفحة تمرّر `title`، `subtitle`، `errors`، `form` (كـ ReactNode)، و `footer` (رابط للصفحة الأخرى).

### ٢.٢ الواجهة

| الخاصية  | النوع     | الوصف                             |
| -------- | --------- | --------------------------------- |
| title    | string    | العنوان الرئيسي (مثل اسم التطبيق) |
| subtitle | string    | وصف قصير تحت العنوان              |
| errors   | string[]  | قائمة رسائل الخطأ لعرضها في Alert |
| form     | ReactNode | محتوى النموذج (الحقول والأزرار)   |
| footer   | ReactNode | تذييل (عادة رابط للصفحة الأخرى)   |

### ٢.٣ الكود

```typescript
// AuthFormLayout.tsx — الهيكل
export function AuthFormLayout({ title, subtitle, errors, form, footer }: AuthFormLayoutProps) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: { xs: 4, sm: 8 }, px: 2 }}>
      <Paper elevation={2} sx={{ p: { xs: 3, sm: 4 }, maxWidth: 420, borderRadius: 2 }}>
        <Typography variant="h5" component="h1" fontWeight={700}>{title}</Typography>
        <Typography variant="body2" color="text.secondary">{subtitle}</Typography>

        {errors.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.map((err, i) => <span key={i} style={{ display: 'block' }}>{err}</span>)}
          </Alert>
        )}

        {form}
        <Typography variant="body2" color="text.secondary" mt={2.5}>{footer}</Typography>
      </Paper>
    </Box>
  );
}
```

---

## 3. PasswordField — حقل كلمة المرور مع إظهار/إخفاء

### ٣.١ الفكرة

`PasswordField` يلف `TextField` ويضيف زر إظهار/إخفاء في نهاية الحقل. النوع يتغير بين `password` و `text` حسب `showPassword`. الصفحة تدير `showPassword` وتمرّر `onToggleShow` لأن الحالة قد تُشارك (مثل صفحة التسجيل حيث حقلان لكلمة المرور).

### ٣.٢ الخصائص

| الخاصية                    | النوع                       | الوصف                                |
| -------------------------- | --------------------------- | ------------------------------------ |
| label                      | string                      | تسمية الحقل                          |
| value, onChange            | string, (v: string) => void | قيمة الحقل وتحديثها                  |
| showPassword, onToggleShow | boolean, () => void         | حالة الإظهار وتبديلها                |
| autoComplete               | string                      | `current-password` أو `new-password` |
| required                   | boolean                     | افتراضي true                         |

### ٣.٣ الكود

```typescript
// PasswordField.tsx — مقتطف
<TextField
  label={label}
  type={showPassword ? 'text' : 'password'}
  value={value}
  onChange={(e) => onChange(e.target.value)}
  fullWidth
  required={required}
  slotProps={{
    input: {
      endAdornment: (
        <InputAdornment position="end">
          <IconButton onClick={onToggleShow} aria-label={showPassword ? 'إخفاء كلمة المرور' : 'عرض كلمة المرور'}>
            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
          </IconButton>
        </InputAdornment>
      ),
    },
  }}
/>
```

---

## 4. SubmitButton — زر الإرسال مع حالة التحميل

### ٤.١ الفكرة

`SubmitButton` زر `type="submit"` يعرض `CircularProgress` عند `loading` بدلاً من النص. يُعطّل عند `disabled` أو `loading` لتجنب الإرسال المزدوج.

### ٤.٢ الكود

```typescript
// SubmitButton.tsx
<Button
  type="submit"
  variant="contained"
  fullWidth
  disabled={disabled || loading}
  sx={{ mt: 2.5, py: 1.25, minHeight: 48, fontSize: '1rem' }}
>
  {loading ? <CircularProgress size={22} color="inherit" /> : children}
</Button>
```

---

## 5. صفحة تسجيل الدخول — login/page.tsx

### ٥.١ التدفق

1. **حماية الضيوف:** إذا `loading` أو `user` موجود → `return null` وتشغيل `router.replace('/')` في `useEffect` لتجنب وميض النموذج.
2. **التحقق:** عند الإرسال، `validateLoginInput({ email, password })` يُرجع قائمة أخطاء. إن وُجدت → عرضها في Alert ولا استدعاء API.
3. **الإرسال:** `login(email.trim(), password)` من `useAuth` — يرمي عند فشل الخادم.
4. **النجاح:** `router.push('/')`.
5. **الفشل:** `setServerError(err.message)` أو رسالة افتراضية.

### ٥.٢ دمج الأخطاء

```typescript
// login/page.tsx — دمج أخطاء التحقق وأخطاء الخادم
const displayErrors =
  validationErrors.length > 0 ? validationErrors : serverError ? [serverError] : [];
```

أخطاء التحقق لها أولوية؛ إن لم توجد، تُعرض رسالة الخادم.

### ٥.٣ الحقول

| الحقل             | النوع                  | التحقق           |
| ----------------- | ---------------------- | ---------------- |
| البريد الإلكتروني | TextField type="email" | صيغة بريد صحيحة  |
| كلمة المرور       | PasswordField          | 6 أحرف على الأقل |

---

## 6. صفحة إنشاء الحساب — register/page.tsx

### ٦.١ التدفق

نفس منطق تسجيل الدخول: حماية الضيوف، تحقق عميل، استدعاء `register()` من `useAuth`، توجيه عند النجاح، عرض أخطاء الخادم عند الفشل.

### ٦.٢ الحقول

| الحقل             | النوع                                 | التحقق            |
| ----------------- | ------------------------------------- | ----------------- |
| الاسم             | TextField                             | 3–50 حرف          |
| البريد الإلكتروني | TextField type="email"                | صيغة بريد صحيحة   |
| كلمة المرور       | PasswordField                         | 6 أحرف على الأقل  |
| تأكيد كلمة المرور | TextField (نوع يتغير مع showPassword) | مطابق لـ password |

حقل التأكيد لا يستخدم `PasswordField` لأنه لا يحتاج زر إظهار منفصل — يُشارك `showPassword` مع حقل كلمة المرور.

### ٦.٣ استدعاء التسجيل

```typescript
// register/page.tsx — استدعاء register
await register({
  name: name.trim(),
  email: email.trim(),
  password,
  confirmPassword,
});
```

`AuthContext.register()` يرسل الطلب إلى API ويخزّن التوكن والمستخدم عند النجاح.

---

## 7. الربط مع الدروس الأخرى

| الملف                                     | الدرس المرتبط                                       |
| ----------------------------------------- | --------------------------------------------------- |
| useAuth، login، register                  | [04 — المصادقة والحماية](04-authentication.md)      |
| validateLoginInput، validateRegisterInput | [04 — المصادقة والحماية](04-authentication.md)      |
| MainLayout                                | [07 — نظام السمات والتخطيط](07-theme-and-layout.md) |
| login.test.tsx، register.test.tsx         | [11 — الاختبارات الشاملة](11-testing.md)            |

---

## 8. ملخص

| ما تعلمناه                     | الملف المسؤول                         |
| ------------------------------ | ------------------------------------- |
| هيكل النموذج المشترك           | `components/auth/AuthFormLayout.tsx`  |
| حقل كلمة المرور مع إظهار/إخفاء | `components/common/PasswordField.tsx` |
| زر الإرسال مع حالة التحميل     | `components/common/SubmitButton.tsx`  |
| صفحة تسجيل الدخول              | `login/page.tsx`                      |
| صفحة إنشاء الحساب              | `register/page.tsx`                   |

---

_الدرس السابق ← [07 — نظام السمات والتخطيط](07-theme-and-layout.md)_  
_العودة إلى [فهرس الدروس](../README.md)_  
_الدرس التالي → [09 — واجهة الصور (CRUD + الإعجاب)](09-photos-crud.md)_
