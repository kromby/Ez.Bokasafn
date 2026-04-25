// Shared types between the SvelteKit SPA and Azure Functions backend.
// Both apps reference this via path alias in their tsconfig.

export interface LibraryScope {
  code: string;   // e.g. "CONSORTIUM" or "10000_MYLIB"
  label: string;  // e.g. "Stærsta safnið"
}

export interface Book {
  mmsId: string;
  title: string;
  author?: string;
  year?: number;
  isbn?: string;
  /** Ordered list of cover URL candidates; consumer falls through on error. */
  coverSources: string[];
  /** Branch names where the book is currently on shelf. */
  branchesOnShelf: string[];
  /** ISO date (YYYY-MM-DD) — only set when status is on-loan. */
  earliestReturn?: string;
}

export interface BookDetail extends Book {
  summary?: string;
  genres: string[];
  pageCount?: number;
}

export interface BranchAvailability {
  branch: string;
  status: 'on-shelf' | 'on-loan';
  callNumber?: string;
  earliestReturn?: string;
}

// API response shapes
export interface SuggestResponse {
  suggestions: string[];
}

export interface SearchResponse {
  available: Book[];
  onLoan: Book[];
  total: number;
  didYouMean?: string;
}

export interface BookResponse {
  book: BookDetail;
  branches: BranchAvailability[];
}

export interface ErrorResponse {
  error: { message: string; code?: string };
}
