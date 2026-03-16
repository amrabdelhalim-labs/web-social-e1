# الدرس 01: إعداد المشروع والبنية الأساسية

> هدف الدرس: فهم ملفات الإعداد والبنية المشتركة التي تُشكّل أساس مشروع صوري، وكيف تتكامل معاً لبدء التطبيق.

---

## 1. لمحة عامة

قبل الغوص في منطق الأعمال أو المكونات، يجب فهم **الهيكل العظمي** للمشروع. ملفات الإعداد تحدد الأدوات والقواعد؛ وملفات الدخل المشترك تحدد شكل التطبيق لكل صفحة.

**تشبيه:** المشروع كالمبنى: ملفات الإعداد هي الأساس والهيكل الحديدي؛ و`layout` و`providers` هما السقف والجدران المشتركة التي يبنى عليها كل طابق (صفحة).

---

## 2. package.json — نقطة الدخول

### ٢.١ الفكرة

`package.json` يحدد اسم المشروع، الإصدار، الاعتماديات، والسكريبتات. أي أمر `npm run ...` يأتي من هنا. يشترط المشروع Node.js ≥ 20 و npm ≥ 10.

### ٢.٢ التنفيذ في صوري

| القسم | الدور |
|-------|-------|
| `engines` | Node ≥ 20، npm ≥ 10 |
| `scripts` | dev، build، start، lint، test، format، validate، db:init |
| `dependencies` | Next.js، React، MUI، Emotion، Mongoose، JWT، bcrypt |
| `devDependencies` | TypeScript، ESLint، Vitest، Testing Library، Prettier |
| `optionalDependencies` | Cloudinary، AWS S3 (للتخزين السحابي) |

### ٢.٣ شرح السكريبتات

```json
// package.json — scripts (أول سطر لاتيني)
{
  "dev": "next dev --webpack",
  "build": "next build --webpack",
  "start": "next start",
  "lint": "eslint src/",
  "test": "vitest run",
  "test:watch": "vitest",
  "format": "node scripts/format.mjs",
  "format:check": "node scripts/format.mjs --check",
  "validate": "node scripts/validate-workflow.mjs",
  "db:init": "node scripts/init-db.mjs"
}
```

- `dev`: خادم التطوير مع Webpack (تجنباً لمشاكل Turbopack مع MUI).
- `build` و `start`: بناء وتشغيل الإنتاج.
- `test`: تشغيل الاختبارات مرة واحدة؛ `test:watch` لوضع المراقبة.
- `validate`: فحص شامل (تنسيق + lint + اختبارات) قبل الإيداع.

---

## 3. TypeScript و Next.js — الإعدادات

### ٣.١ tsconfig.json

يحدد كيف يترجم [TypeScript](../concepts-guide.md#2-typescript) الكود. الإعدادات الحرجة:

| الخيار | القيمة | المعنى |
|--------|--------|--------|
| `strict` | true | تفعيل الفحص الصارم للأنواع |
| `paths` | `"@/*": ["./src/*"]` | استيراد مثل `@/app/...` بدل المسارات النسبية |
| `jsx` | react-jsx | تحويل JSX تلقائياً |
| `noEmit` | true | Next.js يبني؛ TypeScript يفحص فقط |

```json
// tsconfig.json — paths و strict
{
  "compilerOptions": {
    "strict": true,
    "paths": { "@/*": ["./src/*"] }
  }
}
```

### ٣.٢ next.config.mjs

إعدادات [Next.js](../concepts-guide.md#1-nextjs) للتطبيق والصور البعيدة:

```javascript
// next.config.mjs — إعدادات Next.js (أول سطر لاتيني)
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' }],
  },
};
export default nextConfig;
```

- `reactStrictMode`: كشف ممارسات React غير موصى بها.
- `images.remotePatterns`: السماح بتحميل صور من Cloudinary عند استخدام التخزين السحابي.

---

## 4. ESLint و Vitest — الجودة والاختبار

### ٤.١ eslint.config.mjs

يستخدم إعدادات Next.js الجاهزة مع تجاهل مجلدات البناء:

```javascript
// eslint.config.mjs — ESLint flat config (أول سطر لاتيني)
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
]);
export default eslintConfig;
```

### ٤.٢ vitest.config.ts

```typescript
// vitest.config.ts — إعداد Vitest (أول سطر لاتيني)
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

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

- `environment: 'jsdom'`: محاكاة DOM لاختبار المكونات.
- `setupFiles`: تنفيذ `setup.ts` قبل كل ملف اختبار (مثلاً تعريف `ResizeObserver` وهمي).
- `alias`: نفس مسار `@/` المستخدم في التطبيق.

لمزيد عن [Vitest و Testing Library](../concepts-guide.md#8-vitest-و-testing-library) راجع دليل المفاهيم.

---

## 5. layout.tsx و providers.tsx — هيكل التطبيق

### ٥.١ layout.tsx — التخطيط الجذري

كل صفحة في التطبيق تُغلّف بهذا التخطيط. يحدد اللغة والاتجاه والخط والسكربت المضاد للوميض:

```tsx
// layout.tsx — مقتطف (أول سطر لاتيني)
import type { Metadata, Viewport } from 'next';
import { Cairo } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';
import { APP_NAME, APP_DESCRIPTION } from './config';

const cairo = Cairo({
  variable: '--font-cairo',
  subsets: ['arabic', 'latin'],
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var m=localStorage.getItem('theme-mode');...document.documentElement.setAttribute('data-color-scheme',m);}catch(e){}`,
          }}
        />
      </head>
      <body className={cairo.variable} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- `lang="ar" dir="rtl"`: واجهة عربية من اليمين لليسار.
- السكربت في `<head>`: قراءة السمة المحفوظة (فاتح/داكن) وتطبيق `data-color-scheme` قبل الرسم لتجنب وميض أبيض (FOUC).
- `Cairo`: خط عربي من Google Fonts يُطبَّق عبر متغير CSS `--font-cairo`.

### ٥.٢ providers.tsx — شجرة المزودين

```tsx
// providers.tsx — شجرة السياقات (أول سطر لاتيني)
'use client';

import { ThemeProviderWrapper } from '@/app/context/ThemeContext';
import { AuthProvider } from '@/app/context/AuthContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProviderWrapper>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProviderWrapper>
  );
}
```

- `'use client'`: الملف يعمل في المتصفح (Client Component) لأنه يغلّف سياقات تفاعلية.
- الترتيب: ThemeProviderWrapper (السمة + RTL) ثم AuthProvider (المستخدم والمصادقة).

---

## 6. config.ts و globals.css — الثوابت والأنماط العامة

### ٦.١ config.ts

مصدر واحد لجميع الثوابت. لا تُكتَب القيم مباشرة في المكونات — تُستورد من هنا:

```typescript
// config.ts — مقتطف (أول سطر لاتيني)
export const APP_NAME = 'صوري';
export const APP_NAME_EN = 'My Photos';
export const DEFAULT_PAGE_SIZE = 12;
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const AVATAR_MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
export const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];
export const CAMERA_CAPTURE_QUALITY = 0.9;
export const CAMERA_MAX_DIMENSION = 1920;
```

### ٦.٢ globals.css

| القسم | الدور |
|-------|-------|
| Anti-FOUC | إخفاء `body` حتى يُطبَّق `data-color-scheme`؛ خلفية فورية حسب السمة |
| Base Reset | `box-sizing`، إزالة الهوامش الافتراضية |
| Scrollbar | تخصيص شريط التمرير |
| Focus | `outline` للعناصر عند التركيز (إمكانية الوصول) |
| Selection | لون تمييز النص |

```css
/* globals.css — Anti-FOUC (أول سطر لاتيني) */
html:not([data-color-scheme]) body {
  visibility: hidden;
}
html[data-color-scheme='dark'],
html[data-color-scheme='dark'] body {
  background-color: #121212;
}
html[data-color-scheme='light'],
html[data-color-scheme='light'] body {
  background-color: #f0f4f8;
}
```

---

## 7. ملخص

| ما تعلمناه | الملف المسؤول |
|------------|---------------|
| الاعتماديات والأوامر | `package.json` |
| إعداد TypeScript ومسار `@/` | `tsconfig.json` |
| إعداد Next.js والصور البعيدة | `next.config.mjs` |
| قواعد ESLint | `eslint.config.mjs` |
| إعداد Vitest وملف الإعداد | `vitest.config.ts` |
| التخطيط الجذري، اللغة، الخط، Anti-FOUC | `layout.tsx` |
| شجرة السياقات (Theme → Auth) | `providers.tsx` |
| الثوابت المركزية | `config.ts` |
| الأنماط العامة و Anti-FOUC | `globals.css` |

---

*العودة إلى [فهرس الدروس](../README.md)*  
*الدرس التالي → [02 — نماذج قاعدة البيانات](02-database-models.md)*
