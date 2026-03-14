# صوري — My Photos

> موقع ويب لمشاركة الصور — ارفع صورك وشاركها مع الجميع

---

## عن المشروع

**صوري** هو موقع ويب لمشاركة الصور يتيح للمستخدمين:

- رفع صور PNG/JPEG مع عناوين وأوصاف
- استعراض صور المجتمع في الصفحة الرئيسية
- التفاعل مع الصور عبر الإعجاب
- إدارة صورهم الخاصة (تعديل، حذف)

## المكدس التقني

| التقنية                  | الغرض                             |
| ------------------------ | --------------------------------- |
| Next.js 16 (App Router)  | إطار العمل (SSR + API Routes)     |
| TypeScript               | أمان الأنواع                      |
| MUI 7 + Emotion          | مكتبة المكونات + RTL              |
| MongoDB + Mongoose       | قاعدة البيانات                    |
| JWT + bcrypt             | المصادقة                          |
| Strategy Pattern         | تخزين الصور (Local/Cloudinary/S3) |
| Vitest + Testing Library | الاختبارات                        |

## المتطلبات

- Node.js >= 20
- npm >= 10
- MongoDB (محلي أو Atlas)

## التشغيل السريع

```bash
# 1. نسخ المتغيرات البيئية
cp .env.example .env.local

# 2. تثبيت الاعتماديات
npm install

# 3. تشغيل خادم التطوير
npm run dev
```

ثم افتح [http://localhost:3000](http://localhost:3000).

## السكريبتات المتاحة

| السكريبت               | الوصف                   |
| ---------------------- | ----------------------- |
| `npm run dev`          | تشغيل خادم التطوير      |
| `npm run build`        | بناء للإنتاج            |
| `npm start`            | تشغيل خادم الإنتاج      |
| `npm run lint`         | فحص الكود بـ ESLint     |
| `npm test`             | تشغيل الاختبارات        |
| `npm run format`       | تنسيق الكود بـ Prettier |
| `npm run format:check` | التحقق من التنسيق       |
| `npm run validate`     | فحص شامل قبل الدفع      |

## بنية المشروع

```text
src/app/
├── api/          ← REST API routes
├── components/   ← React components
├── context/      ← Auth + Theme contexts
├── hooks/        ← Custom hooks
├── lib/          ← Utilities (api, auth, db, storage)
├── models/       ← Mongoose schemas
├── repositories/ ← Data access layer
├── validators/   ← Input validation
├── utils/        ← Helper functions
└── tests/        ← Test suites
```

## التوثيق

| الملف                                                    | الموضوع             |
| -------------------------------------------------------- | ------------------- |
| [docs/plans/project-plan.md](docs/plans/project-plan.md) | خطة المشروع المفصلة |
| [docs/ai/README.md](docs/ai/README.md)                   | دليل AI للمشروع     |

## سجل التغييرات

### v0.1.0 — الهيكل الأولي

- إعداد مشروع Next.js مع TypeScript و MUI
- بنية المجلدات الكاملة
- ملفات الإعداد والجودة
- التوثيق الأساسي

---

**الترخيص:** MIT
