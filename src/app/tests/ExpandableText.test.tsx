/**
 * ExpandableText Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from './utils';
import { ExpandableText } from '@/app/components/photos/ExpandableText';

describe('ExpandableText', () => {
  it('لا يعرض شيئاً عند نص فارغ', () => {
    const { container } = render(<ExpandableText text="" />);
    expect(container.firstChild).toBeNull();
  });

  it('يعرض النص بدون زر عند نص قصير (< 100 حرف)', () => {
    render(<ExpandableText text="نص قصير" />);
    expect(screen.getByText('نص قصير')).toBeInTheDocument();
    expect(screen.queryByText(/عرض المزيد/)).not.toBeInTheDocument();
  });

  it('يعرض زر "عرض المزيد" عند نص طويل ويبدّل عند النقر', () => {
    const longText = 'أ'.repeat(150);
    render(<ExpandableText text={longText} />);

    expect(screen.getByText(/عرض المزيد/)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/عرض المزيد/));
    expect(screen.getByText(/عرض أقل/)).toBeInTheDocument();
  });
});
