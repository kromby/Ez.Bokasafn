import { writable } from 'svelte/store';
import { BRANCHES } from '$lib/branches';

const KEY = 'myBranch';

function normalizeBranch(name: string | null | undefined): string | undefined {
  return name && BRANCHES.includes(name) ? name : undefined;
}

function readInitial(): string | undefined {
  if (typeof localStorage === 'undefined') return undefined;
  return normalizeBranch(localStorage.getItem(KEY));
}

export const myBranch = writable<string | undefined>(readInitial());

export function setMyBranch(name: string | undefined): void {
  const normalized = normalizeBranch(name);
  myBranch.set(normalized);
  if (typeof localStorage === 'undefined') return;
  if (normalized === undefined) {
    localStorage.removeItem(KEY);
  } else {
    localStorage.setItem(KEY, normalized);
  }
}
