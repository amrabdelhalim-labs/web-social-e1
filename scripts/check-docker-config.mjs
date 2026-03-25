#!/usr/bin/env node
/**
 * Docker configuration sanity checks.
 * Fails fast when critical Docker-related files are missing or misconfigured.
 */

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');

function read(relativePath) {
  const absolutePath = path.resolve(ROOT, relativePath);
  if (!existsSync(absolutePath)) {
    throw new Error(`Missing required file: ${relativePath}`);
  }
  return readFileSync(absolutePath, 'utf8');
}

function assertContains(content, needle, message) {
  if (!content.includes(needle)) throw new Error(message);
}

function assertOneOf(content, needles, message) {
  if (!needles.some((needle) => content.includes(needle))) throw new Error(message);
}

function run() {
  const nextConfig = read('next.config.mjs');
  const dockerfile = read('Dockerfile');
  const compose = read('docker-compose.yml');
  const envExample = read('.env.docker.example');
  const workflow = read('.github/workflows/docker-publish.yml');

  assertContains(
    nextConfig,
    "output: 'standalone'",
    "next.config.mjs must set output: 'standalone' for Docker runtime."
  );

  assertContains(dockerfile, 'FROM node:20-alpine', 'Dockerfile should use node:20-alpine.');
  assertContains(dockerfile, 'HEALTHCHECK', 'Dockerfile should define HEALTHCHECK.');
  assertContains(
    dockerfile,
    'CMD ["node", "server.js"]',
    'Dockerfile runtime command should start standalone server.'
  );

  assertContains(compose, 'mongo:', 'docker-compose.yml should include a mongo service.');
  assertContains(compose, 'app:', 'docker-compose.yml should include an app service.');
  assertContains(
    compose,
    'JWT_SECRET',
    'docker-compose.yml should require JWT_SECRET for runtime.'
  );

  assertContains(
    envExample,
    'JWT_SECRET=',
    '.env.docker.example should provide JWT_SECRET placeholder.'
  );
  assertContains(
    envExample,
    'DATABASE_URL=',
    '.env.docker.example should provide DATABASE_URL example.'
  );

  assertOneOf(
    workflow,
    ['npm run test', 'npm test'],
    'Docker workflow should run tests before image push.'
  );
  assertContains(
    workflow,
    'docker/build-push-action',
    'Docker workflow should build images using docker/build-push-action.'
  );

  console.log('Docker configuration checks passed.');
}

run();
