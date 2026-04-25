import { describe, it, expect, vi } from 'vitest';
import { apiSuggest, apiSearch, apiBook, ApiError } from '../../src/lib/api.js';

describe('api client', () => {
  it('apiSuggest returns suggestions', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ suggestions: ['x'] }),
      }),
    );
    const r = await apiSuggest('x', 'CONSORTIUM');
    expect(r.suggestions).toEqual(['x']);
  });

  it('apiSearch returns shaped result', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ available: [], onLoan: [], total: 0 }),
      }),
    );
    const r = await apiSearch('x', 'CONSORTIUM');
    expect(r.total).toBe(0);
  });

  it('apiBook returns shaped book detail', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          book: { mmsId: 'm', title: 't', coverSources: [], branchesOnShelf: [], genres: [] },
          branches: [],
        }),
      }),
    );
    const r = await apiBook('m', 'CONSORTIUM');
    expect(r.book.mmsId).toBe('m');
  });

  it('throws ApiError on non-2xx', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        json: async () => ({ error: { message: 'oops' } }),
      }),
    );
    await expect(apiSearch('x', 'CONSORTIUM')).rejects.toBeInstanceOf(ApiError);
  });

  it('aborts when AbortSignal is aborted', async () => {
    const ctrl = new AbortController();
    ctrl.abort();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('aborted', 'AbortError')));
    await expect(apiSuggest('x', 'CONSORTIUM', ctrl.signal)).rejects.toMatchObject({ name: 'AbortError' });
  });
});
