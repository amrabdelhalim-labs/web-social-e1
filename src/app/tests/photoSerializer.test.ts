/**
 * photoSerializer Tests
 *
 * Verifies that serializePhoto converts Mongoose-style documents (including
 * toObject() output) into plain, JSON-serializable Photo values.
 *
 * Covers:
 *  - Full document with populated user
 *  - Document without description (optional field)
 *  - isLiked flag propagated correctly
 *  - Date objects converted to ISO strings
 *  - ObjectId-like values (toString produces hex string)
 *  - Unpopulated user field (ObjectId in place of user object)
 *  - Missing / null avatarUrl
 */

import { describe, it, expect } from 'vitest';
import { serializePhoto } from '@/app/lib/photoSerializer';

const NOW = new Date('2026-01-15T12:00:00.000Z');

function makeDoc(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    _id: { toString: () => 'photo-001' },
    title: 'غروب الشمس',
    description: 'وصف الصورة',
    imageUrl: '/uploads/sunset.png',
    user: {
      _id: { toString: () => 'user-001' },
      name: 'أحمد',
      avatarUrl: '/uploads/avatar.png',
    },
    likesCount: 5,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

describe('serializePhoto', () => {
  it('يُحوّل مستنداً كاملاً إلى Photo قابلة للتسلسل', () => {
    const photo = serializePhoto(makeDoc());

    expect(photo._id).toBe('photo-001');
    expect(photo.title).toBe('غروب الشمس');
    expect(photo.description).toBe('وصف الصورة');
    expect(photo.imageUrl).toBe('/uploads/sunset.png');
    expect(photo.user._id).toBe('user-001');
    expect(photo.user.name).toBe('أحمد');
    expect(photo.user.avatarUrl).toBe('/uploads/avatar.png');
    expect(photo.likesCount).toBe(5);
    expect(photo.isLiked).toBe(false);
    expect(photo.createdAt).toBe(NOW.toISOString());
    expect(photo.updatedAt).toBe(NOW.toISOString());
  });

  it('يُضبط isLiked على true عند تمرير true', () => {
    const photo = serializePhoto(makeDoc(), true);
    expect(photo.isLiked).toBe(true);
  });

  it('يُعيد description كـ undefined عندما يكون فارغاً', () => {
    const photo = serializePhoto(makeDoc({ description: '' }));
    expect(photo.description).toBeUndefined();
  });

  it('يُعيد description كـ undefined عندما يكون null/undefined', () => {
    expect(serializePhoto(makeDoc({ description: null })).description).toBeUndefined();
    expect(serializePhoto(makeDoc({ description: undefined })).description).toBeUndefined();
  });

  it('يحوّل Date إلى ISO string', () => {
    const photo = serializePhoto(makeDoc({ createdAt: new Date('2026-03-01T00:00:00.000Z') }));
    expect(photo.createdAt).toBe('2026-03-01T00:00:00.000Z');
  });

  it('يُعامل قيمة createdAt غير Date كـ String()', () => {
    const photo = serializePhoto(makeDoc({ createdAt: '2026-01-01' }));
    expect(photo.createdAt).toBe('2026-01-01');
  });

  it('يُعيد likesCount كـ 0 عند غياب الحقل', () => {
    const photo = serializePhoto(makeDoc({ likesCount: undefined }));
    expect(photo.likesCount).toBe(0);
  });

  it('يضع avatarUrl كـ null عند غيابه', () => {
    const photo = serializePhoto(makeDoc({ user: { _id: 'u1', name: 'علي', avatarUrl: null } }));
    expect(photo.user.avatarUrl).toBeNull();
  });

  it('يُعطي _id وname فارغَين عند غياب user', () => {
    const photo = serializePhoto(makeDoc({ user: undefined }));
    expect(photo.user._id).toBe('');
    expect(photo.user.name).toBe('');
    expect(photo.user.avatarUrl).toBeNull();
  });

  it('يتعامل مع user كـ plain object (خرج toObject()) بصحة', () => {
    const doc = makeDoc({
      user: { _id: { toString: () => 'mongo-user-42' }, name: 'منى', avatarUrl: null },
    });
    const photo = serializePhoto(doc);
    expect(photo.user._id).toBe('mongo-user-42');
    expect(photo.user.name).toBe('منى');
  });
});
