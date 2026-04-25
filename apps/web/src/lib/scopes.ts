import type { LibraryScope } from '@ez-bokasafn/types';

// Curated subset of the consortium for v1. Expand as needed; the upstream
// configuration call (/primaws/rest/pub/configuration/vid/...) returns the full
// list — switch to fetching dynamically if/when this grows unwieldy.
export const LIBRARY_SCOPES: LibraryScope[] = [
  { code: '10000_BORG', label: 'Borgarbókasafn Reykjavíkur' },
  { code: '10000_KOP', label: 'Bókasafn Kópavogs' },
  { code: '10000_HAFN', label: 'Bókasafn Hafnarfjarðar' },
  { code: '10000_GBSN', label: 'Bókasafn Garðabæjar' },
  { code: '10000_MOSF', label: 'Bókasafn Mosfellsbæjar' },
  { code: '10000_LBS', label: 'Landsbókasafn Íslands' },
];
