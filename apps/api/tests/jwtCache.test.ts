import { describe, it, expect, beforeEach, vi } from 'vitest';
import { __resetJwtCacheForTests, getJwt } from '../src/lib/jwtCache.js';

// Helper: build a fake JWT (just the payload-base64 part is what we decode)
function fakeJwt(expSecondsFromNow: number): string {
  const header = Buffer.from('{"alg":"none"}').toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    exp: Math.floor(Date.now() / 1000) + expSecondsFromNow,
    userGroup: 'GUEST',
  })).toString('base64url');
  return `${header}.${payload}.`;
}

describe('jwtCache', () => {
  beforeEach(() => {
    __resetJwtCacheForTests();
    vi.restoreAllMocks();
  });

  it('fetches a JWT on first call', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => fakeJwt(3600),
    });
    vi.stubGlobal('fetch', fetchMock);

    const token = await getJwt();
    expect(token).toMatch(/^[\w-]+\.[\w-]+\.$/);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('returns the cached JWT on subsequent calls', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => fakeJwt(3600),
    });
    vi.stubGlobal('fetch', fetchMock);

    const a = await getJwt();
    const b = await getJwt();
    expect(a).toBe(b);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('refreshes when within 30 minutes of expiry', async () => {
    const expiringSoon = fakeJwt(15 * 60); // 15 min from now
    const fresh = fakeJwt(3600);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, text: async () => expiringSoon })
      .mockResolvedValueOnce({ ok: true, text: async () => fresh });
    vi.stubGlobal('fetch', fetchMock);

    const a = await getJwt();
    const b = await getJwt();
    expect(a).toBe(expiringSoon);
    expect(b).toBe(fresh);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('coalesces concurrent refresh calls into one upstream fetch', async () => {
    let resolveFetch: (v: any) => void = () => {};
    const fetchMock = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const p1 = getJwt();
    const p2 = getJwt();
    const p3 = getJwt();
    resolveFetch({ ok: true, text: async () => fakeJwt(3600) });
    const [a, b, c] = await Promise.all([p1, p2, p3]);

    expect(a).toBe(b);
    expect(b).toBe(c);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('throws when upstream returns non-OK', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    await expect(getJwt()).rejects.toThrow(/JWT/);
  });
});
