# Ez Bokasafn

A modern web interface for searching the Icelandic library consortium (leitir.is). Ez Bokasafn provides a clean, accessible way to discover books and resources across Iceland's public libraries.

## What is Ez Bokasafn?

Ez Bokasafn (Easy Library) is an alternative interface to leitir.is, the unified library search service for Iceland's public libraries. It uses the Ex Libris Primo discovery API to enable searching across the entire Icelandic library consortium network.

## Tech Stack

- **Frontend:** [SvelteKit](https://kit.svelte.dev/) + [Vite](https://vitejs.dev/) + TypeScript
- **Backend:** [Azure Functions](https://azure.microsoft.com/services/functions/) + Node.js
- **Testing:** [Vitest](https://vitest.dev/) (unit), [Playwright](https://playwright.dev/) (E2E)
- **Package Manager:** [pnpm](https://pnpm.io/)
- **Monorepo:** Workspace packages with shared types

## Project Structure

```
.
├── apps/
│   ├── api/              # Azure Functions backend
│   └── web/              # SvelteKit frontend application
├── packages/
│   └── types/            # Shared TypeScript types
└── docs/
    └── leitir-api-notes.md  # API integration documentation
```

## Development

### Prerequisites

- **Node.js** 18+
- **pnpm** 9+

### Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Run development servers:
   ```bash
   # Terminal 1: Web frontend
   pnpm dev:web

   # Terminal 2: API backend
   pnpm dev:api
   ```

The web app runs at `http://localhost:5173` and the API at `http://localhost:7071`.

### Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev:web` | Start SvelteKit dev server |
| `pnpm dev:api` | Start Azure Functions emulator |
| `pnpm build` | Build all packages |
| `pnpm test` | Run all tests once |
| `pnpm typecheck` | Run TypeScript type checking |

### Web App

```bash
cd apps/web
pnpm dev          # Development server
pnpm build        # Production build
pnpm preview      # Preview production build
pnpm test         # Run unit tests
pnpm test:watch   # Watch mode for tests
pnpm test:e2e     # Run Playwright E2E tests
pnpm typecheck    # Type check with Svelte
```

### API

```bash
cd apps/api
pnpm start        # Development server (Azure Functions emulator)
pnpm build        # Compile TypeScript
pnpm test         # Run unit tests
pnpm typecheck    # Type check
```

## Architecture

Ez Bokasafn proxies requests to the leitir.is API (`primaws` endpoints) through an Azure Functions backend. This backend approach provides:

- **CORS isolation:** Handles CORS restrictions when calling leitir.is from a browser
- **Token management:** Manages JWT tokens and handles refresh/caching
- **IP binding:** Provides a stable origin for calls where IP binding is enforced
- **Analytics:** Instruments requests with Application Insights

### Key Endpoints

The backend proxies these leitir.is endpoints:
- **Suggest:** Autocomplete for search queries
- **PNX Search:** Full-text search across the library catalog
- **Delivery/Holdings:** Availability and physical copy information
- **Full Record:** Complete metadata for a catalog item
- **Facets:** Sidebar filters and faceted search

See `docs/leitir-api-notes.md` for detailed API documentation.

## Features

- Search across Iceland's entire library network
- Autocomplete suggestions while typing
- Library scope filtering (search within a specific library)
- Availability and holdings information
- Responsive, accessible design
- Dark mode support

## Contributing

Contributions are welcome! Please ensure:

- All tests pass: `pnpm test`
- Code is type-checked: `pnpm typecheck`
- Commits follow conventional commits format

## License

[Specify license if applicable]

## Credits

Built by Guðjón Karl Arnarson. Uses the Ex Libris Primo API via leitir.is.
