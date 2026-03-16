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

نتبع معيار **Conventional Commits** — بالإنجليزية فقط. يجب أن تكون الرسالة **مفصّلة** وواضحة:

```text
type(scope): short summary (50 chars or less)

Optional body: explain what changed and why.
```

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

- SemVer: `v1.0.0`, `v0.2.1`
- علامات موضحة فقط (annotated tags)
- تتضمن ملخص التغييرات وعدد الاختبارات

```bash
git tag -a v1.0.0 -m "feat: initial release — auth, photos, likes (X tests)"
```

## التنسيق

- شغّل `npm run format` قبل كل إيداع
- Prettier بإعدادات المشروع الموحدة

## التوثيق (عند التعديل)

- في أي بلوكة كود (Markdown)، اجعل **أول سطر** بعد فتح البلوكة لاتينياً (كود أو تعليق بالإنجليزية مثل `//` أو `import`) حتى لا يُطبَّق اتجاه RTL على البلوكة في المحررات والعرض. راجع `docs/plans/documentation-plan.md` (معايير الجودة ٨.١).

## قائمة المراجعة قبل الإيداع

- [ ] `npm run lint` بدون أخطاء
- [ ] `npm run format:check` بدون مشاكل
- [ ] `npx tsc --noEmit` بدون أخطاء
- [ ] `npm test` جميع الاختبارات ناجحة
- [ ] رسالة الإيداع تتبع Conventional Commits
