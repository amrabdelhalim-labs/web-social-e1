/**
 * Integration Test Script — صوري API
 *
 * Tests all deployed API endpoints against a live server using real HTTP requests
 * and real image uploads. Detects storage type from the /api/health endpoint and
 * adjusts image verification accordingly.
 *
 * Usage:
 *   node scripts/test-api.mjs <base-url>
 *   node scripts/test-api.mjs https://amr-social-e1.herokuapp.com
 *
 * What it tests:
 *   §1 System health and storage type detection
 *   §2 Authentication (register, login, me, validation)
 *   §3 Profile management (update info, password change, avatar upload/delete)
 *   §4 Photos CRUD (upload real image, list, mine, like/unlike, edit, delete)
 *   §5 Authorization checks (unauthenticated requests)
 *   §6 Cleanup (delete test account)
 *   §7 Summary
 *
 * Safety:
 *   - OS-level SIGKILL after 90 s prevents script from hanging on HTTPS keep-alive
 *   - Per-request fetch timeout (15 s) prevents individual calls from blocking
 *   - All uploaded files are tracked and deleted in the cleanup phase
 */

import https from 'node:https';

// ─── Layer 1: OS-level kill guard (90 s) ─────────────────────────────────────
// Prevents script from hanging if fetch or cloud SDK keeps HTTPS connections alive.
setTimeout(() => process.kill(process.pid, 'SIGKILL'), 90_000).unref();

// ─── Layer 2: per-request timeout wrapper ────────────────────────────────────
const withTimeout = (promise, ms, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`TIMEOUT: ${label} (${ms}ms)`)), ms)
    ),
  ]);

// ─── Minimal valid images (programmatic, no external dependencies) ────────────

/**
 * Minimal 1×1 red pixel PNG (67 bytes).
 * Generated with: `convert -size 1x1 xc:red test.png`
 */
const MINIMAL_PNG = Buffer.from(
  '89504e470d0a1a0a0000000d4948445200000001000000010802000000' +
    '9077' +
    '53de0000000c49444154789c6260f8cf000000000200' +
    '01e221bc330000000049454e44ae426082',
  'hex'
);

function makeImageFile(name, buffer, type) {
  const blob = new Blob([buffer], { type });
  return new File([blob], name, { type });
}

// ─── State ────────────────────────────────────────────────────────────────────

const BASE_URL = process.argv[2];
if (!BASE_URL) {
  console.error('\nUsage: node scripts/test-api.mjs <base-url>');
  console.error('Example: node scripts/test-api.mjs https://amr-social-e1.herokuapp.com\n');
  process.exit(1);
}

const TIMESTAMP = Date.now();
const TEST_EMAIL = `integration-${TIMESTAMP}@test-cleanup.dev`;
const TEST_PASSWORD = 'IntTest@123456';
const TEST_NAME = 'مستخدم اختبار تكامل';

let token = null;
let detectedStorageType = 'unknown';
let uploadedPhotoId = null;

const state = { passed: 0, failed: 0, sections: {} };
let currentSection = '';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function logSection(title) {
  currentSection = title;
  state.sections[title] = { passed: 0, failed: 0 };
  console.log(`\n${title}`);
}

async function test(label, fn) {
  try {
    await withTimeout(fn(), 15_000, label);
    console.log(`  ✅ ${label}`);
    state.passed++;
    if (currentSection) state.sections[currentSection].passed++;
  } catch (e) {
    console.error(`  ❌ ${label}`);
    console.error(`     → ${e.message}`);
    state.failed++;
    if (currentSection) state.sections[currentSection].failed++;
  }
}

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

async function apiForm(path, formData, method = 'POST') {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { method, headers, body: formData });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

// ─── §1 System Health ─────────────────────────────────────────────────────────

logSection('§1 — System Health');

await test('GET /api/health returns valid response', async () => {
  const { status, body } = await api('/api/health');
  if (status !== 200 && status !== 503) throw new Error(`Unexpected status: ${status}`);
  if (!body.database) throw new Error('Missing "database" field');
  if (!body.storage) throw new Error('Missing "storage" field');
  if (!body.timestamp) throw new Error('Missing "timestamp" field');

  detectedStorageType = body.storage?.type ?? 'unknown';
  const dbStatus = body.database;
  console.log(`     ℹ️  Storage: ${detectedStorageType} | DB: ${dbStatus}`);
});

await test('HEAD /api/health returns 200', async () => {
  const res = await fetch(`${BASE_URL}/api/health`, { method: 'HEAD' });
  if (res.status !== 200) throw new Error(`Status: ${res.status}`);
});

// ─── §2 Authentication ────────────────────────────────────────────────────────

logSection('§2 — Authentication');

await test('POST /api/auth/register creates account + returns token', async () => {
  const { status, body } = await api('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: TEST_NAME,
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      confirmPassword: TEST_PASSWORD,
    }),
  });
  if (status !== 201) throw new Error(`Status: ${status} — ${JSON.stringify(body)}`);
  if (!body.data?.token) throw new Error('Missing token in response');
  if (!body.data?.user?._id) throw new Error('Missing user._id in response');
  if (body.data.user.email !== TEST_EMAIL) throw new Error('Email mismatch');
  token = body.data.token;
});

await test('POST /api/auth/login returns token for valid credentials', async () => {
  const { status, body } = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  });
  if (status !== 200) throw new Error(`Status: ${status}`);
  if (!body.data?.token) throw new Error('Missing token');
  token = body.data.token;
});

await test('GET /api/auth/me returns current user', async () => {
  const { status, body } = await api('/api/auth/me');
  if (status !== 200) throw new Error(`Status: ${status}`);
  if (body.data.email !== TEST_EMAIL) throw new Error('Email mismatch');
  if (body.data.name !== TEST_NAME) throw new Error('Name mismatch');
});

await test('POST /api/auth/login rejects wrong password → 401', async () => {
  const saved = token;
  token = null;
  const { status } = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: TEST_EMAIL, password: 'wrong-password' }),
  });
  token = saved;
  if (status !== 401) throw new Error(`Expected 401, got ${status}`);
});

await test('POST /api/auth/register rejects duplicate email → 409', async () => {
  const saved = token;
  token = null;
  const { status } = await api('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'آخر',
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      confirmPassword: TEST_PASSWORD,
    }),
  });
  token = saved;
  if (status !== 409) throw new Error(`Expected 409, got ${status}`);
});

await test('POST /api/auth/register rejects invalid input → 400', async () => {
  const saved = token;
  token = null;
  const { status, body } = await api('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: '', email: 'bad', password: '1' }),
  });
  token = saved;
  if (status !== 400) throw new Error(`Expected 400, got ${status}`);
  if (!body?.error?.code) throw new Error('Missing error.code in response');
});

// ─── §3 Profile Management ────────────────────────────────────────────────────

logSection('§3 — Profile Management');

await test('PUT /api/profile updates user name', async () => {
  const newName = 'اسم محدّث للاختبار';
  const { status, body } = await api('/api/profile', {
    method: 'PUT',
    body: JSON.stringify({ name: newName }),
  });
  if (status !== 200) throw new Error(`Status: ${status}`);
  if (body.data?.name !== newName) throw new Error('Name not updated in response');
});

await test('PUT /api/profile/password changes password', async () => {
  const { status } = await api('/api/profile/password', {
    method: 'PUT',
    body: JSON.stringify({
      currentPassword: TEST_PASSWORD,
      newPassword: TEST_PASSWORD + '!',
      confirmPassword: TEST_PASSWORD + '!',
    }),
  });
  if (status !== 200) throw new Error(`Status: ${status}`);
  // Login with new password to confirm
  const { status: loginStatus } = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD + '!' }),
  });
  if (loginStatus !== 200) throw new Error('Login with new password failed');
});

await test('PUT /api/profile/password rejects wrong current password → 401', async () => {
  const { status } = await api('/api/profile/password', {
    method: 'PUT',
    body: JSON.stringify({
      currentPassword: 'definitely-wrong',
      newPassword: 'something-new-123',
      confirmPassword: 'something-new-123',
    }),
  });
  if (status !== 401) throw new Error(`Expected 401, got ${status}`);
});

// Avatar upload — real image
await test(`PUT /api/profile/avatar uploads real PNG (storage: ${detectedStorageType})`, async () => {
  const formData = new FormData();
  formData.append('avatar', makeImageFile('avatar.png', MINIMAL_PNG, 'image/png'));

  const { status, body } = await apiForm('/api/profile/avatar', formData, 'PUT');
  if (status !== 200) throw new Error(`Status: ${status} — ${JSON.stringify(body)}`);
  if (!body.data?.avatarUrl) throw new Error('avatarUrl missing in response');

  const url = body.data.avatarUrl;
  if (detectedStorageType === 'local') {
    if (!url.startsWith('/')) throw new Error(`Local URL should start with "/": ${url}`);
  } else if (detectedStorageType === 'cloudinary') {
    if (!url.includes('cloudinary.com')) throw new Error(`Expected Cloudinary URL: ${url}`);
  } else if (detectedStorageType === 's3') {
    if (!url.includes('amazonaws.com')) throw new Error(`Expected S3 URL: ${url}`);
  }
  console.log(`     ℹ️  Avatar URL: ${url.slice(0, 60)}…`);
});

await test('DELETE /api/profile/avatar removes avatar', async () => {
  const { status, body } = await api('/api/profile/avatar', { method: 'DELETE' });
  if (status !== 200) throw new Error(`Status: ${status}`);
  if (body.data?.avatarUrl !== null) throw new Error('avatarUrl should be null after deletion');
});

// ─── §4 Photos CRUD ───────────────────────────────────────────────────────────

logSection('§4 — Photos CRUD');

await test('GET /api/photos is publicly accessible (no auth)', async () => {
  const saved = token;
  token = null;
  const { status, body } = await api('/api/photos');
  token = saved;
  if (status !== 200) throw new Error(`Status: ${status}`);
  if (!Array.isArray(body.data)) throw new Error('Expected data array');
  if (!body.pagination) throw new Error('Missing pagination');
});

await test(`POST /api/photos uploads real PNG (storage: ${detectedStorageType})`, async () => {
  const formData = new FormData();
  formData.append('photo', makeImageFile('test-photo.png', MINIMAL_PNG, 'image/png'));
  formData.append('title', 'صورة اختبار تكامل');
  formData.append('description', 'وصف الصورة في اختبار التكامل');

  const { status, body } = await apiForm('/api/photos', formData, 'POST');
  if (status !== 201) throw new Error(`Status: ${status} — ${JSON.stringify(body)}`);
  if (!body.data?._id) throw new Error('Missing photo._id');
  if (!body.data?.imageUrl) throw new Error('Missing photo.imageUrl');

  uploadedPhotoId = body.data._id;
  const url = body.data.imageUrl;
  console.log(`     ℹ️  Photo URL: ${url.slice(0, 60)}…`);
});

await test('POST /api/photos rejects missing image file → 400', async () => {
  const formData = new FormData();
  formData.append('title', 'بدون ملف');

  const { status } = await apiForm('/api/photos', formData, 'POST');
  if (status !== 400) throw new Error(`Expected 400, got ${status}`);
});

await test('POST /api/photos rejects missing title → 400', async () => {
  const formData = new FormData();
  formData.append('photo', makeImageFile('x.png', MINIMAL_PNG, 'image/png'));

  const { status } = await apiForm('/api/photos', formData, 'POST');
  if (status !== 400) throw new Error(`Expected 400, got ${status}`);
});

await test('GET /api/photos/mine returns authenticated user photos', async () => {
  const { status, body } = await api('/api/photos/mine');
  if (status !== 200) throw new Error(`Status: ${status}`);
  if (!Array.isArray(body.data)) throw new Error('Expected data array');
  if (uploadedPhotoId && body.data.length === 0) throw new Error('Uploaded photo not found');
});

await test(`PUT /api/photos/${uploadedPhotoId?.slice(0, 8)}… updates title/description`, async () => {
  if (!uploadedPhotoId) throw new Error('No photo uploaded in previous step');
  const { status, body } = await api(`/api/photos/${uploadedPhotoId}`, {
    method: 'PUT',
    body: JSON.stringify({ title: 'عنوان محدّث', description: 'وصف محدّث' }),
  });
  if (status !== 200) throw new Error(`Status: ${status}`);
  if (body.data?.title !== 'عنوان محدّث') throw new Error('Title not updated');
});

await test('POST /api/photos/:id/like toggles like ON', async () => {
  if (!uploadedPhotoId) throw new Error('No photo uploaded');
  const { status, body } = await api(`/api/photos/${uploadedPhotoId}/like`, { method: 'POST' });
  if (status !== 200) throw new Error(`Status: ${status}`);
  if (body.data?.liked !== true) throw new Error('Expected liked: true');
  if (typeof body.data?.likesCount !== 'number') throw new Error('Missing likesCount');
});

await test('POST /api/photos/:id/like toggles like OFF', async () => {
  if (!uploadedPhotoId) throw new Error('No photo uploaded');
  const { status, body } = await api(`/api/photos/${uploadedPhotoId}/like`, { method: 'POST' });
  if (status !== 200) throw new Error(`Status: ${status}`);
  if (body.data?.liked !== false) throw new Error('Expected liked: false');
  if (body.data?.likesCount !== 0)
    throw new Error(`Expected likesCount 0, got ${body.data?.likesCount}`);
});

await test('GET /api/photos shows isLiked field for authenticated user', async () => {
  const { status, body } = await api('/api/photos');
  if (status !== 200) throw new Error(`Status: ${status}`);
  if (body.data.length > 0 && !('isLiked' in body.data[0])) {
    throw new Error('Missing isLiked field in photo response');
  }
});

await test(`DELETE /api/photos/${uploadedPhotoId?.slice(0, 8)}… deletes photo + file`, async () => {
  if (!uploadedPhotoId) throw new Error('No photo uploaded');
  const { status } = await api(`/api/photos/${uploadedPhotoId}`, { method: 'DELETE' });
  if (status !== 200) throw new Error(`Status: ${status}`);
  uploadedPhotoId = null;
});

// ─── §5 Authorization ─────────────────────────────────────────────────────────

logSection('§5 — Authorization');

await test('GET /api/auth/me without token → 401', async () => {
  const saved = token;
  token = null;
  const { status } = await api('/api/auth/me');
  token = saved;
  if (status !== 401) throw new Error(`Expected 401, got ${status}`);
});

await test('POST /api/photos without token → 401', async () => {
  const saved = token;
  token = null;
  const formData = new FormData();
  formData.append('photo', makeImageFile('x.png', MINIMAL_PNG, 'image/png'));
  formData.append('title', 'غير مصرح');
  const { status } = await apiForm('/api/photos', formData, 'POST');
  token = saved;
  if (status !== 401) throw new Error(`Expected 401, got ${status}`);
});

await test('PUT /api/profile without token → 401', async () => {
  const saved = token;
  token = null;
  const { status } = await api('/api/profile', {
    method: 'PUT',
    body: JSON.stringify({ name: 'مخترق' }),
  });
  token = saved;
  if (status !== 401) throw new Error(`Expected 401, got ${status}`);
});

// ─── §6 Cleanup ───────────────────────────────────────────────────────────────

logSection('§6 — Cleanup');

// Delete any remaining uploaded photo before deleting account
if (uploadedPhotoId) {
  await test('DELETE /api/photos/:id (cleanup remaining photo)', async () => {
    const { status } = await api(`/api/photos/${uploadedPhotoId}`, { method: 'DELETE' });
    if (status !== 200 && status !== 404) throw new Error(`Status: ${status}`);
    uploadedPhotoId = null;
  });
}

await test('DELETE /api/profile deletes account with password confirmation', async () => {
  const { status } = await api('/api/profile', {
    method: 'DELETE',
    // Password was changed in §3 test
    body: JSON.stringify({ password: TEST_PASSWORD + '!' }),
  });
  if (status !== 200) throw new Error(`Status: ${status}`);
});

await test('GET /api/auth/me after deletion → 404 or 401', async () => {
  const { status } = await api('/api/auth/me');
  if (status !== 404 && status !== 401) throw new Error(`Expected 404 or 401, got ${status}`);
});

// ─── §7 Summary ───────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(50)}`);
console.log(`🗄️  Storage: ${detectedStorageType} | 🌐 ${BASE_URL}`);
console.log(`${'─'.repeat(50)}`);

for (const [section, counts] of Object.entries(state.sections)) {
  const icon = counts.failed === 0 ? '✅' : '⚠️ ';
  console.log(`  ${icon} ${section}: ${counts.passed} passed, ${counts.failed} failed`);
}

console.log(`${'─'.repeat(50)}`);
console.log(`✅ Total Passed: ${state.passed}  ❌ Total Failed: ${state.failed}`);

if (state.failed > 0) {
  console.log('\n⚠️  Some integration tests failed. Check the output above.\n');
} else {
  console.log('\n🎉 All integration tests passed!\n');
}

// ─── Layer 3: Close HTTPS keep-alive connections then exit ────────────────────
https.globalAgent.destroy();
process.exit(state.failed > 0 ? 1 : 0);
