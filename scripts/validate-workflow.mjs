/**
 * Pre-push validation script.
 * Checks that all required files exist, linting passes,
 * TypeScript compiles, and tests pass.
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');
let passed = 0;
let failed = 0;

function check(label, fn) {
  try {
    fn();
    console.log(`  ✅ ${label}`);
    passed++;
  } catch (e) {
    console.error(`  ❌ ${label}: ${e.message || e}`);
    failed++;
  }
}

function fileExists(filePath) {
  const full = path.resolve(ROOT, filePath);
  if (!existsSync(full)) throw new Error(`Missing: ${filePath}`);
}

function run(cmd) {
  execSync(cmd, { cwd: ROOT, stdio: 'pipe' });
}

console.log('\n🔍 Validating project...\n');

console.log('§0 — Clean stale build cache');
check('clean .next', () => run('npm run clean'));

console.log('\n§1 — Required files');
const requiredFiles = [
  'README.md',
  'CONTRIBUTING.md',
  'LICENSE',
  '.env.example',
  '.prettierrc.json',
  '.gitattributes',
  'package.json',
  'tsconfig.json',
  'next.config.mjs',
  'vitest.config.ts',
  'Dockerfile',
  'docker-compose.yml',
  '.env.docker.example',
  '.github/workflows/docker-publish.yml',
  'docs/ai/README.md',
  'docs/plans/project-plan.md',
];
requiredFiles.forEach((f) => check(f, () => fileExists(f)));

console.log('\n§2 — Lint');
check('eslint', () => run('npm run lint'));

console.log('\n§3 — TypeScript');
check('npm run typecheck', () => run('npm run typecheck'));

console.log('\n§4 — Tests');
check('vitest run', () => run('npm test'));

console.log('\n§5 — Docker config sanity');
check('docker:check', () => run('npm run docker:check'));

console.log(`\n${'─'.repeat(40)}`);
console.log(`✅ Passed: ${passed}  ❌ Failed: ${failed}`);
if (failed > 0) {
  console.log('\n⚠️  Fix the issues above before pushing.\n');
  process.exit(1);
} else {
  console.log('\n🎉 All checks passed!\n');
}
