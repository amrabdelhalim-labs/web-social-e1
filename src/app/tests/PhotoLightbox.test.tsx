/**
 * PhotoLightbox Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from './utils';
import { PhotoLightbox } from '@/app/components/photos/PhotoLightbox';

describe('PhotoLightbox', () => {
  it('لا يعرض المحتوى عند open=false', () => {
    render(
      <PhotoLightbox open={false} imageUrl="/img.jpg" onClose={() => {}} />
    );
    expect(screen.queryByRole('button', { name: /إغلاق/ })).not.toBeInTheDocument();
  });

  it('يعرض الصورة وزر الإغلاق عند open=true', () => {
    render(
      <PhotoLightbox open={true} imageUrl="/img.jpg" alt="صورة" onClose={() => {}} />
    );
    expect(screen.getByRole('button', { name: /إغلاق/ })).toBeInTheDocument();
    expect(screen.getByAltText('صورة')).toBeInTheDocument();
  });

  it('يستدعي onClose عند النقر على إغلاق', () => {
    const onClose = vi.fn();
    render(
      <PhotoLightbox open={true} imageUrl="/img.jpg" onClose={onClose} />
    );
    fireEvent.click(screen.getByRole('button', { name: /إغلاق/ }));
    expect(onClose).toHaveBeenCalled();
  });
});
