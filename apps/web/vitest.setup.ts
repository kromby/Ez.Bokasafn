import { vi } from 'vitest';

// Mock DOM APIs that may not be available in test environment
if (!globalThis.fetch) {
  globalThis.fetch = vi.fn();
}

// Ensure window and document are available
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  // DOM is available, vitest will use it
}
