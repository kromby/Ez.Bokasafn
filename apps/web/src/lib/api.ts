import type { SuggestResponse, SearchResponse, BookResponse } from '@ez-bokasafn/types';

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;
const API_KEY = import.meta.env.VITE_API_KEY as string;

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function getJson<T>(url: URL, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, {
    signal,
    headers: { 'X-Api-Key': API_KEY },
  });
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

export function apiSuggest(q: string, scope: string, signal?: AbortSignal): Promise<SuggestResponse> {
  const u = new URL('/api/suggest', API_BASE);
  u.searchParams.set('q', q);
  u.searchParams.set('scope', scope);
  return getJson<SuggestResponse>(u, signal);
}

export function apiSearch(q: string, scope: string, offset = 0, signal?: AbortSignal): Promise<SearchResponse> {
  const u = new URL('/api/search', API_BASE);
  u.searchParams.set('q', q);
  u.searchParams.set('scope', scope);
  u.searchParams.set('offset', String(offset));
  return getJson<SearchResponse>(u, signal);
}

export function apiBook(mmsId: string, _scope: string, signal?: AbortSignal): Promise<BookResponse> {
  const u = new URL(`/api/book/${encodeURIComponent(mmsId)}`, API_BASE);
  return getJson<BookResponse>(u, signal);
}
