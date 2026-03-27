import { describe, it, expect, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { getAuthCookieOptions } from '@/app/lib/authCookie';

function makeRequest(url: string, forwardedProto?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (forwardedProto) headers['x-forwarded-proto'] = forwardedProto;
  return new NextRequest(url, { headers });
}

describe('getAuthCookieOptions', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('sets secure=false outside production', () => {
    vi.stubEnv('NODE_ENV', 'test');
    const req = makeRequest('http://localhost:3000/api/auth/login');
    const options = getAuthCookieOptions(req);
    expect(options.secure).toBe(false);
    expect(options.httpOnly).toBe(true);
    expect(options.path).toBe('/');
  });

  it('sets secure=false for production over plain http', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const req = makeRequest('http://localhost:3000/api/auth/login');
    const options = getAuthCookieOptions(req);
    expect(options.secure).toBe(false);
  });

  it('sets secure=true for production over https', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const req = makeRequest('https://example.com/api/auth/login');
    const options = getAuthCookieOptions(req);
    expect(options.secure).toBe(true);
  });

  it('sets secure=true when forwarded proto is https', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const req = makeRequest('http://example.com/api/auth/login', 'https');
    const options = getAuthCookieOptions(req);
    expect(options.secure).toBe(true);
  });
});
