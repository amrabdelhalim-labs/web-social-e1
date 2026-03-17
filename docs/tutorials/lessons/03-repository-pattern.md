# الدرس 03: نمط المستودعات

> هدف الدرس: فهم [نمط المستودعات](../concepts-guide.md#4-نمط-المستودعات-repository-pattern) في صوري — العقد العام، التنفيذ الأساسي، المستودعات الخاصة، ونقطة الوصول الموحدة.

---

## 1. لمحة عامة

مسارات API لا تتحدث مباشرة مع Mongoose. كل عمليات القراءة والكتابة تتم عبر **المستودعات** (Repositories). هذا يفصل منطق التطبيق عن تفاصيل قاعدة البيانات، ويُسهّل الاختبار واستبدال مصدر البيانات.

**تشبيه:** المستودع وكيل بينك وبين المستودع الفعلي: تطلب "صورة رقم 5" وهو يعرف كيف يذهب ويجلبها من الرف المناسب دون أن تعرف تفاصيل التخزين.

---

## 2. IRepository — العقد العام

### ٢.١ الفكرة

كل مستودع يُنفّذ واجهة `IRepository<T>` تضمن العمليات الأساسية. المسارات API لا تعرف إن كان التخزين Mongoose أو غيره.

### ٢.٢ العمليات في العقد

| العملية             | الوصف                            |
| ------------------- | -------------------------------- |
| findAll             | قائمة بفلتر واختيارات            |
| findOne، findById   | مستند واحد                       |
| findPaginated       | قائمة مع pagination وعدد الصفحات |
| create              | إنشاء مستند                      |
| update، updateWhere | تحديث                            |
| delete، deleteWhere | حذف                              |
| exists، count       | تحقق خفيف                        |

### ٢.٣ الكود

```typescript
// repository.interface.ts — مقتطف
export interface IRepository<T extends Document> {
  findAll(filter?: QueryFilter<T>, options?: QueryOptions<T>): Promise<T[]>;
  findOne(filter: QueryFilter<T>, options?: QueryOptions<T>): Promise<T | null>;
  findById(id: string, options?: QueryOptions<T>): Promise<T | null>;
  findPaginated(
    page: number,
    limit: number,
    filter?: QueryFilter<T>,
    options?: QueryOptions<T>
  ): Promise<PaginatedResult<T>>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: UpdateQuery<T>): Promise<T | null>;
  delete(id: string): Promise<T | null>;
  exists(filter: QueryFilter<T>): Promise<boolean>;
  count(filter?: QueryFilter<T>): Promise<number>;
}
```

---

## 3. BaseRepository — التنفيذ العام

### ٣.١ الفكرة

`BaseRepository<T>` يطبّق `IRepository<T>` باستخدام Mongoose. المستودعات الخاصة ترث منه وتضيف عمليات مخصّصة.

### ٣.٢ قرارات التصميم

| القرار                                       | السبب                               |
| -------------------------------------------- | ----------------------------------- |
| `findPaginated` يحدّد limit بـ MAX_PAGE_SIZE | منع استعلامات غير محدودة            |
| `update` مع `returnDocument: 'after'`        | إرجاع المستند المحدّث مباشرة        |
| `exists` بدل `findOne`                       | تحقق خفيف بدون تحميل المستند كاملاً |

### ٣.٣ findPaginated — تنفيذ متوازي

```typescript
// base.repository.ts — findPaginated مقتطف
async findPaginated(
  page: number = 1,
  limit: number = 10,
  filter: QueryFilter<T> = {} as QueryFilter<T>,
  options: QueryOptions<T> = {}
): Promise<PaginatedResult<T>> {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), MAX_PAGE_SIZE);
  const skip = (safePage - 1) * safeLimit;

  const [rows, count] = await Promise.all([
    this.model.find(filter, null, { ...options, skip, limit: safeLimit }),
    this.model.countDocuments(filter),
  ]);

  return { rows, count, page: safePage, totalPages: Math.max(1, Math.ceil(count / safeLimit)) };
}
```

- `Promise.all`: تنفيذ الاستعلام والعد في نفس الوقت لتقليل زمن الاستجابة.

---

## 4. UserRepository — العمليات الإضافية

### ٤.١ العمليات المخصّصة

| العملية           | الوصف                           |
| ----------------- | ------------------------------- |
| findByEmail       | البحث بالبريد (lowercase، trim) |
| emailExists       | تحقق خفيف من وجود البريد        |
| deleteUserCascade | حذف المستخدم وكل صوره وإعجاباته |

### ٤.٢ deleteUserCascade — ترتيب الحذف

```typescript
// user.repository.ts — ترتيب الحذف
// 1. إعجابات على صور المستخدم
// 2. إعجابات المستخدم على صور الآخرين
// 3. صور المستخدم
// 4. المستخدم نفسه
```

- يستخدم transaction عند توفر Replica Set.
- عند MongoDB standalone (مثل التطوير المحلي): fallback تلقائي لعمليات متسلسلة عند فشل transaction (كود 20).

---

## 5. PhotoRepository — العمليات الإضافية

### ٥.١ العمليات المخصّصة

| العملية          | الوصف                                             |
| ---------------- | ------------------------------------------------- |
| findByUser       | صور مستخدم معيّن مع pagination                    |
| findPublicFeed   | الصفحة الرئيسية — أحدث الصور مع populate للمستخدم |
| updateLikesCount | تحديث `likesCount` بـ $inc                        |

### ٥.٢ findPublicFeed

```typescript
// photo.repository.ts — findPublicFeed
async findPublicFeed(page: number, limit: number): Promise<PaginatedResult<IPhoto>> {
  return this.findPaginated(page, limit, {} as QueryFilter<IPhoto>, {
    sort: { createdAt: -1 },
    populate: { path: 'user', select: 'name avatarUrl' },
  });
}
```

- `populate`: جلب اسم المستخدم وصورته الشخصية مع كل صورة دون استعلام منفصل لكل صورة.

### ٥.٣ updateLikesCount

```typescript
// photo.repository.ts — تحديث ذري
async updateLikesCount(photoId: string, delta: 1 | -1): Promise<IPhoto | null> {
  return this.update(photoId, { $inc: { likesCount: delta } });
}
```

- `$inc`: عملية ذرية — آمنة مع طلبات متزامنة.

---

## 6. LikeRepository — العمليات الإضافية

### ٦.١ العمليات المخصّصة

| العملية            | الوصف                        |
| ------------------ | ---------------------------- |
| findByUserAndPhoto | إعجاب مستخدم على صورة معيّنة |
| isLiked            | تحقق خفيف من حالة الإعجاب    |
| toggleLike         | إضافة أو إزالة الإعجاب       |

### ٦.٢ toggleLike

```typescript
// like.repository.ts — toggleLike مقتطف
async toggleLike(
  userId: string,
  photoId: string
): Promise<{ liked: boolean; like: ILike | null; removedId?: string }> {
  const existing = await this.findByUserAndPhoto(userId, photoId);

  if (existing) {
    await this.delete(existing._id.toString());
    return { liked: false, like: null, removedId: existing._id.toString() };
  }

  const like = await this.create({
    user: new Types.ObjectId(userId),
    photo: new Types.ObjectId(photoId),
  } as Partial<ILike>);
  return { liked: true, like };
}
```

- منطق find-then-delete-or-create بدل الاعتماد على خطأ التكرار عند الفشل.
- `Types.ObjectId`: تحويل مطلوب لأن الـ Schema يعرّف الحقول كـ ObjectId.

---

## 7. index.ts — RepositoryManager

### ٧.١ نقطة الوصول الموحدة

```typescript
// index.ts — getRepositoryManager
import { getRepositoryManager } from '@/app/repositories';

const repos = getRepositoryManager();
const user = await repos.user.findById(id);
const photos = await repos.photo.findPublicFeed(1, 12);
const { liked } = await repos.like.toggleLike(userId, photoId);
```

### ٧.٢ healthCheck

```typescript
// index.ts — healthCheck للفحص الصحي
async healthCheck(): Promise<{
  status: string;
  database: string;
  repositories: Record<string, boolean>;
}> {
  // يشغّل count() على كل مستودع
  // يُرجع healthy أو degraded حسب نجاح الاستعلامات
}
```

- يُستخدم في `GET /api/health` للتحقق من اتصال قاعدة البيانات والمستودعات.

---

## 8. ملخص

| ما تعلمناه                                   | الملف المسؤول             |
| -------------------------------------------- | ------------------------- |
| العقد العام IRepository                      | `repository.interface.ts` |
| التنفيذ الأساسي BaseRepository               | `base.repository.ts`      |
| findByEmail، emailExists، deleteUserCascade  | `user.repository.ts`      |
| findPublicFeed، findByUser، updateLikesCount | `photo.repository.ts`     |
| toggleLike، findByUserAndPhoto، isLiked      | `like.repository.ts`      |
| getRepositoryManager، healthCheck            | `index.ts`                |

للمرجع التقني ← [database-abstraction.md](../../database-abstraction.md) | [repository-quick-reference.md](../../repository-quick-reference.md)

---

_الدرس السابق ← [02 — نماذج قاعدة البيانات](02-database-models.md)_  
_العودة إلى [فهرس الدروس](../README.md)_  
_الدرس التالي → [04 — المصادقة والحماية](04-authentication.md)_
