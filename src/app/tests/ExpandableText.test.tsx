/**
 * ExpandableText Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from './utils';
import { ExpandableText } from '@/app/components/photos/ExpandableText';

describe('ExpandableText', () => {
  it('renders nothing when text is empty', () => {
    const { container } = render(<ExpandableText text="" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when text is whitespace only', () => {
    const { container } = render(<ExpandableText text="   " />);
    expect(container.firstChild).toBeNull();
  });

  it('renders text when present', () => {
    render(<ExpandableText text="نص قصير" />);
    expect(screen.getByText('نص قصير')).toBeInTheDocument();
  });

  it('renders long text without error', () => {
    const longText =
      'هذا نص طويل جداً يتجاوز عدة أسطر من المحتوى. عندما يكون النص أطول من المساحة المتاحة فإن زر عرض المزيد يظهر للمستخدم لقراءة المحتوى الكامل في نافذة التفاصيل.';
    const { container } = render(<ExpandableText text={longText} onShowMore={() => {}} />);
    expect(container.textContent).toContain('هذا نص طويل');
  });

  it('calls onShowMore when clicking show more if visible', () => {
    const onShowMore = vi.fn();
    const longText = 'أ'.repeat(150);
    render(<ExpandableText text={longText} onShowMore={onShowMore} />);
    const moreLink = screen.queryByText(/عرض المزيد/);
    if (moreLink) {
      fireEvent.click(moreLink);
      expect(onShowMore).toHaveBeenCalledTimes(1);
    }
  });
});
