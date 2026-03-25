# دليل المساهمة — صوري

---

## تسمية الفروع

```text
feat/topic       ← ميزة جديدة
fix/topic        ← إصلاح خلل
docs/topic       ← توثيق
chore/topic      ← صيانة
refactor/topic   ← إعادة هيكلة
test/topic       ← اختبارات
```

## رسائل الإيداع

نتبع معيار **Conventional Commits** — بالإنجليزية فقط. يجب أن تكون الرسالة **مفصّلة** وفق أفضل الممارسات:

**الهيكل:**

```text
type(scope): short summary (50 chars or less)

Body: explain what changed and why. Use bullet points for multiple
changes. Wrap lines at ~72 chars. Imperative mood ("add" not "added").
```

**أفضل الممارسات:**

- **السطر الأول:** فعل أمر (imperative)، بدون نقطة في النهاية، يُلخّص التغيير في ≤50 حرفاً.
- **الجسم (اختياري لكن مُفضّل):** يوضح ماذا تغيّر ولماذا؛ إن وُجدت عدة نقاط فاستخدم نقاطاً تعدادية.
- **اللغة:** إنجليزي فقط في الرسالة.

**Types:** feat, fix, docs, chore, refactor, test, style, ci, perf  
**Scopes:** api, ui, auth, db, storage, docs, ci

**أمثلة مفصّلة:**

```text
feat(ui): add UserMenu guest/auth states with login and register in dropdown

- Guest: AccountCircle icon opens menu with تسجيل الدخول, إنشاء حساب
- Authenticated: Avatar icon opens menu with profile and logout
- Replaces separate login/register buttons in AppBar
```

```text
fix(ui): ExpandableText show "عرض المزيد" only when text is truncated

- Add DESCRIPTION_TRUNCATE_MIN_CHARS (100) to skip short text
- Use scrollHeight/clientHeight + ResizeObserver for detection
- Fixed-height block for uniform card layout
```

```text
fix(db): support MongoDB standalone for account deletion

- deleteUserCascade falls back to sequential ops when transactions
  fail (code 20: replica set required)
- Enables local dev with standalone MongoDB
```

## العلامات (Tags)

- **SemVer:** `vMAJOR.MINOR.PATCH` (مثل `v0.1.0`, `v0.1.1`). في مرحلة `0.x.y`: رفع MINOR عند ميزات أو نطاق كبير (مثل توثيق شامل، إعادة هيكلة)، ورفع PATCH عند إصلاحات أو تحسينات صغيرة فقط.
- **نوع العلامة:** موضّحة فقط (annotated tags) وليس lightweight.
- **رسالة التاغ تكون مفصّلة** وفق أفضل الممارسات:
  - **السطر الأول (العنوان):** نوع الإصدار (feat/fix/docs…) + ملخص قصير + **عدد الاختبارات** بين قوسين، مثال: `feat: quality and docs release (220 tests)`.
  - **الجسم (body):** نقاط تلخيصية لأهم التغييرات في الإصدار، كل نقطة تبدأ بنوع التغيير وربما النطاق، مثال: `- fix(auth): require JWT_SECRET in production`. الهدف أن `git show v0.1.0` يعطي ملخصاً كافياً دون فتح الملفات.
  - **ترتيب النقاط:** يفضّل ترتيباً منطقياً (مثلاً auth ثم ui ثم test ثم docs ثم style).

**إنشاء التاغ برسالة مفصّلة (من ملف):**

```bash
# إنشاء ملف الرسالة ثم:
git tag -a v0.1.0 -F tag-msg.txt
```

**مثال محتوى `tag-msg.txt`** (رسالة مفصّلة وفق أفضل الممارسات):

```text
feat: quality and docs release (220 tests)

- fix(auth): require JWT_SECRET in production, dev-only fallback
- refactor(ui): extract usePaginatedPhotos, dedupe usePhotos and useMyPhotos
- fix(ui): ExpandableText effect and ResizeObserver mock, lint cleanups
- refactor(ui): wrap login and register pages with GuestRoute
- test: stabilize tests — timeout, photo fixtures, PhotoCard show-more
- docs: align test commands with package.json, add test:coverage and lessons 07-11
- style: apply Prettier to docs and tutorials
```

## التنسيق

- شغّل `npm run format` قبل كل إيداع
- Prettier بإعدادات المشروع الموحدة
- **تعليقات الكود** (`//`، `/* */`، JSDoc، وتعليقات Dockerfile و YAML وملفات الإعداد): **بالإنجليزية فقط**. النصوص المعروضة للمستخدم والبيانات في الاختبارات التي تطابق واجهة عربية تبقى عربية عند الحاجة.

## التوثيق (عند التعديل)

- في أي بلوكة كود (Markdown)، اجعل **أول سطر** بعد فتح البلوكة لاتينياً (كود أو تعليق بالإنجليزية مثل `//` أو `import`) حتى لا يُطبَّق اتجاه RTL على البلوكة في المحررات والعرض. راجع `docs/plans/documentation-plan.md` (معايير الجودة ٨.١).

## قائمة المراجعة قبل الإيداع

- [ ] `npm run lint` بدون أخطاء
- [ ] `npm run format:check` بدون مشاكل
- [ ] `npx tsc --noEmit` بدون أخطاء
- [ ] `npm test` جميع الاختبارات ناجحة
- [ ] رسالة الإيداع تتبع Conventional Commits وتكون مفصّلة (عنوان + جسم عند الحاجة)
