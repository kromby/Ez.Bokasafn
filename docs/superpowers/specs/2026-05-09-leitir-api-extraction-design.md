# Design: Ez.Leitir — Standalone Leitir.is API Wrapper

## Context

Ez.Bokasafn has a TypeScript Azure Functions backend that wraps the Leitir.is (Ex Libris Primo) API. LibraryCop has its own C# Leitir integration for ISBN-based book lookups. Both hit the same upstream independently — duplicated logic, different quality (LibraryCop's doesn't manage the guest JWT and is more brittle).

The goal is a standalone C# Azure Functions project — `Ez.Leitir` — that owns all Leitir.is access. Phase 1 ports Ez.Bokasafn's three API endpoints. Ez.Bokasafn's TypeScript backend is then deleted. Phase 2 (separate plan) updates LibraryCop's `LeitirApiDataAccess` to call Ez.Leitir instead of leitir.is directly.

---

## Why a Single Search Endpoint Covers Both Projects

Ez.Bokasafn's `search.ts` passes an **empty delivery object** to `shapeSearch`: `shapeSearch(pnxs, { docs: [] })`. Search results carry no branch availability — only the book detail endpoint fetches holdings. The search endpoint is a plain PNX query.

LibraryCop's `LeitirApiDataAccess` calls the same PNX endpoint with an ISBN as the query term and reads the first result. These are identical calls. `/api/search?q=<isbn>&scope=10000_MYLIB` serves LibraryCop's book lookup with no changes to the endpoint contract.

---

## New Project: `Ez.Leitir`

**Location:** New standalone git repo at `/Users/kromby/Source/Personal/Ez.Leitir/`

**Stack:** C# .NET 10, Azure Functions v4 isolated worker model, `System.Text.Json`

---

## Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/suggest?q=&scope=` | Autocomplete suggestions |
| GET | `/api/search?q=&scope=&offset=` | PNX search (keyword or ISBN) |
| GET | `/api/book/{mmsId}` | Book detail + per-branch availability |

All endpoints are anonymous to callers but protected by API key (see Authentication). `scope` is a Leitir scope code (e.g. `10000_MYLIB`).

---

## Authentication

Simple API key: callers include `X-Api-Key: <key>` in every request. The function validates it against an `LEITIR_API_KEY` environment variable and returns `401` on mismatch. Combined with `ALLOWED_ORIGINS` CORS restriction, this is sufficient protection for a personal project.

Ez.Bokasafn's frontend includes the key in requests (it will be visible in browser DevTools — acceptable given the project scope). LibraryCop includes it as a configured secret.

---

## Project Structure

```
Ez.Leitir/
├── Functions/
│   ├── SuggestFunction.cs
│   ├── SearchFunction.cs
│   └── BookFunction.cs
├── Services/
│   ├── LeitirClient.cs        — HTTP calls to leitir.is
│   └── LeitirJwtCache.cs      — in-memory guest JWT management
├── Shaping/
│   └── LeitirShaper.cs        — PNX → clean models
├── Models/
│   ├── Book.cs
│   ├── BookDetail.cs
│   ├── BranchAvailability.cs
│   ├── SearchResponse.cs
│   ├── SuggestResponse.cs
│   └── BookResponse.cs
└── Program.cs                 — DI wiring, CORS, API key middleware
```

---

## Key Implementation Notes

### LeitirJwtCache (port of `apps/api/src/lib/jwtCache.ts`)

Fetch guest JWT from:
```
GET /primaws/rest/pub/institution/354ILC_NETWORK/guestJwt?isGuest=true&lang=is&viewId=354ILC_NETWORK:10000_UNION
```

- Parse `exp` claim from JWT payload to determine expiry
- Proactive refresh 30 minutes before expiry
- `SemaphoreSlim(1,1)` for in-flight deduplication (mirrors the `inFlight` promise in TypeScript)
- Register as singleton in DI
- In-memory cache is per function instance — each cold start fetches a fresh JWT, which is acceptable (the call is fast, ~100ms)

### LeitirClient (port of `apps/api/src/lib/leitir.ts`)

All requests add `Authorization: Bearer <jwt>` and `Accept: application/json`. Port these six calls:

1. `suggest(q, scope)` → `GET /primaws/rest/pub/suggest?q=&scope=&vid=&lang=is`
2. `search(q, scope, offset)` → `GET /primaws/rest/pub/pnxs?q=any,contains,&inst=&scope=&vid=&tab=MyLibrary&limit=20&offset=&sort=rank&lang=is`
3. `delivery(q, scope, offset)` → `POST /primaws/rest/pub/delivery?<same params>` *(used only by book detail)*
4. `deliveryByMmsIds(mmsIds, scope)` → `POST /primaws/rest/pub/delivery?...` with `{ mmsIds }` body
5. `getPhysicalService(mmsId)` → `GET /primaws/rest/pub/getPhysicalService/{mmsId}?vid=&recordOwner=&sourceRecordId=&resource_type=book`
6. `getFullRecord(mmsId)` → `GET /primaws/rest/priv/nz/pnx/P/{mmsId}?record-institution=&lang=is`

Return `JsonElement` from all methods; shaping is separate.

### LeitirShaper (port of `apps/api/src/lib/shape.ts`)

Use `System.Text.Json.JsonElement` with null-safe helper extensions (`FirstString(string path)` etc.) for PNX traversal. Port these three functions:

- `ShapeSuggest(JsonElement raw)` → `SuggestResponse` — deduplicate suggestion strings
- `ShapeSearch(JsonElement pnxs)` → `SearchResponse` — no delivery; all results land in `onLoan` (branchesOnShelf empty), matching current Ez.Bokasafn behavior
- `ShapeBook(JsonElement pnxDoc, JsonElement physical)` → `BookResponse` — per-branch availability with callNumber and dueDate

Cover sources: `https://baekur.is/cover/tbn/{mmsId}` always, plus Syndetics URL when ISBN is known.

Physical resource filter: include only `book`, `journal`, `newspaper`, `manuscript` types.

---

## Environment Variables

| Variable | Default | Notes |
|----------|---------|-------|
| `LEITIR_BASE_URL` | `https://www.leitir.is` | |
| `LEITIR_VID` | `354ILC_NETWORK:10000_UNION` | |
| `LEITIR_INST` | `354ILC_NETWORK` | |
| `LEITIR_API_KEY` | — | Required; callers pass as `X-Api-Key` header |
| `ALLOWED_ORIGINS` | — | Comma-separated; must include Ez.Bokasafn's Static Web Apps domain |

---

## Ez.Bokasafn Changes

1. Add `PUBLIC_LEITIR_API_URL` and `PUBLIC_LEITIR_API_KEY` to SvelteKit env config
2. Update `apps/web/src/lib/api.ts` — use absolute URL and include `X-Api-Key` header on all requests
3. Delete `apps/api/` entirely — TypeScript Azure Functions no longer needed
4. Update `staticwebapp.config.json` to remove integrated Functions routing

---

## Source Files to Read Before Writing Any C#

All under `/Users/kromby/Source/Personal/Ez.Bokasafn/`:

| File | Purpose |
|------|---------|
| `apps/api/src/lib/jwtCache.ts` | Port to `Services/LeitirJwtCache.cs` |
| `apps/api/src/lib/leitir.ts` | Port to `Services/LeitirClient.cs` |
| `apps/api/src/lib/shape.ts` | Port to `Shaping/LeitirShaper.cs` |
| `packages/types/src/index.ts` | Port to `Models/*.cs` (use C# records; `BranchAvailability.Status` as string `"on-shelf"`/`"on-loan"` to match JSON exactly) |
| `apps/api/src/functions/suggest.ts` | Port to `Functions/SuggestFunction.cs` |
| `apps/api/src/functions/search.ts` | Port to `Functions/SearchFunction.cs` |
| `apps/api/src/functions/book.ts` | Port to `Functions/BookFunction.cs` |
| `docs/leitir-api-notes.md` | Upstream API reference |

---

## Verification

Create a `test.http` (REST Client format) at the repo root. Run the function host locally and confirm all pass:

1. Request with missing/wrong `X-Api-Key` → `401`
2. `GET /api/suggest?q=lax&scope=10000_MYLIB` → `{ suggestions: [...] }`
3. `GET /api/search?q=laxness&scope=10000_MYLIB&offset=0` → `{ available: [], onLoan: [...], total: N }`
4. `GET /api/search?q=9789979103844&scope=10000_MYLIB&offset=0` → correct book by ISBN
5. `GET /api/book/991009684239706886` → `{ book: {...}, branches: [...] }`
