# مرجع سريع للمستودعات — صوري

> أمثلة كود لعمليات المستودعات الشائعة.

---

## 1. الوصول للمستودعات

```typescript
import { getRepositoryManager } from '@/app/repositories';

const repos = getRepositoryManager();
```

---

## 2. UserRepository

```typescript
// UserRepository: findByEmail, emailExists, create, update, deleteUserCascade
// البحث بالبريد
const user = await repos.user.findByEmail('ahmed@example.com');

// التحقق من وجود البريد
const taken = await repos.user.emailExists('ahmed@example.com');

// إنشاء مستخدم
const newUser = await repos.user.create({
  name: 'أحمد',
  email: 'ahmed@example.com',
  password: hashedPassword,
});

// تحديث
await repos.user.update(userId, { name: 'أحمد محمد' });

// حذف الحساب (cascade: صور + إعجابات + ملف الصورة الشخصية)
await repos.user.deleteUserCascade(userId);
```

---

## 3. PhotoRepository

```typescript
// PhotoRepository: findPublicFeed, findPaginated, create, update, delete
// الصفحة الرئيسية — أحدث الصور مع pagination
const result = await repos.photo.findPublicFeed(page, limit);
// result: { rows, count, page, totalPages }

// صور مستخدم معيّن
const result = await repos.photo.findPaginated(1, 12, { user: userId });

// إنشاء صورة
const photo = await repos.photo.create({
  title: 'عنوان',
  description: 'وصف',
  imageUrl: url,
  user: userId,
});

// تعديل
await repos.photo.update(photoId, { title: 'عنوان جديد' });

// حذف
await repos.photo.delete(photoId);
```

---

## 4. LikeRepository

```typescript
// LikeRepository: toggleLike, findAll
// تبديل الإعجاب (like/unlike)
const { liked, likesCount } = await repos.like.toggleLike(userId, photoId);

// قائمة إعجابات مستخدم على مجموعة صور
const likes = await repos.like.findAll({
  user: userId,
  photo: { $in: photoIds },
});
```

---

## 5. العمليات المشتركة (BaseRepository)

```typescript
// findById
const doc = await repos.user.findById(id);

// exists
const found = await repos.photo.exists({ user: userId });

// count
const total = await repos.photo.count({ user: userId });
```

---

*للشرح المعماري الكامل، راجع [database-abstraction.md](database-abstraction.md).*
