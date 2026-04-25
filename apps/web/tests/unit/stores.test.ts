import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { libraryScope, setLibraryScope } from '../../src/lib/stores.js';

describe('libraryScope store', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to undefined when no LocalStorage value is set', () => {
    expect(get(libraryScope)).toBeUndefined();
  });

  it('persists set value to LocalStorage', () => {
    setLibraryScope({ code: '10000_BORG', label: 'Borgarbókasafn' });
    expect(get(libraryScope)).toEqual({ code: '10000_BORG', label: 'Borgarbókasafn' });
    expect(localStorage.getItem('lastScope')).toContain('10000_BORG');
  });

  it('rehydrates from LocalStorage', async () => {
    localStorage.setItem('lastScope', JSON.stringify({ code: '10000_KOP', label: 'Kópavogsbókasafn' }));
    const fresh = await import(`../../src/lib/stores.js?bust=${Date.now()}`);
    expect(get(fresh.libraryScope)).toEqual({ code: '10000_KOP', label: 'Kópavogsbókasafn' });
  });
});
