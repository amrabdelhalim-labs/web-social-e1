import '@testing-library/jest-dom/vitest';

// ─── getUserMedia mock for useCamera tests ────────────────────────────────────

import { vi } from 'vitest';

const mockGetUserMedia = vi.fn();
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  configurable: true,
  value: {
    getUserMedia: mockGetUserMedia,
  },
});

// ─── Canvas mocks (jsdom does not implement getContext/toBlob) ─────────────────

const mockDrawImage = vi.fn();
function mockToBlobImpl(
  this: HTMLCanvasElement,
  callback: BlobCallback,
  _type?: string,
  _quality?: number
) {
  queueMicrotask(() => callback(new Blob([''], { type: 'image/jpeg' })));
}

(HTMLCanvasElement.prototype as { getContext: (id: string) => RenderingContext | null }).getContext =
  function (this: HTMLCanvasElement, contextId: string): RenderingContext | null {
    if (contextId === '2d') {
      return {
        drawImage: mockDrawImage,
        canvas: this,
        get fillStyle() {
          return '';
        },
        set fillStyle(_: string) {},
        get strokeStyle() {
          return '';
        },
        set strokeStyle(_: string) {},
        get lineWidth() {
          return 0;
        },
        set lineWidth(_: number) {},
      } as unknown as CanvasRenderingContext2D;
    }
    return null;
  };

HTMLCanvasElement.prototype.toBlob = mockToBlobImpl;

// ─── matchMedia ───────────────────────────────────────────────────────────────

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });
