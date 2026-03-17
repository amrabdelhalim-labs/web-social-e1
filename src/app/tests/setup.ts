import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import React from 'react';

// ─── next/image mock ──────────────────────────────────────────────────────────

vi.mock('next/image', () => ({
  default: (props: { src: string; alt: string }) => {
    return React.createElement('img', { src: props.src, alt: props.alt });
  },
}));

// ─── getUserMedia mock for useCamera tests ────────────────────────────────────

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
  type?: string,
  quality?: number
) {
  void type;
  void quality;
  queueMicrotask(() => callback(new Blob([''], { type: 'image/jpeg' })));
}

(
  HTMLCanvasElement.prototype as { getContext: (id: string) => RenderingContext | null }
).getContext = function (this: HTMLCanvasElement, contextId: string): RenderingContext | null {
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

// ─── ResizeObserver mock (required by ExpandableText) ─────────────────────────

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: ResizeObserverMock,
});

Object.defineProperty(globalThis, 'ResizeObserver', {
  writable: true,
  value: ResizeObserverMock,
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
