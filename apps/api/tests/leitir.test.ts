import { describe, it, expect, beforeEach, vi } from 'vitest';
import { __resetJwtCacheForTests } from '../src/lib/jwtCache.js';
import { suggest, search, getPhysicalService, getFullRecord } from '../src/lib/leitir.js';

function fakeJwt(expSecondsFromNow: number): string {
  const header = Buffer.from('{"alg":"none"}').toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    exp: Math.floor(Date.now() / 1000) + expSecondsFromNow,
  })).toString('base64url');
  return `${header}.${payload}.`;
}

beforeEach(() => {
  __resetJwtCacheForTests();
  vi.restoreAllMocks();
});

function mockFetchSequence(...responses: Array<{ ok: boolean; status?: number; body?: unknown }>) {
  let i = 0;
  return vi.fn().mockImplementation(async () => {
    const r = responses[i++];
    if (!r) throw new Error('Unexpected extra fetch call');
    return {
      ok: r.ok,
      status: r.status ?? (r.ok ? 200 : 500),
      text: async () => (typeof r.body === 'string' ? r.body : JSON.stringify(r.body ?? {})),
      json: async () => r.body,
    };
  });
}

describe('suggest', () => {
  it('returns the upstream suggestions array', async () => {
    const fetchMock = mockFetchSequence(
      { ok: true, body: fakeJwt(3600) }, // jwt
      { ok: true, body: { response: { docs: [{ text: 'sjálfstætt' }, { text: 'sjálfstætt fólk' }] } } },
    );
    vi.stubGlobal('fetch', fetchMock);

    const out = await suggest('sjálf', '10000_BORG');
    expect(out).toEqual([{ text: 'sjálfstætt' }, { text: 'sjálfstætt fólk' }]);
  });
});

describe('search', () => {
  it('returns docs and didYouMean from PNX', async () => {
    const fetchMock = mockFetchSequence(
      { ok: true, body: fakeJwt(3600) },
      { ok: true, body: { info: { total: 2 }, docs: [{ pnx: { control: { recordid: ['x1'] } } }], did_u_mean: 'foo' } },
    );
    vi.stubGlobal('fetch', fetchMock);

    const out = await search('x', '10000_BORG', 0);
    expect(out.info.total).toBe(2);
    expect(out.docs).toHaveLength(1);
    expect(out.did_u_mean).toBe('foo');
  });

  it('throws HttpError on upstream 401', async () => {
    const fetchMock = mockFetchSequence(
      { ok: true, body: fakeJwt(3600) },
      { ok: false, status: 401, body: '' },
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(search('x', '10000_BORG', 0)).rejects.toMatchObject({ status: 401 });
  });
});

describe('getPhysicalService', () => {
  it('returns the physical service payload', async () => {
    const fetchMock = mockFetchSequence(
      { ok: true, body: fakeJwt(3600) },
      { ok: true, body: { records: [{ recordOwner: '354ILC_NETWORK' }] } },
    );
    vi.stubGlobal('fetch', fetchMock);

    const out = await getPhysicalService('991009684239706886');
    expect(out.records).toHaveLength(1);
  });
});

describe('getFullRecord', () => {
  it('returns the full PNX record', async () => {
    const fetchMock = mockFetchSequence(
      { ok: true, body: fakeJwt(3600) },
      { ok: true, body: { pnx: { display: { title: ['Sjálfstætt fólk'] } } } },
    );
    vi.stubGlobal('fetch', fetchMock);

    const out = await getFullRecord('991009684239706886');
    expect(out.pnx.display.title[0]).toBe('Sjálfstætt fólk');
  });
});
