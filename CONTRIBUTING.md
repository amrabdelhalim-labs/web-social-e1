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

نتبع معيار **Conventional Commits** — بالإنجليزية فقط:

```text
type(scope): description

Types: feat, fix, docs, chore, refactor, test, style, ci, perf
Scopes: api, ui, auth, db, storage, docs, ci
```

**أمثلة:**

```text
feat(api): add photo upload endpoint with storage service
fix(ui): correct RTL alignment in photo grid
docs(ai): update architecture reference
test(hooks): add usePhotos hook tests
```

## العلامات (Tags)

- SemVer: `v1.0.0`, `v0.2.1`
- علامات موضحة فقط (annotated tags)
- تتضمن ملخص التغييرات وعدد الاختبارات

```bash
git tag -a v1.0.0 -m "feat: initial release — auth, photos, likes (X tests)"
```

## التنسيق

- شغّل `npm run format` قبل كل إيداع
- Prettier بإعدادات المشروع الموحدة

## قائمة المراجعة قبل الإيداع

- [ ] `npm run lint` بدون أخطاء
- [ ] `npm run format:check` بدون مشاكل
- [ ] `npx tsc --noEmit` بدون أخطاء
- [ ] `npm test` جميع الاختبارات ناجحة
- [ ] رسالة الإيداع تتبع Conventional Commits
