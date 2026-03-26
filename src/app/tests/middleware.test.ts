/**
 * Edge Middleware Tests
 *
 * Verifies the route-protection logic in src/middleware.ts:
 *  - Protected routes (/my-photos, /profile) redirect to /login when no cookie
 *  - Protected routes pass through when cookie is present
 *  - Guest-only routes (/login, /register) redirect to / when cookie is present
 *  - Guest-only routes pass through when no cookie
 *  - Unmatched routes always pass through
 *  - The redirect to /login carries the ?next= parameter
 */

import { NextRequest, NextResponse } from 'next/server';
import { describe, it, expect } from 'vitest';
import { middleware } from '@/middleware';
import { AUTH_COOKIE_NAME } from '@/app/lib/authCookie';

function makeRequest(pathname: string, withCookie = false): NextRequest {
  const url = `http://localhost:3000${pathname}`;
  const headers: Record<string, string> = {};
  if (withCookie) {
    headers['cookie'] = `${AUTH_COOKIE_NAME}=fake-jwt-token`;
  }
  return new NextRequest(url, { headers });
}

describe('middleware — protected routes', () => {
  it('يُعيد توجيه /my-photos إلى /login عند غياب الكوكي', () => {
    const req = makeRequest('/my-photos', false);
    const res = middleware(req);
    expect(res).toBeInstanceOf(NextResponse);
    const location = res.headers.get('location') ?? '';
    expect(location).toContain('/login');
  });

  it('يُضمّن ?next=/my-photos في رابط إعادة التوجيه', () => {
    const req = makeRequest('/my-photos', false);
    const res = middleware(req);
    const location = res.headers.get('location') ?? '';
    expect(location).toContain('next=%2Fmy-photos');
  });

  it('يُعيد توجيه /profile إلى /login عند غياب الكوكي', () => {
    const req = makeRequest('/profile', false);
    const res = middleware(req);
    expect(res.headers.get('location')).toContain('/login');
  });

  it('يُعيد توجيه /profile/settings إلى /login عند غياب الكوكي', () => {
    const req = makeRequest('/profile/settings', false);
    const res = middleware(req);
    expect(res.headers.get('location')).toContain('/login');
  });

  it('يسمح بالوصول إلى /my-photos عند وجود الكوكي', () => {
    const req = makeRequest('/my-photos', true);
    const res = middleware(req);
    // next() — no Location header
    expect(res.headers.get('location')).toBeNull();
  });

  it('يسمح بالوصول إلى /profile عند وجود الكوكي', () => {
    const req = makeRequest('/profile', true);
    const res = middleware(req);
    expect(res.headers.get('location')).toBeNull();
  });
});

describe('middleware — guest-only routes', () => {
  it('يُعيد توجيه /login إلى / عند وجود الكوكي', () => {
    const req = makeRequest('/login', true);
    const res = middleware(req);
    expect(res.headers.get('location')).toContain('/');
  });

  it('يُعيد توجيه /register إلى / عند وجود الكوكي', () => {
    const req = makeRequest('/register', true);
    const res = middleware(req);
    expect(res.headers.get('location')).toContain('/');
  });

  it('يسمح بالوصول إلى /login عند غياب الكوكي', () => {
    const req = makeRequest('/login', false);
    const res = middleware(req);
    expect(res.headers.get('location')).toBeNull();
  });

  it('يسمح بالوصول إلى /register عند غياب الكوكي', () => {
    const req = makeRequest('/register', false);
    const res = middleware(req);
    expect(res.headers.get('location')).toBeNull();
  });
});

describe('middleware — unprotected routes', () => {
  it('يسمح بالوصول إلى / دائماً', () => {
    expect(middleware(makeRequest('/', false)).headers.get('location')).toBeNull();
    expect(middleware(makeRequest('/', true)).headers.get('location')).toBeNull();
  });

  it('يسمح بالوصول إلى /about دائماً (مسار غير محمي)', () => {
    expect(middleware(makeRequest('/about', false)).headers.get('location')).toBeNull();
  });
});
