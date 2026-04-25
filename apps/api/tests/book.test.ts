import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { bookHandler } from '../src/functions/book.js';
import { __resetJwtCacheForTests } from '../src/lib/jwtCache.js';

const here = dirname(fileURLToPath(import.meta.url));
function fixture(name: string): any {
  return JSON.parse(readFileSync(join(here, 'fixtures', name), 'utf8'));
}

const physicalFile = readdirSync(join(here, 'fixtures')).find((f) => f.startsWith('getPhysicalService-'))!;
const mmsId = physicalFile.replace('getPhysicalService-', '').replace('.json', '');

function fakeJwt(): string {
  const header = Buffer.from('{"alg":"none"}').toString('base64url');
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${header}.${payload}.`;
}

function req(params: Record<string, string>, qs: Record<string, string>, headers: Record<string, string> = {}): any {
  const url = new URL(`http://localhost/api/book/${params.mmsId}`);
  for (const [k, v] of Object.entries(qs)) url.searchParams.set(k, v);
  return {
    url: url.toString(),
    params,
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

describe('bookHandler', () => {
  it('returns shaped book detail from real fixtures', async () => {
    const pnxs = fixture('pnxs-laxness.json');
    const physical = fixture(physicalFile);
    let n = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async () => {
        n += 1;
        if (n === 1) return { ok: true, text: async () => fakeJwt() };
        if (n === 2) return { ok: true, json: async () => pnxs.docs[0] };
        return { ok: true, json: async () => physical };
      }),
    );
    const res = await bookHandler(req({ mmsId }, { lib: 'CONSORTIUM' }, { origin: 'http://localhost:5173' }), ctx);
    expect(res.status).toBeUndefined();
    const body = res.jsonBody as any;
    expect(body.book.mmsId).toBe(mmsId);
    expect(Array.isArray(body.branches)).toBe(true);
  });

  it('returns 404 when upstream throws 404', async () => {
    let n = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async () => {
        n += 1;
        if (n === 1) return { ok: true, text: async () => fakeJwt() };
        return { ok: false, status: 404 };
      }),
    );
    const res = await bookHandler(req({ mmsId: '999' }, { lib: 'CONSORTIUM' }, { origin: 'http://localhost:5173' }), ctx);
    expect(res.status).toBe(404);
  });

  it('returns 403 on disallowed origin', async () => {
    const res = await bookHandler(req({ mmsId }, { lib: 'CONSORTIUM' }, { origin: 'https://evil.example.com' }), ctx);
    expect(res.status).toBe(403);
  });
});
