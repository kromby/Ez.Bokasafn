# Ez Bokasafn

A modern web interface for searching the Icelandic library consortium (leitir.is). Ez Bokasafn provides a clean, accessible way to discover books and resources across Iceland's public libraries.

## What is Ez Bokasafn?

Ez Bokasafn (Easy Library) is an alternative interface to leitir.is, the unified library search service for Iceland's public libraries. It uses the Ex Libris Primo discovery API to enable searching across the entire Icelandic library consortium network.

## Tech Stack

- **Frontend:** [SvelteKit](https://kit.svelte.dev/) + [Vite](https://vitejs.dev/) + TypeScript
- **Backend:** [Ez.Leitir](../Ez.Leitir) — standalone .NET Azure Functions service (separate repo/project)
- **Testing:** [Vitest](https://vitest.dev/) (unit), [Playwright](https://playwright.dev/) (E2E)
- **Package Manager:** [npm](https://www.npmjs.com/)
- **Monorepo:** Workspace packages with shared types

## Project Structure

```
.
├── apps/
│   └── web/              # SvelteKit frontend application
├── packages/
│   └── types/            # Shared TypeScript types
└── docs/
    └── leitir-api-notes.md  # Notes on the upstream leitir.is API
```

The backend lives in a separate project, `Ez.Leitir`, which exposes a small JSON API the frontend consumes.

## Development

### Prerequisites

- **Node.js** 18+
- **npm** 10+
- A running instance of the [Ez.Leitir](../Ez.Leitir) .NET API (default: `http://localhost:7071`)

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure the frontend's API connection:
   ```bash
   cp apps/web/.env.example apps/web/.env
   ```
   Edit `apps/web/.env` if your `Ez.Leitir` instance runs somewhere other than `http://localhost:7071`, or uses a non-default API key. The dev key matches `LEITIR_API_KEY` in `Ez.Leitir/local.settings.json`.

3. Start the API (in the `Ez.Leitir` project) and then run the web dev server:
   ```bash
   npm run dev:web
   ```

The web app runs at `http://localhost:5173`.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:web` | Start SvelteKit dev server |
| `npm run build` | Build all workspaces |
| `npm test` | Run all tests once |
| `npm run typecheck` | Run TypeScript type checking |

### Web App

```bash
npm run dev:web          # Development server
npm run build -w web     # Production build
npm run preview -w web   # Preview production build
npm test -w web          # Run unit tests
npm run test:watch -w web # Watch mode for tests
npm run test:e2e -w web  # Run Playwright E2E tests
npm run typecheck -w web # Type check with Svelte
```

## Architecture

The SvelteKit frontend talks directly to the `Ez.Leitir` .NET API over HTTPS. That service is responsible for proxying leitir.is, managing JWT tokens, and shaping responses; this repo contains only the frontend.

### Environment variables (frontend)

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | Origin of the `Ez.Leitir` API (e.g. `http://localhost:7071`) |
| `VITE_API_KEY` | Value sent as the `X-Api-Key` request header |
| `VITE_CF_WA_TOKEN` | Cloudflare Web Analytics token (optional, production only) |

Note: `VITE_*` values are inlined into the client bundle at build time and therefore publicly visible. `VITE_API_KEY` is intended as a soft rate-limit / abuse deterrent, not a secret.

### Endpoints consumed

The frontend calls three endpoints on `Ez.Leitir`:

- `GET /api/suggest?q=…&scope=…` — autocomplete suggestions
- `GET /api/search?q=…&scope=…&offset=…` — full-text search with availability
- `GET /api/book/{mmsId}` — full record + per-branch availability

See `docs/leitir-api-notes.md` for notes on the upstream leitir.is API the backend wraps.

## Features

- Search across Iceland's entire library network
- Autocomplete suggestions while typing
- Library scope filtering (search within a specific library)
- Availability and holdings information
- Responsive, accessible design
- Dark mode support

## Contributing

Contributions are welcome! Please ensure:

- All tests pass: `npm test`
- Code is type-checked: `npm run typecheck`
- Commits follow conventional commits format

## License

[Specify license if applicable]

## Credits

Built by Guðjón Karl Arnarson. Uses the Ex Libris Primo API via leitir.is.
