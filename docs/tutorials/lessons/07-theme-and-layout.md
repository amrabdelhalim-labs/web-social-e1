# الدرس 07: نظام السمات والتخطيط

> هدف الدرس: فهم نظام السمات في صوري — من `ThemeContext` حتى `MainLayout`، وكيف يجمع بين RTL، الوضع الفاتح/الداكن، وسلوك واجهة متجاوب.

---

## 1. لمحة عامة

في صوري، السمة ليست مجرد لون. هي طبقة كاملة تضبط الاتجاه (RTL)، الألوان المتوافقة مع WCAG AA، خط Cairo، ومظهر عناصر MUI. هذه الطبقة تُحقن مرة واحدة عبر `Providers`، ثم تستهلكها مكونات مثل `ThemeToggle` و`SiteAppBar`.

**تشبيه:** السمة مثل لوحة تحكم الكهرباء في مبنى — لا تغيّر شكل غرفة واحدة فقط، بل تغيّر إضاءة كل الغرف بنفس القواعد.

---

## 2. ThemeContext — قلب النظام

### ٢.١ الفكرة

`ThemeProviderWrapper` يحتفظ بحالة `mode` (`light` أو `dark`) ويولّد Theme كامل باستخدام `buildTheme(mode)`. كما يضبط:

- `direction: 'rtl'` على مستوى MUI
- Emotion cache مع `rtlPlugin` لدعم RTL في CSS
- `data-color-scheme` على `<html>` للمزامنة بين SSR وCSR

### ٢.٢ لماذا يبدأ بـ light؟

لتفادي أخطاء hydration: السيرفر يرندر وضعًا ثابتًا (`light`) ثم بعد التحميل يُطبَّق الوضع الحقيقي من `localStorage` أو `prefers-color-scheme`. سكربت في `layout.tsx` يضبط `data-color-scheme` قبل mount لتجنب وميض بصري.

### ٢.٣ الكود

```typescript
// ThemeContext.tsx — state + hydrate-safe initialization
const [mode, setMode] = useState<PaletteMode>('light');

useEffect(() => {
  const stored = localStorage.getItem(STORAGE_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const resolved: PaletteMode = stored === 'dark' || (!stored && prefersDark) ? 'dark' : 'light';

  startTransition(() => setMode(resolved));
  document.documentElement.setAttribute('data-color-scheme', resolved);
}, []);
```

---

## 3. buildTheme و WCAG

### ٣.١ الفكرة

`buildTheme(mode)` يُرجع Theme كاملًا بألوان متوافقة مع WCAG AA (تباين 4.5:1 كحد أدنى).

### ٣.٢ العناصر الرئيسية

| العنصر     | ماذا يضبط؟                                                          |
| ---------- | ------------------------------------------------------------------- |
| palette    | ألوان primary، secondary، error، success، warning، background، text |
| typography | خط Cairo (`var(--font-cairo)`) + line-height محسّن                  |
| components | overrides لعناصر MUI (Button، Dialog، Menu، Card، Input...)         |
| direction  | RTL على مستوى التطبيق                                               |
| shape      | borderRadius: 10                                                    |

### ٣.٣ مثال من البناء

```typescript
// ThemeContext.tsx — buildTheme مقتطف
return responsiveFontSizes(
  createTheme({
    direction: 'rtl',
    palette: {
      mode,
      primary: {
        main: isDark ? '#42a5f5' : '#1565c0',
        contrastText: isDark ? '#0a1929' : '#ffffff',
      },
      background: isDark
        ? { default: '#121212', paper: '#1e1e1e' }
        : { default: '#f0f4f8', paper: '#ffffff' },
    },
    typography: {
      fontFamily: 'var(--font-cairo), Arial, sans-serif',
      body1: { lineHeight: 1.7 },
    },
  })
);
```

---

## 4. useThemeMode و ThemeToggle

### ٤.١ useThemeMode

خطاف صغير يلف `useContext(ThemeContext)` ويعطي واجهة موحدة:

```typescript
// useThemeMode.ts
export function useThemeMode(): ThemeContextValue {
  return useContext(ThemeContext);
}
```

### ٤.٢ ThemeToggle

زر واحد يبدّل الحالة عبر `toggleMode` ويغيّر الأيقونة حسب الوضع (شمس للوضع الداكن، قمر للوضع الفاتح).

```typescript
// ThemeToggle.tsx — مقتطف
const { mode, toggleMode } = useThemeMode();
return (
  <Tooltip title={mode === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}>
    <IconButton onClick={toggleMode} aria-label="تبديل السمة">
      {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
    </IconButton>
  </Tooltip>
);
```

---

## 5. SiteAppBar و UserMenu

### ٥.١ SiteAppBar

`SiteAppBar` يجمع:

- شعار التطبيق واسمه (`APP_NAME`)
- روابط التنقل: الرئيسية (`/`) و صوري (`/my-photos`) مع تمييز الرابط النشط
- زر القائمة الجانبية للجوال (Drawer من اليمين)
- `ThemeToggle` + `UserMenu` دائمًا في الطرف الأيسر (لأن RTL يعكس الاتجاه)

### ٥.٢ UserMenu

`UserMenu` له حالتان:

| الحالة      | المظهر                     | الخيارات                                    |
| ----------- | -------------------------- | ------------------------------------------- |
| ضيف         | `AccountCircleIcon`        | تسجيل الدخول، إنشاء حساب                    |
| مستخدم مسجل | `Avatar` (صورة أو حرف أول) | معلومات المستخدم، ملفي الشخصي، تسجيل الخروج |

يستهلك `useAuth` لمعرفة حالة المستخدم ويعرض القائمة المناسبة.

---

## 6. MainLayout و Providers و layout.tsx

### ٦.١ MainLayout

`MainLayout` يضمن هيكلًا ثابتًا:

1. `SiteAppBar` في الأعلى (sticky)
2. `main` لعرض محتوى الصفحة مع padding متجاوب
3. `Container` افتراضي (maxWidth lg) مع خيار `fullWidth` للصفحات التي تدير عرضها بنفسها

### ٦.٢ Providers

```typescript
// providers.tsx
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProviderWrapper>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProviderWrapper>
  );
}
```

الترتيب مهم: السمة أولًا ثم المصادقة، لأن `UserMenu` يحتاج كليهما.

### ٦.٣ Root Layout

`layout.tsx` يحقن سكربت مبكر في `<head>` يضبط `data-color-scheme` قبل mount لتجنب وميض بصري عند تحميل الصفحة.

---

## 7. التحقق بالاختبارات

`theme-context.test.tsx` يغطي السلوك الأساسي:

| الاختبار                 | ما الذي يضمنه؟                |
| ------------------------ | ----------------------------- |
| starts with light        | تطابق SSR المبدئي             |
| toggles light/dark       | صحة `toggleMode`              |
| persists to localStorage | حفظ اختيار المستخدم           |
| updates html attribute   | مزامنة `data-color-scheme`    |
| stable toggle function   | ثبات المرجع عبر `useCallback` |

---

## 8. ملخص

| ما تعلمناه                    | الملف المسؤول                       |
| ----------------------------- | ----------------------------------- |
| بناء السمة + RTL + WCAG       | `context/ThemeContext.tsx`          |
| استهلاك السمة بخطاف مخصص      | `hooks/useThemeMode.ts`             |
| زر التبديل                    | `components/layout/ThemeToggle.tsx` |
| الرأس والتنقل                 | `components/layout/AppBar.tsx`      |
| قائمة الحساب                  | `components/layout/UserMenu.tsx`    |
| غلاف الواجهة                  | `components/layout/MainLayout.tsx`  |
| شجرة المزودين والتهيئة العامة | `providers.tsx`, `layout.tsx`       |

---

_الدرس السابق ← [06 — مسارات API](06-api-routes.md)_  
_العودة إلى [فهرس الدروس](../README.md)_  
_الدرس التالي → [08 — صفحات المصادقة](08-auth-pages.md)_
