import type { SuggestResponse, SearchResponse, BookResponse } from '@ez-bokasafn/types';

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(path, { signal });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error?.message) msg = body.error.message;
    } catch {}
    throw new ApiError(res.status, msg);
  }
  return (await res.json()) as T;
}

export function apiSuggest(q: string, lib: string, signal?: AbortSignal): Promise<SuggestResponse> {
  const u = new URL('/api/suggest', window.location.origin);
  u.searchParams.set('q', q);
  u.searchParams.set('lib', lib);
  return getJson<SuggestResponse>(u.toString(), signal);
}

export function apiSearch(q: string, lib: string, offset = 0, signal?: AbortSignal): Promise<SearchResponse> {
  const u = new URL('/api/search', window.location.origin);
  u.searchParams.set('q', q);
  u.searchParams.set('lib', lib);
  u.searchParams.set('offset', String(offset));
  return getJson<SearchResponse>(u.toString(), signal);
}

export function apiBook(mmsId: string, lib: string, signal?: AbortSignal): Promise<BookResponse> {
  const u = new URL(`/api/book/${encodeURIComponent(mmsId)}`, window.location.origin);
  u.searchParams.set('lib', lib);
  return getJson<BookResponse>(u.toString(), signal);
}
