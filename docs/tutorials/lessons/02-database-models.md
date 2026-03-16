# الدرس 02: نماذج قاعدة البيانات

> هدف الدرس: فهم نماذج Mongoose الثلاثة (User، Photo، Like) وواجهات TypeScript المرتبطة بها، وكيف يتصل التطبيق بـ [MongoDB](../concepts-guide.md#3-mongodb-و-mongoose).

---

## 1. لمحة عامة

قبل كتابة أي استعلام أو مسار API، يجب تعريف **شكل البيانات**. النماذج (Models) تحدد الحقول والقيود والفهارس؛ وواجهات TypeScript تضمن اتساق الأنواع بين الخادم والعميل. اتصال MongoDB يُدار من ملف واحد يُستدعى في بداية كل مسار API.

**تشبيه:** النماذج كقوالب الطباعة: كل مستند (مستخدم، صورة، إعجاب) يجب أن يطابق القالب؛ والفهارس كالفهرس في آخر الكتاب — تسرّع العثور على الصفحة المطلوبة.

---

## 2. types.ts — الفصل بين الخادم والعميل

### ٢.١ الفكرة

العميل (المتصفح) لا يجب أن يستقبل كلمة المرور أو `ObjectId` الخام. واجهتان منفصلتان: **واجهة العميل** (User، Photo) للاستجابات JSON؛ **واجهة الخادم** (IUser، IPhoto، ILike) للمستندات Mongoose مع `password` و `ObjectId`.

### ٢.٢ التنفيذ في صوري

| النوع | الواجهة | الاستخدام |
|-------|---------|-----------|
| عميل | `User` | استجابة API — بدون password |
| عميل | `Photo` | استجابة API — مع `user` مقتطع و `isLiked` |
| خادم | `IUser` | نموذج Mongoose — مع password |
| خادم | `IPhoto` | نموذج Mongoose — مع user كـ ObjectId |
| خادم | `ILike` | نموذج Mongoose — بدون updatedAt |

### ٢.٣ واجهات العميل

```typescript
// types.ts — واجهات العميل
export interface User {
  _id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Photo {
  _id: string;
  title: string;
  description?: string;
  imageUrl: string;
  user: Pick<User, '_id' | 'name' | 'avatarUrl'>;
  likesCount: number;
  isLiked?: boolean;
  createdAt: string;
  updatedAt: string;
}
```

- `User` لا يحتوي `password` — لا يُرسل أبداً للعميل.
- `Photo.user` مقتطع (`Pick`) — فقط المعرّف والاسم والصورة الشخصية.
- `isLiked` يُضاف ديناميكياً عند جلب الصور للمستخدم المسجّل.

---

## 3. User.ts — نموذج المستخدم

### ٣.١ الحقول والقيود

| الحقل | النوع | القيود |
|-------|-------|--------|
| name | String | مطلوب، 3–50 حرف، trim |
| email | String | مطلوب، فريد، lowercase |
| password | String | مطلوب، 6 أحرف (bcrypt hash فقط) |
| avatarUrl | String | اختياري، null = عرض الأحرف الأولى |

### ٣.٢ الكود

```typescript
// User.ts — Schema
import mongoose, { Model, Schema } from 'mongoose';
import type { IUser } from '@/app/types';

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, minlength: 3, maxlength: 50 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    avatarUrl: { type: String, default: null, trim: true },
  },
  { timestamps: true }
);

const User: Model<IUser> = mongoose.models.User ?? mongoose.model<IUser>('User', userSchema);
export default User;
```

- `mongoose.models.User ??`: إعادة استخدام النموذج عند HMR لتجنب خطأ "Cannot overwrite model".
- `avatarUrl: null`: الواجهة تعرض Avatar بالأحرف الأولى عند عدم وجود صورة.

---

## 4. Photo.ts — نموذج الصورة

### ٤.١ الحقول والقيود

| الحقل | النوع | القيود |
|-------|-------|--------|
| title | String | مطلوب، 1–200 حرف |
| description | String | اختياري، حتى 2000 حرف |
| imageUrl | String | مطلوب (من Storage Service) |
| user | ObjectId | مرجع لـ User |
| likesCount | Number | افتراضي 0، مُحدّث بـ $inc |

### ٤.٢ الفهارس

```typescript
// Photo.ts — الفهارس
photoSchema.index({ user: 1 });       // استعلام صور مستخدم معيّن
photoSchema.index({ createdAt: -1 });  // ترتيب الأحدث أولاً في الصفحة الرئيسية
```

### ٤.٣ likesCount المُخزّن

`likesCount` مُخزّن في المستند لتجنب استعلام `COUNT` على مجموعة Like في كل طلب عرض. يُحدّث بـ `$inc: { likesCount: 1 }` أو `-1` عند كل تبديل إعجاب.

---

## 5. Like.ts — نموذج الإعجاب

### ٥.١ الحقول والقيود

| الحقل | النوع | القيود |
|-------|-------|--------|
| user | ObjectId | مرجع لـ User |
| photo | ObjectId | مرجع لـ Photo |

- `updatedAt` معطّل — الإعجاب ثابت بعد الإنشاء؛ التبديل = حذف + إنشاء.

### ٥.٢ الفهرس المركب الفريد

```typescript
// Like.ts — فهرس مركب
likeSchema.index({ user: 1, photo: 1 }, { unique: true });
likeSchema.index({ photo: 1 });
```

- `{ user, photo }` unique: يمنع تكرار الإعجاب على مستوى قاعدة البيانات حتى مع طلبات متزامنة.
- `{ photo: 1 }`: تسريع حذف الإعجابات عند حذف الصورة (cascade).

---

## 6. mongodb.ts — اتصال قاعدة البيانات

### ٦.١ الفكرة

الاتصال يُخزَّن في `globalThis` ليبقى عبر HMR في التطوير وعبر استدعاءات serverless في الإنتاج. `connectDB()` آمن للاستدعاء في كل مسار API — الاستدعاءات اللاحقة فورية.

### ٦.٢ المتغيرات البيئية

```typescript
// mongodb.ts — ترتيب التحقق
function getMongoUri(): string {
  const uri = process.env.DATABASE_URL || process.env.MONGODB_URI || process.env.DB_URL;
  if (!uri) throw new Error('Database URL is missing...');
  return uri;
}
```

### ٦.٣ connectDB و getConnectionStatus

```typescript
// mongodb.ts — connectDB مقتطف
export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(getMongoUri(), {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
```

- `serverSelectionTimeoutMS: 5000`: فشل سريع عند عدم توفر الخادم (مفيد لفحص الصحة).

---

## 7. العلاقات بين النماذج

```text
# Entity relationships
User  ──< Photo   (مستخدم يملك عدة صور)
User  ──< Like    (مستخدم يضع عدة إعجابات)
Photo ──< Like    (صورة تملك عدة إعجابات)
```

عند حذف صورة: تُحذف إعجاباتها أولاً ثم الملف من التخزين ثم المستند. عند حذف حساب: تُحذف صور المستخدم وإعجاباته ثم المستخدم.

---

## 8. ملخص

| ما تعلمناه | الملف المسؤول |
|------------|---------------|
| واجهات العميل (بدون password) | `types.ts` — User، Photo |
| واجهات الخادم (Mongoose) | `types.ts` — IUser، IPhoto، ILike |
| نموذج المستخدم + avatarUrl | `User.ts` |
| نموذج الصورة + likesCount + فهارس | `Photo.ts` |
| نموذج الإعجاب + فهرس مركب فريد | `Like.ts` |
| اتصال MongoDB المُخزَّن | `mongodb.ts` |

للمرجع التقني الكامل للنماذج والعلاقات ← [docs/database-abstraction.md](../../database-abstraction.md)

---

*الدرس السابق ← [01 — إعداد المشروع والبنية الأساسية](01-project-setup.md)*  
*العودة إلى [فهرس الدروس](../README.md)*  
*الدرس التالي → [03 — نمط المستودعات](03-repository-pattern.md)*
