/**
 * PhotoGridSkeleton Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render } from './utils';
import { PhotoGridSkeleton } from '@/app/components/photos/PhotoGridSkeleton';

describe('PhotoGridSkeleton', () => {
  it('renders 8 skeleton items', () => {
    const { container } = render(<PhotoGridSkeleton />);
    const skeletons = container.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThanOrEqual(8);
  });
});
