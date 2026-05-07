import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import searchHandler from '../src/functions/search.js';
import { __resetJwtCacheForTests } from '../src/lib/jwtCache.js';

const here = dirname(fileURLToPath(import.meta.url));
function fixture(name: string): any {
  return JSON.parse(readFileSync(join(here, 'fixtures', name), 'utf8'));
}

function fakeJwt(): string {
  const header = Buffer.from('{"alg":"none"}').toString('base64url');
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${header}.${payload}.`;
}

function req(qs: Record<string, string>, headers: Record<string, string> = {}): any {
  const url = new URL(`http://localhost/api/search`);
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

describe('searchHandler', () => {
  it('returns shaped search results from real fixtures', async () => {
    const pnxs = fixture('pnxs-laxness.json');
    const delivery = fixture('delivery-laxness.json');
    let n = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async () => {
        n += 1;
        if (n === 1) return { ok: true, text: async () => fakeJwt() };
        if (n === 2) return { ok: true, json: async () => pnxs };
        return { ok: true, json: async () => delivery };
      }),
    );
    const res = await searchHandler(
      req({ q: 'sjálfstætt fólk', lib: 'CONSORTIUM' }, { origin: 'http://localhost:5173' }),
      ctx,
    );
    expect(res.status).toBeUndefined();
    const body = res.jsonBody as any;
    expect(body.total).toBeGreaterThan(0);
    expect(Array.isArray(body.available)).toBe(true);
    expect(Array.isArray(body.onLoan)).toBe(true);
  });

  it('returns 403 on disallowed origin', async () => {
    const res = await searchHandler(req({ q: 'x', lib: 'CONSORTIUM' }, { origin: 'https://evil.example.com' }), ctx);
    expect(res.status).toBe(403);
  });

  it('returns 400 when q or lib is missing', async () => {
    const r1 = await searchHandler(req({ lib: 'CONSORTIUM' }, { origin: 'http://localhost:5173' }), ctx);
    const r2 = await searchHandler(req({ q: 'x' }, { origin: 'http://localhost:5173' }), ctx);
    expect(r1.status).toBe(400);
    expect(r2.status).toBe(400);
  });

  it('returns upstream status when upstream fails', async () => {
    let n = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async () => {
        n += 1;
        if (n === 1) return { ok: true, text: async () => fakeJwt() };
        return { ok: false, status: 503 };
      }),
    );
    const res = await searchHandler(req({ q: 'x', lib: 'CONSORTIUM' }, { origin: 'http://localhost:5173' }), ctx);
    expect(res.status).toBe(503);
  });

  it('passes offset parameter to upstream calls', async () => {
    const pnxs = fixture('pnxs-laxness.json');
    const delivery = fixture('delivery-laxness.json');
    let n = 0;
    const fetchMock = vi.fn().mockImplementation(async (url) => {
      n += 1;
      if (n === 1) return { ok: true, text: async () => fakeJwt() };
      if (n === 2) return { ok: true, json: async () => pnxs };
      return { ok: true, json: async () => delivery };
    });
    vi.stubGlobal('fetch', fetchMock);

    const res = await searchHandler(
      req({ q: 'test', lib: 'CONSORTIUM', offset: '10' }, { origin: 'http://localhost:5173' }),
      ctx,
    );

    expect(res.status).toBeUndefined();
    // Verify offset was passed (check second and third fetch calls contain offset=10)
    const calls = fetchMock.mock.calls;
    expect(calls[1]?.[0]).toContain('offset=10'); // search call
    expect(calls[2]?.[0]).toContain('offset=10'); // delivery call
  });
});
