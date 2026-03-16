/**
 * PhotoLightbox Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from './utils';
import { PhotoLightbox } from '@/app/components/photos/PhotoLightbox';

describe('PhotoLightbox', () => {
  it('does not render content when open is false', () => {
    render(<PhotoLightbox open={false} imageUrl="/img.jpg" onClose={() => {}} />);
    expect(screen.queryByRole('button', { name: /إغلاق/ })).not.toBeInTheDocument();
  });

  it('displays image and close button when open', () => {
    render(<PhotoLightbox open={true} imageUrl="/img.jpg" alt="صورة" onClose={() => {}} />);
    expect(screen.getByRole('button', { name: /إغلاق/ })).toBeInTheDocument();
    expect(screen.getByAltText('صورة')).toBeInTheDocument();
  });

  it('calls onClose when clicking close', () => {
    const onClose = vi.fn();
    render(<PhotoLightbox open={true} imageUrl="/img.jpg" onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /إغلاق/ }));
    expect(onClose).toHaveBeenCalled();
  });
});
