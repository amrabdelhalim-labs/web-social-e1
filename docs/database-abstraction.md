# طبقة البيانات ونمط المستودعات — صوري

> شرح تصميم طبقة الوصول إلى البيانات في صوري.

---

## 1. المبدأ التوجيهي

منطق الأعمال (API Routes) لا يتحدث مباشرة مع Mongoose. كل عمليات القراءة والكتابة تتم عبر **المستودعات** (Repositories). هذا يفصل بين منطق التطبيق وتفاصيل قاعدة البيانات، ويُسهّل الاختبار والصيانة.

---

## 2. النماذج (Models)

### 2.1 User

| الحقل | النوع | القيود |
|-------|-------|--------|
| name | String | مطلوب، 3–50 حرف |
| email | String | مطلوب، فريد، lowercase |
| password | String | مطلوب، 6 أحرف (مُخزّن كـ bcrypt hash) |
| avatarUrl | String | اختياري، null = صورة افتراضية من الأحرف الأولى |

### 2.2 Photo

| الحقل | النوع | القيود |
|-------|-------|--------|
| title | String | مطلوب، 1–200 حرف |
| description | String | اختياري، حتى 2000 حرف |
| imageUrl | String | مطلوب (من Storage Service) |
| user | ObjectId | مرجع لـ User |
| likesCount | Number | افتراضي 0، مُحدّث بـ $inc عند كل إعجاب |

**الفهارس:** `user:1`، `createdAt:-1`

### 2.3 Like

| الحقل | النوع | القيود |
|-------|-------|--------|
| user | ObjectId | مرجع لـ User |
| photo | ObjectId | مرجع لـ Photo |

**الفهرس المركب:** `{ user: 1, photo: 1 }` unique — يمنع تكرار الإعجاب.

---

## 3. العلاقات

```text
User  ──< Photo   (مستخدم يملك عدة صور)
User  ──< Like    (مستخدم يضع عدة إعجابات)
Photo ──< Like   (صورة تملك عدة إعجابات)
```

---

## 4. نمط المستودعات

### 4.1 العقد العام (IRepository)

كل مستودع يُنفّذ واجهة `IRepository<T>` مع العمليات الأساسية:

- `findAll`، `findOne`، `findById`
- `findPaginated` — للقوائم مع pagination
- `create`، `update`، `updateWhere`
- `delete`، `deleteWhere`
- `exists`، `count`

### 4.2 BaseRepository

تنفيذ عام للعقد باستخدام Mongoose. المستودعات الخاصة (User، Photo، Like) ترث منه وتضيف عمليات مخصّصة.

### 4.3 المستودعات الخاصة

| المستودع | العمليات الإضافية |
|----------|-------------------|
| UserRepository | `findByEmail`، `emailExists`، `deleteUserCascade` |
| PhotoRepository | `findPublicFeed`، `findByUser` |
| LikeRepository | `toggleLike`، `getLikeStatus` |

### 4.4 RepositoryManager

نقطة وصول واحدة لجميع المستودعات عبر `getRepositoryManager()`. نمط Singleton.

```typescript
const repos = getRepositoryManager();
const user = await repos.user.findById(id);
const photos = await repos.photo.findPublicFeed(1, 12);
```

---

## 5. تدفق البيانات

```text
API Route
    │
    ├─► authenticateRequest()  (للطرق المحمية)
    │
    ├─► validateXxxInput()     (التحقق من المدخلات)
    │
    ├─► getRepositoryManager()
    │       │
    │       ├─► user.findById / findByEmail / create / ...
    │       ├─► photo.findPublicFeed / create / update / ...
    │       └─► like.toggleLike / findAll / ...
    │
    └─► NextResponse.json({ data, ... })
```

---

## 6. قاعدة البيانات

- **MongoDB** عبر Mongoose
- **اتصال Singleton** — `connectDB()` في `lib/mongodb.ts`
- **متغيرات البيئة:** `DATABASE_URL` أو `MONGODB_URI` أو `DB_URL`
- **MongoDB Standalone:** حذف الحساب يدعم fallback بدون transactions عند عدم توفر Replica Set

---

*للمرجع السريع لعمليات المستودعات، راجع [repository-quick-reference.md](repository-quick-reference.md).*
