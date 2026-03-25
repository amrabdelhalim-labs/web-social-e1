import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function read(relativePath: string): string {
  const absolutePath = path.resolve(process.cwd(), relativePath);
  return readFileSync(absolutePath, 'utf8');
}

describe('docker configuration', () => {
  it('keeps Next.js standalone output enabled', () => {
    const nextConfig = read('next.config.mjs');
    expect(nextConfig).toContain("output: 'standalone'");
  });

  it('defines a runtime healthcheck in Dockerfile', () => {
    const dockerfile = read('Dockerfile');
    expect(dockerfile).toContain('HEALTHCHECK');
    expect(dockerfile).toContain('CMD ["node", "server.js"]');
  });

  it('wires compose app service with JWT_SECRET and mongo dependency', () => {
    const compose = read('docker-compose.yml');
    expect(compose).toContain('app:');
    expect(compose).toContain('mongo:');
    expect(compose).toContain('JWT_SECRET:');
    expect(compose).toContain('depends_on:');
  });
});
