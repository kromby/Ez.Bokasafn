import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { assertAllowedOrigin } from '../src/lib/originCheck.js';
import { HttpError } from '../src/lib/errors.js';

function reqWithHeaders(h: Record<string, string>) {
  return { headers: { get: (k: string) => h[k.toLowerCase()] ?? null } } as any;
}

describe('assertAllowedOrigin', () => {
  const oldEnv = process.env.ALLOWED_ORIGINS;
  beforeEach(() => {
    process.env.ALLOWED_ORIGINS = 'https://app.example.com,http://localhost:5173';
  });
  afterEach(() => {
    process.env.ALLOWED_ORIGINS = oldEnv;
  });

  it('allows requests with matching Origin header', () => {
    expect(() => assertAllowedOrigin(reqWithHeaders({ origin: 'https://app.example.com' }))).not.toThrow();
  });

  it('allows when only Referer matches', () => {
    expect(() =>
      assertAllowedOrigin(reqWithHeaders({ referer: 'https://app.example.com/page' })),
    ).not.toThrow();
  });

  it('rejects when no header matches', () => {
    expect(() =>
      assertAllowedOrigin(reqWithHeaders({ origin: 'https://evil.example.com' })),
    ).toThrow(HttpError);
  });

  it('rejects when both headers are missing', () => {
    expect(() => assertAllowedOrigin(reqWithHeaders({}))).toThrow(HttpError);
  });

  it('throws an HttpError with status 403', () => {
    try {
      assertAllowedOrigin(reqWithHeaders({}));
    } catch (e) {
      expect(e).toBeInstanceOf(HttpError);
      expect((e as HttpError).status).toBe(403);
    }
  });
});
