import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { suggestHandler } from '../src/functions/suggest.js';
import { __resetJwtCacheForTests } from '../src/lib/jwtCache.js';

function fakeJwt(): string {
  const header = Buffer.from('{"alg":"none"}').toString('base64url');
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${header}.${payload}.`;
}

function req(qs: Record<string, string>, headers: Record<string, string> = {}): any {
  const url = new URL(`http://localhost/api/suggest`);
  for (const [k, v] of Object.entries(qs)) url.searchParams.set(k, v);
  return {
    url: url.toString(),
    query: { get: (k: string) => url.searchParams.get(k) },
    headers: { get: (k: string) => headers[k.toLowerCase()] ?? null },
  };
}

const ctx = { log: () => {} } as any;
const oldEnv = process.env.ALLOWED_ORIGINS;

beforeEach(() => {
  __resetJwtCacheForTests();
  process.env.ALLOWED_ORIGINS = 'http://localhost:5173';
  vi.restoreAllMocks();
});
afterEach(() => {
  process.env.ALLOWED_ORIGINS = oldEnv;
});

describe('suggestHandler', () => {
  it('returns suggestions for a valid query', async () => {
    let calls = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async () => {
        calls += 1;
        if (calls === 1) return { ok: true, text: async () => fakeJwt() };
        return { ok: true, json: async () => ({ response: { docs: [{ text: 'foo' }, { text: 'bar' }] } }) };
      }),
    );
    const res = await suggestHandler(req({ q: 'foo', lib: 'CONSORTIUM' }, { origin: 'http://localhost:5173' }), ctx);
    expect(res.status).toBeUndefined(); // 200 implied
    expect(res.jsonBody).toEqual({ suggestions: ['foo', 'bar'] });
  });

  it('returns 403 on disallowed origin', async () => {
    const res = await suggestHandler(req({ q: 'foo', lib: 'CONSORTIUM' }, { origin: 'https://evil.example.com' }), ctx);
    expect(res.status).toBe(403);
  });

  it('returns 400 when q is missing', async () => {
    const res = await suggestHandler(req({ lib: 'CONSORTIUM' }, { origin: 'http://localhost:5173' }), ctx);
    expect(res.status).toBe(400);
  });

  it('returns 400 when lib is missing', async () => {
    const res = await suggestHandler(req({ q: 'foo' }, { origin: 'http://localhost:5173' }), ctx);
    expect(res.status).toBe(400);
  });
});
