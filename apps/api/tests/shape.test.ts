import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { shapeSearch, shapeBook, shapeSuggest } from '../src/lib/shape.js';

const here = dirname(fileURLToPath(import.meta.url));
function fixture(name: string): any {
  return JSON.parse(readFileSync(join(here, 'fixtures', name), 'utf8'));
}

describe('shapeSuggest', () => {
  it('extracts unique suggestion strings', () => {
    const out = shapeSuggest([{ text: 'a' }, { text: 'b' }, { text: 'a' }]);
    expect(out).toEqual({ suggestions: ['a', 'b'] });
  });

  it('handles empty input', () => {
    expect(shapeSuggest([])).toEqual({ suggestions: [] });
  });
});

describe('shapeSearch', () => {
  it('produces available + onLoan + total + didYouMean from real fixtures', () => {
    const pnxs = fixture('pnxs-laxness.json');
    const delivery = fixture('delivery-laxness.json');
    const out = shapeSearch(pnxs, delivery);
    expect(out.total).toBeGreaterThan(0);
    expect(out.available.length + out.onLoan.length).toBeLessThanOrEqual(out.total);
    for (const b of [...out.available, ...out.onLoan]) {
      expect(b.mmsId).toMatch(/^\d+$/);
      expect(typeof b.title).toBe('string');
      expect(b.coverSources.length).toBeGreaterThan(0);
    }
    // Available books must have at least one branch on shelf; onLoan must not.
    out.available.forEach((b) => expect(b.branchesOnShelf.length).toBeGreaterThan(0));
    out.onLoan.forEach((b) => expect(b.branchesOnShelf.length).toBe(0));
  });

  it('drops non-physical-book resource types', () => {
    const fakePnxs = {
      info: { total: 2 },
      docs: [
        {
          pnx: {
            control: { recordid: ['1'] },
            display: { title: ['Book A'], type: ['book'] },
          },
        },
        {
          pnx: {
            control: { recordid: ['2'] },
            display: { title: ['Article B'], type: ['article'] },
          },
        },
      ],
    };
    const out = shapeSearch(fakePnxs as any, { docs: [] } as any);
    expect(out.available.length + out.onLoan.length).toBe(1);
    const book = [...out.available, ...out.onLoan][0]!;
    expect(book.title).toBe('Book A');
  });
});

describe('shapeBook', () => {
  it('produces BookDetail and BranchAvailability rows from real fixtures', () => {
    const pnxs = fixture('pnxs-laxness.json');
    const mmsId = pnxs.docs?.[0]?.pnx?.control?.recordid?.[0];
    const physicalFixture = `getPhysicalService-${mmsId}.json`;
    const physical = fixture(physicalFixture);
    const out = shapeBook(pnxs.docs[0], physical);
    expect(out.book.mmsId).toBe(mmsId);
    expect(out.book.title.length).toBeGreaterThan(0);
    expect(Array.isArray(out.book.genres)).toBe(true);
    expect(out.branches.length).toBeGreaterThan(0);
    out.branches.forEach((b) => {
      expect(['on-shelf', 'on-loan']).toContain(b.status);
      expect(typeof b.branch).toBe('string');
    });
  });
});
