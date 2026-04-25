import type { LibraryScope } from '@ez-bokasafn/types';

// Curated subset of the consortium for v1. The upstream configuration call
// (/primaws/rest/pub/configuration/vid/...) returns the full list — switch to
// fetching dynamically if/when this grows unwieldy.
export const LIBRARY_SCOPES: LibraryScope[] = [
  { code: '10000_MYLIB', label: 'Allar bókasöfn' },
  { code: 'CONSORTIUM', label: 'Stærsta safnið' },
];
