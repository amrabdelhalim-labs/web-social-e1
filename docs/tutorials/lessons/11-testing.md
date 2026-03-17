# الدرس 11: الاختبارات الشاملة

> هدف الدرس: فهم بنية الاختبارات في صوري — الإعداد (`setup.ts`)، الأدوات المساعدة (`utils.tsx`)، وأنماط الاختبارات عبر ملفات `tests/*.test.{ts,tsx}`، وربطها بـ [Vitest و Testing Library](../concepts-guide.md#8-vitest-و-testing-library).

---

## 1. لمحة عامة

صوري تستخدم **Vitest** كإطار اختبار و **Testing Library** لاختبار المكونات. البيئة `jsdom` تحاكي DOM في المتصفح دون تشغيل متصفح فعلي. ملف الإعداد `setup.ts` يُنفَّذ قبل كل ملف اختبار، و`utils.tsx` يوفر دالة `render` مخصصة تغلّف المكونات بـ MUI ThemeProvider و Emotion CacheProvider حتى تعمل مكونات MUI في بيئة الاختبار.

**تشبيه:** الاختبارات مثل فحص الجودة في مصنع — كل وحدة (دالة، مكون، صفحة) تمر عبر محطة فحص مستقلة؛ `setup.ts` يجهّز بيئة المحطة (مثل وهميات `matchMedia` و Canvas)، و`utils.tsx` يوفر الأدوات المشتركة (مثل `render` مع MUI) حتى تُختبر المكونات في ظروف قريبة من الواقع.

---

## 2. الإعداد التقني

### ٢.١ vitest.config.ts

```typescript
// vitest.config.ts
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/app/tests/setup.ts'],
    include: ['src/app/tests/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

| الخيار                 | الدور                              |
| ---------------------- | ---------------------------------- |
| `environment: 'jsdom'` | محاكاة DOM في Node                 |
| `setupFiles`           | تشغيل `setup.ts` قبل كل ملف اختبار |
| `include`              | تحديد مسار ملفات الاختبار          |
| `alias`                | دعم استيراد `@/`                   |

### ٢.٢ setup.ts — البيئة المشتركة

يُعدّ `setup.ts` بيئة الاختبار مرة واحدة لكل تشغيل:

| القسم                                 | الغرض                                                             |
| ------------------------------------- | ----------------------------------------------------------------- |
| `@testing-library/jest-dom/vitest`    | توسيع `expect` بـ `toBeInTheDocument` وغيرها                      |
| `next/image` mock                     | استبدال `next/image` بـ `<img>` عادي (jsdom لا يدعم تحسينات Next) |
| `navigator.mediaDevices.getUserMedia` | وهمية لاختبارات الكاميرا (`useCamera`)                            |
| Canvas (`getContext`, `toBlob`)       | وهمية لأن jsdom لا ينفّذ رسم Canvas                               |
| `window.matchMedia`                   | وهمية لاستعلامات الوسائط (MUI breakpoints)                        |
| `localStorage`                        | تخزين وهمي معزول بين الاختبارات                                   |

```typescript
// setup.ts — مثال: وهمية matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
```

### ٢.٣ utils.tsx — الأدوات المساعدة

`utils.tsx` يُصدّر دالة `render` مخصصة تغلّف المكونات بـ:

- **CacheProvider** (Emotion) — لـ MUI styles
- **ThemeProvider** (MUI) — سمة اختبارية `direction: 'rtl'`

```typescript
// utils.tsx — TestProviders
function TestProviders({ children }: { children: ReactNode }) {
  return (
    <CacheProvider value={testCache}>
      <ThemeProvider theme={testTheme}>{children}</ThemeProvider>
    </CacheProvider>
  );
}

function render(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>): RenderResult {
  return rtlRender(ui, { wrapper: TestProviders, ...options });
}
```

يُصدّر أيضًا كل ما في `@testing-library/react` (مثل `screen`, `fireEvent`, `waitFor`, `renderHook`) مع استبدال `render` بالنسخة المخصصة. السياقات الأخرى (AuthContext، ThemeContext) تُوهم في كل ملف اختبار حسب الحاجة.

---

## 3. أنماط الاختبارات

### ٣.١ اختبار دوال الوحدة (Unit)

ملفات مثل `auth.test.ts`، `validators.test.ts`، `api-client.test.ts` تختبر دوالًا منطقية دون واجهة:

```typescript
// auth.test.ts
describe('generateToken / verifyToken', () => {
  it('creates valid token and retrieves user id', () => {
    const token = generateToken('user-123');
    const payload = verifyToken(token);
    expect(payload.id).toBe('user-123');
  });

  it('rejects invalid token and throws', () => {
    expect(() => verifyToken('invalid-token')).toThrow();
  });
});
```

### ٣.٢ اختبار API مع fetch وهمي

```typescript
// api-client.test.ts
beforeEach(() => {
  vi.stubGlobal('fetch', globalFetch);
  globalFetch.mockReset();
  localStorage.clear();
});

it('adds Authorization header when token exists in localStorage', async () => {
  localStorage.setItem('auth-token', 'my.jwt');
  globalFetch.mockResolvedValueOnce(makeResponse({ data: null }));

  await fetchApi('/api/auth/me');

  const [, options] = globalFetch.mock.calls[0];
  const headers = (options as RequestInit)?.headers as Record<string, string>;
  expect(headers['Authorization']).toBe('Bearer my.jwt');
});
```

### ٣.٣ اختبار السياقات (Context) مع renderHook

```typescript
// auth-context.test.tsx
function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

it('stores token and user after login', async () => {
  globalFetch.mockResolvedValueOnce(
    makeJsonResponse({ data: { token: MOCK_TOKEN, user: MOCK_USER } })
  );

  const { result } = renderHook(() => useAuth(), { wrapper });
  await waitFor(() => expect(result.current.loading).toBe(false));

  await act(async () => {
    await result.current.login('ahmed@example.com', 'password123');
  });

  expect(result.current.user).toEqual(MOCK_USER);
  expect(localStorage.getItem('auth-token')).toBe(MOCK_TOKEN);
});
```

### ٣.٤ اختبار المكونات مع وهميات

```typescript
// PhotoCard.test.tsx
vi.mock('@/app/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ user: { _id: 'u1' } })),
}));

it('displays title and description', () => {
  render(<PhotoCard photo={mockPhoto} />);
  expect(screen.getByText('صورة جميلة')).toBeInTheDocument();
  expect(screen.getByText('وصف')).toBeInTheDocument();
});
```

### ٣.٥ اختبار الصفحات مع وهميات متعددة

```typescript
// login.test.tsx
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));
vi.mock('@/app/hooks/useAuth', () => ({ useAuth: vi.fn() }));

it('shows error for invalid email format', async () => {
  const { container } = render(<LoginPage />);
  fireEvent.change(screen.getByLabelText(/البريد الإلكتروني/i), {
    target: { value: 'not-an-email' },
  });
  fireEvent.submit(container.querySelector('form')!);

  await waitFor(() => {
    expect(screen.getByRole('alert')).toHaveTextContent('صيغة البريد الإلكتروني غير صحيحة');
  });
  expect(mockLogin).not.toHaveBeenCalled();
});
```

---

## 4. فهرس ملفات الاختبار

### ٤.١ اختبارات الوحدة (Utilities & Logic)

| الملف                          | ما يختبره                                                                   |
| ------------------------------ | --------------------------------------------------------------------------- |
| `auth.test.ts`                 | `generateToken`، `verifyToken`، `hashPassword`، `comparePassword`           |
| `validators.test.ts`           | `validateLoginInput`، `validateRegisterInput`، `validatePhotoInput`، وغيرها |
| `api-client.test.ts`           | `fetchApi`، `fetchFormApi`، دوال المسارات (loginApi، uploadPhotoApi، إلخ)   |
| `storage.test.ts`              | `getStorageService`، `resetStorageService`، LocalStorageStrategy            |
| `auth-middleware.test.ts`      | `authenticateRequest`: توكن صحيح، غير صحيح، مفقود                           |
| `profile-delete-route.test.ts` | منطق مسار `DELETE /api/profile` (cascade، تأكيد كلمة المرور)                |

### ٤.٢ اختبارات السياقات والخطافات

| الملف                    | ما يختبره                                                    |
| ------------------------ | ------------------------------------------------------------ |
| `auth-context.test.tsx`  | AuthContext: التحميل، التوكن، login، logout، updateUser، 401 |
| `theme-context.test.tsx` | ThemeContext: السمة الافتراضية، التبديل، localStorage        |
| `usePhotos.test.ts`      | تحميل الصور، pagination، الإعجاب، معالجة الأخطاء             |
| `useMyPhotos.test.ts`    | صور المستخدم، رفع، تعديل، حذف                                |
| `useCamera.test.ts`      | getUserMedia، الالتقاط، الأذونات المرفوضة، iOS fallback      |

### ٤.٣ اختبارات المكونات

| الملف                          | المكون              | ما يختبره                                          |
| ------------------------------ | ------------------- | -------------------------------------------------- |
| `PhotoCard.test.tsx`           | PhotoCard           | العنوان، الوصف، زر الإعجاب، قائمة المالك، Lightbox |
| `PhotoGrid.test.tsx`           | PhotoGrid           | شبكة الصور، skeleton، الحالة الفارغة               |
| `PhotoGridSkeleton.test.tsx`   | PhotoGridSkeleton   | عدد عناصر التحميل                                  |
| `PhotoUploadForm.test.tsx`     | PhotoUploadForm     | تبويبا الرفع والكاميرا، التحقق من المدخلات         |
| `PhotoEditDialog.test.tsx`     | PhotoEditDialog     | نموذج التعديل، إلغاء، تأكيد                        |
| `PhotoDetailModal.test.tsx`    | PhotoDetailModal    | عرض التفاصيل الكاملة                               |
| `PhotoLightbox.test.tsx`       | PhotoLightbox       | عرض الصورة بحجم كامل                               |
| `ExpandableText.test.tsx`      | ExpandableText      | النص المقتطع، زر "عرض المزيد"                      |
| `LikeButton.test.tsx`          | LikeButton          | الحالات (معجب / غير معجب)، الاستجابة للضغط         |
| `CameraCapture.test.tsx`       | CameraCapture       | بدء الكاميرا، التقاط، التحويل لـ File              |
| `AvatarUploader.test.tsx`      | AvatarUploader      | رفع الصورة الشخصية، الالتقاط من الكاميرا           |
| `DeleteConfirmDialog.test.tsx` | DeleteConfirmDialog | حوار التأكيد العام                                 |
| `DeleteAccountDialog.test.tsx` | DeleteAccountDialog | حوار حذف الحساب مع تأكيد كلمة المرور               |

### ٤.٤ اختبارات الصفحات

| الملف                | الصفحة       | ما يختبره                                         |
| -------------------- | ------------ | ------------------------------------------------- |
| `login.test.tsx`     | `/login`     | عرض الحقول، التحقق، إعادة التوجيه، معالجة الأخطاء |
| `register.test.tsx`  | `/register`  | عرض الحقول، التحقق، التسجيل                       |
| `not-found.test.tsx` | `/not-found` | عرض صفحة الخطأ 404                                |

---

## 5. أوامر التشغيل

| الأمر                                        | الوصف                                             |
| -------------------------------------------- | ------------------------------------------------- |
| `npm test`                                   | تشغيل واحد وإنهاء                                 |
| `npm run test:watch`                         | وضع المراقبة — يُعيد تشغيل الاختبارات عند التعديل |
| `npm run test:coverage`                      | تشغيل الاختبارات مع تقرير التغطية                 |
| `npm run test -- --reporter=verbose`         | تشغيل مع تفاصيل كل حالة                           |
| `npm run test -- src/app/tests/auth.test.ts` | تشغيل ملف محدد                                    |
| `npm run validate`                           | فحص شامل: format + lint + test                    |

---

## 6. الفلسفة العامة

| المبدأ                       | التطبيق في صوري                                                              |
| ---------------------------- | ---------------------------------------------------------------------------- |
| **اختبر السلوك، لا التنفيذ** | تحقق من ما يظهر للمستخدم وما يحدث عند تفاعله                                 |
| **معزولية كاملة**            | كل اختبار مستقل؛ `beforeEach` لمسح الـ mocks و localStorage                  |
| **وهمية مركّزة**             | الـ mocks العامة في `setup.ts`؛ `vi.fn()` و `vi.mock()` للخاصة بكل ملف       |
| **رسائل بالإنجليزية**        | أوصاف `describe` و `it` بالإنجليزية                                          |
| **نص UI بالعربية**           | قيم `getByText`، `getByLabelText`، `toHaveTextContent` تعكس الواجهة الحقيقية |

---

## 7. الربط مع التوثيق

لاستراتيجية الاختبار الكاملة وأوامر التشغيل وفهرس الملفات التفصيلي، راجع [docs/testing.md](../../testing.md).

---

## 8. الربط مع الدروس الأخرى

| الملف                                                        | الدرس المرتبط                                       |
| ------------------------------------------------------------ | --------------------------------------------------- |
| auth.test، auth-middleware.test، auth-context.test           | [04 — المصادقة والحماية](04-authentication.md)      |
| api-client.test، profile-delete-route.test                   | [06 — مسارات API](06-api-routes.md)                 |
| theme-context.test                                           | [07 — نظام السمات والتخطيط](07-theme-and-layout.md) |
| login.test، register.test                                    | [08 — صفحات المصادقة](08-auth-pages.md)             |
| usePhotos، useMyPhotos، useCamera، PhotoCard، PhotoGrid، إلخ | [09 — واجهة الصور](09-photos-crud.md)               |
| AvatarUploader.test، DeleteAccountDialog.test                | [10 — الملف الشخصي](10-profile.md)                  |
| storage.test                                                 | [05 — استراتيجية التخزين](05-storage-strategy.md)   |

---

## 9. ملخص

| ما تعلمناه                                                     | الملف المسؤول                                                               |
| -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| إعداد Vitest و jsdom                                           | `vitest.config.ts`                                                          |
| وهميات البيئة (matchMedia، Canvas، getUserMedia، localStorage) | `src/app/tests/setup.ts`                                                    |
| render مخصص مع MUI                                             | `src/app/tests/utils.tsx`                                                   |
| اختبارات الدوال والـ API                                       | `auth.test.ts`، `api-client.test.ts`، `validators.test.ts`، إلخ             |
| اختبارات السياقات والخطافات                                    | `auth-context.test.tsx`، `theme-context.test.tsx`، `usePhotos.test.ts`، إلخ |
| اختبارات المكونات والصفحات                                     | `PhotoCard.test.tsx`، `login.test.tsx`، إلخ                                 |

---

_الدرس السابق ← [10 — الملف الشخصي](10-profile.md)_  
_العودة إلى [فهرس الدروس](../README.md)_
