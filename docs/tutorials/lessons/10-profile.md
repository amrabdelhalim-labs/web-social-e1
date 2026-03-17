# الدرس 10: الملف الشخصي

> هدف الدرس: فهم صفحة الملف الشخصي في صوري — رفع الصورة الشخصية (من الجهاز أو الكاميرا)، تعديل الاسم والبريد، تغيير كلمة المرور، وحذف الحساب مع تأكيد كلمة المرور، وربطها بـ [JWT عبر AuthContext](../concepts-guide.md#5-jwt-json-web-token).

---

## 1. لمحة عامة

صفحة `/profile` محمية بـ `ProtectedRoute` وتجمع أربعة أقسام: صورة شخصية (رفع/حذف)، تعديل البيانات (الاسم والبريد)، تغيير كلمة المرور، ومنطقة الخطر (حذف الحساب). كل مكون يستدعي API مباشرة ويحدّث `AuthContext` عبر `updateUser` عند النجاح.

**تشبيه:** صفحة الملف الشخصي مثل مكتب استقبال — كل قسم نافذة مستقلة (صورة، بيانات، كلمة مرور، حذف)، لكن كلها تخدم نفس الحساب وتُحدّثه عند الإنجاز.

---

## 2. AvatarUploader — الصورة الشخصية

### ٢.١ الفكرة

يعرض Avatar بحجم 120×120 مع fallback للأحرف الأولى عند عدم وجود صورة. عند النقر يفتح قائمة: رفع من الجهاز، التقاط بالكاميرا، حذف الصورة الحالية (إن وُجدت).

### ٢.٢ Optimistic Preview

قبل استجابة الخادم، يُعرض `URL.createObjectURL(file)` كمعاينة فورية. عند النجاح يُستدعى `updateUser(res.data)` ويُزال الـ object URL؛ عند الفشل يُعاد العرض السابق.

```typescript
// AvatarUploader — optimistic preview
const objectUrl = URL.createObjectURL(file);
setOptimisticUrl(objectUrl);
try {
  const res = await uploadAvatarApi(file);
  if (res.data) updateUser(res.data);
  setOptimisticUrl(null);
  URL.revokeObjectURL(objectUrl);
} catch (err) {
  setOptimisticUrl(null);
  URL.revokeObjectURL(objectUrl);
  setError(...);
}
```

### ٢.٣ التحقق والحدود

| الفحص      | الحد                              |
| ---------- | --------------------------------- |
| صيغة الملف | PNG، JPEG فقط                     |
| الحجم      | AVATAR_MAX_FILE_SIZE (2 ميجابايت) |

### ٢.٤ التقاط بالكاميرا

يفتح `CameraCapture` داخل Dialog. عند اختيار "استخدام" يُستدعى `handleCapture(file)` الذي يرفع الملف ويحدّث المستخدم.

---

## 3. ProfileEditor — تعديل الاسم والبريد

### ٣.١ الفكرة

كل حقل (الاسم، البريد) له وضعان: عرض (نص + أيقونة تعديل) وتعديل (TextField + حفظ/إلغاء). عند الحفظ يُستدعى `validateUpdateUserInput` ثم `updateProfileApi`، وعند النجاح `updateUser(res.data)`.

### ٣.٢ التدفق

| الخطوة | الإجراء                                                      |
| ------ | ------------------------------------------------------------ |
| 1      | النقر على أيقونة التعديل → `setEditing('name')` أو `'email'` |
| 2      | إدخال القيمة الجديدة                                         |
| 3      | النقر على ✓ → التحقق ثم API ثم `updateUser`                  |
| 4      | النقر على ✕ → إلغاء وإعادة القيمة الأصلية                    |

### ٣.٣ الكود

```typescript
// ProfileEditor — حفظ حقل واحد
const input = field === 'name' ? { name: trimmedName } : { email: trimmedEmail };
const errors = validateUpdateUserInput(input);
if (errors.length > 0) {
  setMessage({ type: 'error', text: errors[0] });
  return;
}
const res = await updateProfileApi(input);
if (res.data) updateUser(res.data);
setMessage({ type: 'success', text: '...' });
setEditing(null);
```

---

## 4. ChangePasswordForm — تغيير كلمة المرور

### ٤.١ الفكرة

ثلاثة حقول: كلمة المرور الحالية، الجديدة، التأكيد. يستخدم `PasswordField` المشترك. التحقق عبر `validateChangePasswordInput` ثم استدعاء `changePasswordApi`.

### ٤.٢ بعد النجاح

تُفرّغ الحقول وتُعرض رسالة نجاح. لا حاجة لـ `updateUser` — كلمة المرور لا تُعاد في الاستجابة.

```typescript
// ChangePasswordForm — بعد النجاح
await changePasswordApi({ currentPassword, newPassword, confirmPassword });
setMessage({ type: 'success', text: 'تم تغيير كلمة المرور بنجاح.' });
setCurrentPassword('');
setNewPassword('');
setConfirmPassword('');
```

---

## 5. DeleteAccountDialog — حذف الحساب

### ٥.١ الفكرة

نافذة حمراء (منطقة الخطر) تتطلب إدخال كلمة المرور للتأكيد. عند النجاح: `deleteAccountApi` → `logout` → `router.push('/')`.

### ٥.٢ الحماية

- `disableEscapeKeyDown={deleting}` — منع الإغلاق بالضغط على Escape أثناء الحذف
- زر "حذف حسابي" معطّل عند `!password.trim()`

### ٥.٣ التدفق

```typescript
// DeleteAccountDialog — حذف الحساب
await deleteAccountApi(password);
logout();
handleClose();
router.push('/');
```

---

## 6. صفحة الملف الشخصي — profile/page.tsx

### ٦.١ الهيكل

```typescript
// profile/page.tsx
export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
```

### ٦.٢ الأقسام

| القسم             | المكون                      |
| ----------------- | --------------------------- |
| صورتي الشخصية     | AvatarUploader داخل Paper   |
| البيانات الشخصية  | ProfileEditor               |
| تغيير كلمة المرور | ChangePasswordForm          |
| منطقة الخطر       | زر يفتح DeleteAccountDialog |

---

## 7. الربط مع الدروس الأخرى

| الملف                                                                                   | الدرس المرتبط                                       |
| --------------------------------------------------------------------------------------- | --------------------------------------------------- |
| useAuth، updateUser، ProtectedRoute                                                     | [04 — المصادقة والحماية](04-authentication.md)      |
| uploadAvatarApi، deleteAvatarApi، updateProfileApi، changePasswordApi، deleteAccountApi | [06 — مسارات API](06-api-routes.md)                 |
| MainLayout                                                                              | [07 — نظام السمات والتخطيط](07-theme-and-layout.md) |
| PasswordField                                                                           | [08 — صفحات المصادقة](08-auth-pages.md)             |
| CameraCapture                                                                           | [09 — واجهة الصور](09-photos-crud.md)               |
| validateUpdateUserInput، validateChangePasswordInput                                    | [04 — المصادقة والحماية](04-authentication.md)      |
| AvatarUploader.test، DeleteAccountDialog.test، ...                                      | [11 — الاختبارات الشاملة](11-testing.md)            |

---

## 8. ملخص

| ما تعلمناه             | الملف المسؤول                                |
| ---------------------- | -------------------------------------------- |
| رفع/حذف الصورة الشخصية | `components/profile/AvatarUploader.tsx`      |
| تعديل الاسم والبريد    | `components/profile/ProfileEditor.tsx`       |
| تغيير كلمة المرور      | `components/profile/ChangePasswordForm.tsx`  |
| حذف الحساب مع تأكيد    | `components/profile/DeleteAccountDialog.tsx` |
| صفحة الملف الشخصي      | `profile/page.tsx`                           |

---

_الدرس السابق ← [09 — واجهة الصور (CRUD + الإعجاب)](09-photos-crud.md)_  
_العودة إلى [فهرس الدروس](../README.md)_  
_الدرس التالي → [11 — الاختبارات الشاملة](11-testing.md)_
