# استراتيجية الاختبار — صوري

> توثيق شامل لبنية الاختبارات وأوامر التشغيل وتغطية المشروع.

---

## 1. نظرة عامة

| الجانب                 | التفاصيل                                   |
| ---------------------- | ------------------------------------------ |
| **إطار الاختبار**      | Vitest                                     |
| **اختبارات المكونات**  | Testing Library (`@testing-library/react`) |
| **عدد ملفات الاختبار** | 33 ملفًا                                   |
| **النوع السائد**       | اختبارات وحدة (Unit Tests)                 |
| **البيئة**             | jsdom                                      |

---

## 2. الإعداد التقني

### 2.1 ملف الإعداد (`vitest.config.ts`)

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/app/tests/setup.ts'],
    globals: true,
  },
});
```

### 2.2 ملف الإعداد العام (`src/app/tests/setup.ts`)

- يُعدّ `@testing-library/jest-dom` للتحقق من DOM
- يُعرّف `window.matchMedia` وهمي

### 2.3 أدوات مساعدة (`src/app/tests/utils.tsx`)

- `render()` — دالة مخصصة من Testing Library تُغلّف المكونات بـ MUI ThemeProvider و Emotion CacheProvider
- يعيد التصدير من `@testing-library/react` (`screen`, `fireEvent`, `waitFor`, `renderHook`)

---

## 3. أوامر التشغيل

| الأمر                                        | الوصف                                                     |
| -------------------------------------------- | --------------------------------------------------------- |
| `npm test`                                   | تشغيل واحد وإنهاء                                         |
| `npm run test:watch`                         | وضع المراقبة — يُعيد تشغيل الاختبارات عند التعديل         |
| `npm run test:coverage`                      | تشغيل الاختبارات مع تقرير التغطية                         |
| `npm run test -- --reporter=verbose`         | تشغيل مع تفاصيل كل حالة                                   |
| `npm run test -- src/app/tests/auth.test.ts` | تشغيل ملف محدد                                            |
| `npm run docker:check`                       | فحص إعدادات Docker الحرجة                                 |
| `npm run validate`                           | فحص شامل: format + lint + typecheck + test + docker:check |

قبل نشر صورة إلى **GHCR**، يمر المستودع أيضًا بمسح **Trivy** (على الملفات ثم على الصورة) كما في [deployment.md](deployment.md) — مع **`.trivyignore`** (`trivyignores` في `docker-publish.yml`) وسياسة **`overrides`** مقابل تبعيات Next.js المجمّعة.

---

## 4. فهرس ملفات الاختبار

### 4.1 اختبارات الوحدة (Utilities & Logic)

| الملف                          | ما يختبره                                                                                                                      |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `auth.test.ts`                 | `generateToken`، `verifyToken`، `hashPassword`، `comparePassword`                                                              |
| `validators.test.ts`           | `validateLoginInput`، `validateRegisterInput`، `validatePhotoInput`، `validateUpdatePhotoInput`، `validateChangePasswordInput` |
| `api-client.test.ts`           | دوال طبقة HTTP (`lib/api.ts`): JSON/multipart، عدم حقن Authorization (جلسة عبر cookie)                                         |
| `fileValidation.test.ts`       | `detectImageType` / `validateImageBuffer`: PNG، JPEG، رفض تزوير المحتوى                                                        |
| `storage.test.ts`              | `getStorageService`، `resetStorageService`، LocalStorageStrategy                                                               |
| `auth-middleware.test.ts`      | `authenticateRequest`: cookie صالح، Bearer كبديل، أولوية cookie، رفض غير صالح                                                  |
| `profile-delete-route.test.ts` | منطق مسار `DELETE /api/profile`: cascade، تأكيد كلمة المرور                                                                    |
| `docker-config.test.ts`        | التحقق من ثوابت Docker: `standalone` في Next، healthcheck في Dockerfile، وربط compose                                          |
| `middleware.test.ts`           | Edge Middleware: حماية `/my-photos`، منع الوصول للضيوف، إعادة التوجيه مع `?next=`                                              |
| `photoSerializer.test.ts`      | `serializePhoto`: سلامة الحقول، قيم `isLiked`، معالجة `null`/`undefined`                                                       |

### 4.2 اختبارات السياقات (Contexts)

| الملف                    | ما يختبره                                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `auth-context.test.tsx`  | `AuthContext`: `/api/auth/me` عند التحميل، `login`/`register` بدون localStorage، `logout` يستدعي `/api/auth/logout` |
| `theme-context.test.tsx` | `ThemeContext`: السمة الافتراضية (SSR)، التبديل، الحفظ في localStorage                                              |

### 4.3 اختبارات الخطافات (Hooks)

| الملف                 | ما يختبره                                                 |
| --------------------- | --------------------------------------------------------- |
| `usePhotos.test.ts`   | تحميل الصور، pagination، الإعجاب، معالجة الأخطاء          |
| `useMyPhotos.test.ts` | صور المستخدم، رفع، تعديل، حذف                             |
| `useCamera.test.ts`   | `getUserMedia`، الالتقاط، الأذونات المرفوضة، iOS fallback |

### 4.4 اختبارات المكونات (Components)

| الملف                          | المكون                | ما يختبره                                      |
| ------------------------------ | --------------------- | ---------------------------------------------- |
| `PhotoCard.test.tsx`           | `PhotoCard`           | عرض الصورة والبيانات، زر الإعجاب، قائمة المالك |
| `PhotoGrid.test.tsx`           | `PhotoGrid`           | شبكة الصور، الـ skeleton، الحالة الفارغة       |
| `PhotoGridSkeleton.test.tsx`   | `PhotoGridSkeleton`   | عدد عناصر التحميل                              |
| `PhotoUploadForm.test.tsx`     | `PhotoUploadForm`     | تبويبا الرفع والكاميرا، التحقق من المدخلات     |
| `PhotoEditDialog.test.tsx`     | `PhotoEditDialog`     | نموذج التعديل، إلغاء، تأكيد                    |
| `PhotoDetailModal.test.tsx`    | `PhotoDetailModal`    | عرض التفاصيل الكاملة                           |
| `PhotoLightbox.test.tsx`       | `PhotoLightbox`       | عرض الصورة بحجم كامل                           |
| `ExpandableText.test.tsx`      | `ExpandableText`      | النص المقتطع، زر "عرض المزيد"                  |
| `LikeButton.test.tsx`          | `LikeButton`          | الحالات (معجب / غير معجب)، الاستجابة للضغط     |
| `CameraCapture.test.tsx`       | `CameraCapture`       | بدء الكاميرا، التقاط، التحويل لـ File          |
| `AvatarUploader.test.tsx`      | `AvatarUploader`      | رفع الصورة الشخصية، الالتقاط من الكاميرا       |
| `DeleteConfirmDialog.test.tsx` | `DeleteConfirmDialog` | حوار التأكيد العام                             |
| `DeleteAccountDialog.test.tsx` | `DeleteAccountDialog` | حوار حذف الحساب مع تأكيد كلمة المرور           |

### 4.5 اختبارات المكونات التفاعلية الجديدة

| الملف                   | ما يختبره                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------------ |
| `HomePageFeed.test.tsx` | عرض الصور الأولية، "تحميل المزيد"، الحالة الفارغة، إضافة صور، رسالة خطأ، إخفاء زر الصفحة الأخيرة |
| `route-guards.test.tsx` | `ProtectedRoute`: عرض spinner ثم إعادة توجيه، عرض المحتوى للمستخدم المسجّل                       |

### 4.6 اختبارات الصفحات (Pages)

| الملف                | الصفحة       | ما يختبره                         |
| -------------------- | ------------ | --------------------------------- |
| `login.test.tsx`     | `/login`     | عرض الحقول، التحقق، إعادة التوجيه |
| `register.test.tsx`  | `/register`  | عرض الحقول، التحقق، التسجيل       |
| `not-found.test.tsx` | `/not-found` | عرض صفحة الخطأ 404                |

---

## 5. أنماط الاختبار

### 5.1 اختبار مكون مع السياق

```typescript
import { render, screen } from './utils';

it('displays user name when logged in', () => {
  render(<Component />);
  expect(screen.getByText('أحمد')).toBeInTheDocument();
});
```

### 5.2 اختبار دالة API مع fetch وهمي

```typescript
beforeEach(() => {
  global.fetch = vi.fn();
});

// المصادقة عبر HttpOnly cookie — لا يُحقَن رأس Authorization من العميل
import { fetchApi } from '@/app/lib/api';

it('sends JSON without Authorization header', async () => {
  vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ data: {} }) } as Response);
  await fetchApi('/api/auth/me');
  const [, options] = vi.mocked(fetch).mock.calls[0];
  const headers = (options as RequestInit)?.headers as Record<string, string>;
  expect(headers['Authorization']).toBeUndefined();
});
```

### 5.3 اختبار الخطافات مع `renderHook`

```typescript
import { renderHook, act } from '@testing-library/react';

it('toggles like status', async () => {
  const { result } = renderHook(() => usePhotos());
  await act(async () => {
    await result.current.toggleLike('photo-id');
  });
  expect(result.current.photos[0].isLiked).toBe(true);
});
```

---

## 6. الفلسفة العامة للاختبار

| المبدأ                       | التطبيق                                                                |
| ---------------------------- | ---------------------------------------------------------------------- |
| **اختبر السلوك، لا التنفيذ** | تحقق من ما يظهر للمستخدم وما يحدث عند تفاعله                           |
| **معزولية كاملة**            | كل اختبار مستقل، لا تبعيات بين الاختبارات                              |
| **وهمية مركّزة**             | الـ mocks في `setup.ts` للأشياء العامة، `vi.fn()` للخاصة               |
| **رسائل بالإنجليزية**        | جميع أوصاف `describe` و `it` بالإنجليزية                               |
| **نص UI بالعربية**           | قيم `getByText`، `getByLabelText`، `toHaveTextContent` تعكس UI الحقيقي |

---

_للمعمارية التقنية، راجع [docs/ai/architecture.md](ai/architecture.md)._
_لمرجع المستودعات، راجع [docs/repository-quick-reference.md](repository-quick-reference.md)._
