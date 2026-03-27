# إعداد البيئة المحلية للتجريب

## 1. قاعدة البيانات (MongoDB)

### خيار أ: MongoDB محلي

إذا MongoDB مثبت على جهازك:

```bash
npm run db:init
```

تأكد أن `.env.local` يحتوي على `DATABASE_URL=mongodb://127.0.0.1:27017/web-social-e1` (استخدم `127.0.0.1` بدل `localhost` لتجنب مشاكل IPv6).

### خيار ب: MongoDB Atlas (سحابي مجاني)

1. ادخل إلى [cloud.mongodb.com](https://cloud.mongodb.com) وأنشئ حسابًا.
2. أنشئ Cluster مجاني (Free Tier).
3. من **Database** → **Connect** → **Connect your application** انسخ رابط الاتصال.
4. استبدل `<password>` بكلمة مرور المستخدم الذي أنشأته.
5. إذا كلمة المرور تحتوي رموزًا خاصة (`@`, `#`, `%`, إلخ) ارمِزها بصيغة URL:
   - `@` → `%40`
   - `#` → `%23`
   - `%` → `%25`
6. ضع الرابط في `.env.local`:

```env
DATABASE_URL=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/web-social-e1?retryWrites=true&w=majority
```

## 2. التخزين (Storage)

للتجريب المحلي استخدم `STORAGE_TYPE=local` — الملفات تُحفظ في `public/uploads/`.

## 3. المصادقة المحلية

- عيّن `JWT_SECRET` في `.env.local` (أي سلسلة عشوائية طويلة للتطوير).
- الجلسة تُخزَّن في **Cookie HttpOnly** (`auth-token`) بعد تسجيل الدخول؛ في التطوير (`NODE_ENV=development`) الـ cookie **ليس** `Secure`، فيعمل على `http://localhost` دون HTTPS.
- الخادم يتحقق أيضًا من `sessionVersion` لكل مستخدم؛ تسجيل الخروج أو تغيير كلمة المرور يُبطل الجلسات السابقة ويتطلب تسجيل دخول جديد.

## 4. التحقق

```bash
npm run dev
```

ثم افتح `http://localhost:3000/api/health` — يجب أن ترى:

```json
{
  "status": "healthy",
  "database": "connected",
  "repositories": { "user": true, "photo": true, "like": true },
  "storage": { "type": "local", "healthy": true }
}
```

إذا ظهر `databaseError` أو `storage.error`، راجع الرسالة الظاهرة في الاستجابة.

لتفاصيل مسارات API والجلسة: [api-endpoints.md](api-endpoints.md) و [README.md](../README.md) (قسم تدفق المصادقة).
