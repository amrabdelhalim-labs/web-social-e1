# الدرس 09: واجهة الصور (CRUD + الإعجاب)

> هدف الدرس: فهم واجهة الصور في صوري — من [getUserMedia والكاميرا](../concepts-guide.md#7-getusermedia-و-الكاميرا) حتى عرض الشبكة، رفع، تعديل، حذف، والإعجاب، مع الخطافات `usePhotos` و `useMyPhotos` والصفحتين الرئيسية و صوري.

---

## 1. لمحة عامة

واجهة الصور في صوري مبنية على طبقتين: خطافات (`usePhotos`، `useMyPhotos`) تجلب البيانات وتنفّذ العمليات، ومكونات (`PhotoCard`، `PhotoGrid`، `PhotoUploadForm`...) تعرض وتتفاعل. الصفحة الرئيسية تعرض صور الجميع مع الإعجاب؛ صفحة صوري تعرض صور المستخدم مع رفع وتعديل وحذف.

**تشبيه:** الخطافات مثل "مدير المخزن" — يجلب الصور ويُحدّثها؛ المكونات مثل "واجهة العرض" — تعرض كل صورة وتستقبل ضغطات المستخدم.

---

## 2. useCamera و CameraCapture

### ٢.١ useCamera

الخطاف يدير [`getUserMedia`](../concepts-guide.md#7-getusermedia-و-الكاميرا): تشغيل البث، إيقافه، التقاط إطار من `<video>` وتحويله إلى `File` (JPEG). عند عدم دعم `getUserMedia` (مثل بعض إصدارات iOS) يُرجع `useFallback: true` لاستخدام `input[type=file][capture]`.

| القيمة                  | الوصف                                          |
| ----------------------- | ---------------------------------------------- |
| isSupported             | هل `navigator.mediaDevices.getUserMedia` متوفر |
| useFallback             | true عند عدم الدعم — استخدم input file         |
| isActive, stream        | حالة البث والـ MediaStream                     |
| hasPermission           | granted \| denied \| prompt \| unsupported     |
| startCamera, stopCamera | تشغيل/إيقاف البث                               |
| capturePhoto(videoRef)  | التقاط من video → File                         |

### ٢.٢ CameraCapture

يعرض البث أو معاينة اللقطة أو واجهة fallback. عند اختيار "استخدام" يستدعي `onCapture(file)`.

```typescript
// CameraCapture — التدفق الرئيسي
const { isSupported, useFallback, isActive, stream, startCamera, capturePhoto } = useCamera();

// Fallback: input file مع capture="environment"
if (useFallback) {
  return <input type="file" accept="image/*" capture="environment" ... />;
}

// بعد التقاط: معاينة + استخدام / إعادة التقاط
if (previewFile) {
  return <Button onClick={handleUsePhoto}>استخدام</Button>;
}
```

---

## 3. PhotoUploadForm و PhotoTitleDescriptionFields

### ٣.١ PhotoUploadForm

نموذج في Dialog بتبويبين: "رفع من الجهاز" (file picker) و "التقاط بالكاميرا" (`CameraCapture`). يتحقق من صيغة الملف (PNG/JPEG) والحجم (MAX_FILE_SIZE) ويدعو `validatePhotoInput` للعنوان والوصف.

| التبويب          | المحتوى                     |
| ---------------- | --------------------------- |
| رفع من الجهاز    | زر "اختر صورة" → input file |
| التقاط بالكاميرا | CameraCapture               |

```typescript
// PhotoUploadForm — استدعاء الرفع
await onUpload(file, trimmedTitle, trimmedDesc || undefined);
handleClose();
```

### ٣.٢ PhotoTitleDescriptionFields

مكون مشترك للحقول: عنوان، وصف (multiline)، مع حدود `MAX_TITLE_LENGTH` و `MAX_DESCRIPTION_LENGTH`. يُستخدم في `PhotoUploadForm` و `PhotoEditDialog`.

---

## 4. usePhotos و useMyPhotos

### ٤.١ usePhotos

خطاف الصفحة الرئيسية: يجلب `getPhotosApi` مع pagination، ويوفّر `toggleLike` مع optimistic update (تحديث فوري ثم التراجع عند الفشل).

```typescript
// usePhotos — toggleLike مع optimistic update
setPhotos((prev) => prev.map((p) =>
  p._id === photoId ? { ...p, isLiked: !prevLiked, likesCount: ... } : p
));
try {
  const res = await toggleLikeApi(photoId);
  setPhotos((prev) => prev.map((p) =>
    p._id === photoId ? { ...p, isLiked: res.data!.liked, likesCount: res.data!.likesCount } : p
  ));
} catch {
  setPhotos((prev) => prev.map((p) =>
    p._id === photoId ? { ...p, isLiked: prevLiked, likesCount: prevCount } : p
  ));
}
```

### ٤.٢ useMyPhotos

خطاف صفحة صوري: يجلب `getMyPhotosApi`، ويوفّر `upload`، `update`، `remove`. يضيف الصورة الجديدة في بداية القائمة بعد الرفع.

---

## 5. PhotoCard — البطاقة الموحدة

### ٥.١ الفكرة

`PhotoCard` له نوعان: `public` (زر إعجاب) و `owner` (قائمة تعديل/حذف). النقر على الصورة يفتح Lightbox؛ النقر على العنوان يفتح DetailModal.

### ٥.٢ المكونات الفرعية

| المكون              | الدور                                                     |
| ------------------- | --------------------------------------------------------- |
| OptimizedPhotoImage | next/image للـ /uploads/ و Cloudinary، img fallback لـ S3 |
| ExpandableText      | وصف مختصر مع "عرض المزيد" يفتح DetailModal                |
| LikeButton          | زر إعجاب مع optimistic update                             |
| PhotoLightbox       | عرض الصورة بحجم كامل                                      |
| PhotoDetailModal    | عرض العنوان والوصف والناشر                                |
| PhotoEditDialog     | تعديل العنوان والوصف                                      |
| DeleteConfirmDialog | تأكيد الحذف                                               |

### ٥.٣ OptimizedPhotoImage

```typescript
// OptimizedPhotoImage — متى يستخدم next/image؟
function useNextImage(src: string): boolean {
  if (src.startsWith('/')) return true;
  const url = new URL(src);
  return url.hostname === 'res.cloudinary.com';
}
```

### ٥.٤ ExpandableText

يستخدم `-webkit-line-clamp` و `ResizeObserver` للتحقق من أن النص مُقتطع. يظهر "عرض المزيد" فقط عند الحاجة.

### ٥.٥ LikeButton

يُعطّل عند عدم وجود مستخدم (`!user`). يحدّث الحالة فوراً ثم يتراجع عند فشل API.

---

## 6. PhotoGrid و PhotoGridSkeleton

### ٦.١ PhotoGrid

شبكة متجاوبة: xs: 1 عمود، sm: 2، md: 3، lg: 4. يمرّر `variant` و `onEdit` و `onDelete` إلى كل `PhotoCard`. الصورة الأولى تُعلّم `priority` لتحسين LCP.

### ٦.٢ PhotoGridSkeleton

8 بطاقات Skeleton بنفس تخطيط الشبكة — يُستخدم أثناء التحميل الأولي.

---

## 7. الصفحة الرئيسية — page.tsx

```typescript
// page.tsx — التدفق
const { photos, loading, error, pagination, loadMore } = usePhotos();

return (
  <MainLayout>
    {loading && photos.length === 0 ? <PhotoGridSkeleton /> : ...}
    <PhotoGrid photos={photos} />
    {hasMore && <Button onClick={loadMore}>تحميل المزيد</Button>}
  </MainLayout>
);
```

---

## 8. صفحة صوري — my-photos/page.tsx

### ٨.١ الحماية

```typescript
// my-photos/page.tsx
export default function MyPhotosPage() {
  return (
    <ProtectedRoute>
      <MyPhotosContent />
    </ProtectedRoute>
  );
}
```

### ٨.٢ المحتوى

- `PhotoGrid` مع `variant="owner"` و `onEdit={update}` و `onDelete={remove}`
- زر FAB لفتح `PhotoUploadForm`
- `PhotoUploadForm` مع `onUpload={handleUpload}` الذي يستدعي `upload` من `useMyPhotos`

---

## 9. الربط مع الدروس الأخرى

| الملف                                            | الدرس المرتبط                                       |
| ------------------------------------------------ | --------------------------------------------------- |
| useAuth، ProtectedRoute                          | [04 — المصادقة والحماية](04-authentication.md)      |
| getPhotosApi، uploadPhotoApi، toggleLikeApi، ... | [06 — مسارات API](06-api-routes.md)                 |
| MainLayout                                       | [07 — نظام السمات والتخطيط](07-theme-and-layout.md) |
| validatePhotoInput، validateUpdatePhotoInput     | [04 — المصادقة والحماية](04-authentication.md)      |
| PhotoCard.test، PhotoGrid.test، ...              | [11 — الاختبارات الشاملة](11-testing.md)            |

---

## 10. ملخص

| ما تعلمناه                                       | الملف المسؤول                                                                                 |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| خطاف الكاميرا والتقاط                            | `hooks/useCamera.ts`                                                                          |
| مكون التقاط وعرض البث                            | `components/camera/CameraCapture.tsx`                                                         |
| نموذج الرفع (ملف/كاميرا)                         | `components/photos/PhotoUploadForm.tsx`                                                       |
| حقول العنوان والوصف                              | `components/photos/PhotoTitleDescriptionFields.tsx`                                           |
| خطاف الصور العامة                                | `hooks/usePhotos.ts`                                                                          |
| خطاف صور المستخدم                                | `hooks/useMyPhotos.ts`                                                                        |
| بطاقة الصورة الموحدة                             | `components/photos/PhotoCard.tsx`                                                             |
| شبكة الصور                                       | `components/photos/PhotoGrid.tsx`                                                             |
| هيكل التحميل                                     | `components/photos/PhotoGridSkeleton.tsx`                                                     |
| Lightbox، DetailModal، EditDialog، DeleteConfirm | `PhotoLightbox.tsx`، `PhotoDetailModal.tsx`، `PhotoEditDialog.tsx`، `DeleteConfirmDialog.tsx` |
| زر الإعجاب                                       | `components/photos/LikeButton.tsx`                                                            |
| نص قابل للتوسيع                                  | `components/photos/ExpandableText.tsx`                                                        |
| صورة محسّنة                                      | `components/photos/OptimizedPhotoImage.tsx`                                                   |
| الصفحة الرئيسية                                  | `page.tsx`                                                                                    |
| صفحة صوري                                        | `my-photos/page.tsx`                                                                          |

---

_الدرس السابق ← [08 — صفحات المصادقة](08-auth-pages.md)_  
_العودة إلى [فهرس الدروس](../README.md)_  
_الدرس التالي → [10 — الملف الشخصي](10-profile.md)_
