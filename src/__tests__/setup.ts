import '@testing-library/jest-dom';

// Mock crypto.randomUUID for tests (jsdom doesn't always have it)
if (!globalThis.crypto?.randomUUID) {
  let counter = 0;
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      ...globalThis.crypto,
      randomUUID: () => `test-uuid-${++counter}`
    }
  });
}

// Mock scrollIntoView (not available in jsdom)
Element.prototype.scrollIntoView = () => {};
