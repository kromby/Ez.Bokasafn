/**
 * Canonical branch names. Must match upstream `BranchAvailability.branch`
 * byte-for-byte. Sorted alphabetically with `Intl.Collator('is')`.
 *
 * Refresh procedure: see docs/superpowers/specs/2026-05-15-my-branch-picker-design.md
 * ("Implementation notes / Populating BRANCHES"). One-off prod discovery
 * against a widely-held mmsId, then `Intl.Collator('is')` sort.
 */
export const BRANCHES: readonly string[] = [
  'Borgarbókasafn — Árbær',
  'Borgarbókasafn — Gerðuberg',
  'Borgarbókasafn — Grófin',
  'Borgarbókasafn — Kringlan',
  'Borgarbókasafn — Sólheimar',
  'Borgarbókasafn — Spöngin',
  'Bókasafn Garðabæjar',
  'Bókasafn Hafnarfjarðar',
  'Bókasafn Kópavogs',
  'Bókasafn Mosfellsbæjar',
  'Bókasafn Seltjarnarness',
];
