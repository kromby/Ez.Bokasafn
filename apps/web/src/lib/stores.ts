import { writable } from 'svelte/store';

const KEY = 'myBranch';

function readInitial(): string | undefined {
  if (typeof localStorage === 'undefined') return undefined;
  const raw = localStorage.getItem(KEY);
  return raw ?? undefined;
}

export const myBranch = writable<string | undefined>(readInitial());

export function setMyBranch(name: string | undefined): void {
  myBranch.set(name);
  if (typeof localStorage === 'undefined') return;
  if (name === undefined) {
    localStorage.removeItem(KEY);
  } else {
    localStorage.setItem(KEY, name);
  }
}
