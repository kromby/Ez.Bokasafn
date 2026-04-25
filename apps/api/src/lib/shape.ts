import type {
  Book,
  BookDetail,
  BranchAvailability,
  SearchResponse,
  SuggestResponse,
  BookResponse,
} from '@ez-bokasafn/types';
import type { SuggestRaw } from './leitir.js';

// ─── helpers ──────────────────────────────────────────────────────
const first = (arr?: string[] | null): string | undefined =>
  Array.isArray(arr) && arr.length > 0 ? arr[0] : undefined;

const yearOf = (s?: string): number | undefined => {
  if (!s) return undefined;
  const m = /\b(\d{4})\b/.exec(s);
  return m ? Number(m[1]) : undefined;
};

const toCoverSources = (mmsId: string, isbn?: string): string[] => {
  const out = [`https://baekur.is/cover/tbn/${mmsId}`];
  if (isbn) {
    out.push(
      `https://proxy-euf.hosted.exlibrisgroup.com/exl_rewrite/syndetics.com/index.php?client=primo&isbn=${encodeURIComponent(isbn)}/sc.jpg`,
    );
  }
  return out;
};

function isPhysicalBook(doc: any): boolean {
  const type = first(doc?.pnx?.display?.type)?.toLowerCase() ?? '';
  return type === 'book';
}

function deliveryToBranches(deliveryDoc: any): {
  onShelf: string[];
  earliestReturn?: string;
  hasAny: boolean;
} {
  const records = deliveryDoc?.delivery?.holding ?? [];
  const onShelf: string[] = [];
  const returns: string[] = [];
  for (const r of records) {
    const branch = r?.libraryName ?? r?.subLocation ?? r?.location;
    if (!branch) continue;
    const isAvailable = r?.availabilityStatus === 'available' || r?.availability === 'available';
    if (isAvailable) onShelf.push(branch);
    else if (typeof r?.dueDate === 'string') returns.push(r.dueDate);
  }
  returns.sort();
  return {
    onShelf: [...new Set(onShelf)],
    ...(returns[0] && { earliestReturn: returns[0] }),
    hasAny: records.length > 0,
  };
}

// ─── suggest ──────────────────────────────────────────────────────
export function shapeSuggest(raw: SuggestRaw[]): SuggestResponse {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of raw) {
    if (!r?.text) continue;
    if (seen.has(r.text)) continue;
    seen.add(r.text);
    out.push(r.text);
  }
  return { suggestions: out };
}

// ─── search ───────────────────────────────────────────────────────
function pnxToBook(doc: any, deliveryByMms: Map<string, any>): Book | null {
  const mmsId = first(doc?.pnx?.control?.recordid);
  if (!mmsId) return null;
  if (!isPhysicalBook(doc)) return null;

  const title = first(doc?.pnx?.display?.title) ?? '(óþekktur titill)';
  const author = first(doc?.pnx?.display?.creator) ?? first(doc?.pnx?.display?.contributor);
  const yearStr = first(doc?.pnx?.display?.creationdate);
  const year = yearOf(yearStr);
  const isbn = first(doc?.pnx?.search?.isbn);
  const coverSources = toCoverSources(mmsId, isbn);

  const delivery = deliveryByMms.get(mmsId);
  const branches = delivery ? deliveryToBranches(delivery) : { onShelf: [], hasAny: false };

  return {
    mmsId,
    title,
    ...(author && { author }),
    ...(year && { year }),
    ...(isbn && { isbn }),
    coverSources,
    branchesOnShelf: branches.onShelf,
    ...(branches.onShelf.length === 0 && branches.earliestReturn && { earliestReturn: branches.earliestReturn }),
  };
}

export function shapeSearch(pnxs: any, delivery: any): SearchResponse {
  const deliveryByMms = new Map<string, any>();
  for (const d of delivery?.docs ?? []) {
    const id = first(d?.pnx?.control?.recordid);
    if (id) deliveryByMms.set(id, d);
  }

  const available: Book[] = [];
  const onLoan: Book[] = [];
  for (const doc of pnxs?.docs ?? []) {
    const book = pnxToBook(doc, deliveryByMms);
    if (!book) continue;
    if (book.branchesOnShelf.length > 0) available.push(book);
    else onLoan.push(book);
  }

  return {
    available,
    onLoan,
    total: pnxs?.info?.total ?? available.length + onLoan.length,
    didYouMean: pnxs?.did_u_mean,
  };
}

// ─── book detail ──────────────────────────────────────────────────
export function shapeBook(pnxDoc: any, physical: any): BookResponse {
  const mmsId = first(pnxDoc?.pnx?.control?.recordid) ?? '';
  const title = first(pnxDoc?.pnx?.display?.title) ?? '(óþekktur titill)';
  const author = first(pnxDoc?.pnx?.display?.creator) ?? first(pnxDoc?.pnx?.display?.contributor);
  const year = yearOf(first(pnxDoc?.pnx?.display?.creationdate));
  const isbn = first(pnxDoc?.pnx?.search?.isbn);
  const summary = first(pnxDoc?.pnx?.display?.description);
  const genres: string[] = pnxDoc?.pnx?.display?.subject ?? [];
  const pageCountRaw = first(pnxDoc?.pnx?.display?.format);
  const pageCount = pageCountRaw ? Number(/\d+/.exec(pageCountRaw)?.[0] ?? '') || undefined : undefined;
  const coverSources = toCoverSources(mmsId, isbn);

  const branches: BranchAvailability[] = [];
  const onShelfNames: string[] = [];
  const returns: string[] = [];
  for (const r of physical?.records ?? []) {
    const branch = r?.libraryName ?? r?.location ?? '(óþekkt útibú)';
    const callNumber = r?.callNumber;
    const isAvailable = r?.availabilityStatus === 'available' || r?.availability === 'available';
    if (isAvailable) {
      branches.push({
        branch,
        status: 'on-shelf',
        ...(callNumber && { callNumber }),
      });
      onShelfNames.push(branch);
    } else {
      const dueDate = typeof r?.dueDate === 'string' ? r.dueDate : undefined;
      branches.push({
        branch,
        status: 'on-loan',
        ...(callNumber && { callNumber }),
        ...(dueDate && { earliestReturn: dueDate }),
      });
      if (dueDate) returns.push(dueDate);
    }
  }
  returns.sort();

  const book: BookDetail = {
    mmsId,
    title,
    ...(author && { author }),
    ...(year && { year }),
    ...(isbn && { isbn }),
    coverSources,
    branchesOnShelf: onShelfNames,
    ...(onShelfNames.length === 0 && returns[0] && { earliestReturn: returns[0] }),
    ...(summary && { summary }),
    genres,
    ...(pageCount && { pageCount }),
  };

  return { book, branches };
}
