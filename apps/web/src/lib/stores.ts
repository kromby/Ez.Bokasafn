import { writable } from 'svelte/store';
import type { LibraryScope } from '@ez-bokasafn/types';

const KEY = 'lastScope';

function readInitial(): LibraryScope | undefined {
  if (typeof localStorage === 'undefined') return undefined;
  const raw = localStorage.getItem(KEY);
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.code === 'string' && typeof parsed.label === 'string') return parsed;
  } catch {}
  return undefined;
}

export const libraryScope = writable<LibraryScope | undefined>(readInitial());

export function setLibraryScope(scope: LibraryScope): void {
  libraryScope.set(scope);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(KEY, JSON.stringify(scope));
  }
}
