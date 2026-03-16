/**
 * 404 Not Found Page Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from './utils';
import NotFound from '@/app/not-found';

vi.mock('@/app/components/layout/MainLayout', () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('NotFound', () => {
  it('displays 404 code', () => {
    render(<NotFound />);
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('displays page not found message', () => {
    render(<NotFound />);
    expect(screen.getByText('الصفحة غير موجودة')).toBeInTheDocument();
  });

  it('displays back to home link', () => {
    render(<NotFound />);
    expect(screen.getByRole('link', { name: /العودة للرئيسية/ })).toBeInTheDocument();
  });
});
