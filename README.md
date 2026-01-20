# Hoarder - Web Content Scraper Extension

A Chrome/Firefox extension that intelligently extracts web content and converts it to clean markdown format. Designed to work with a native messaging backend for content archival.

## Features

- **Smart Content Extraction**: Domain-specific CSS selectors for 50+ websites (LinkedIn, Reddit, Twitter, YouTube, etc.)
- **HTML to Markdown**: Clean conversion using semantic markdown processing
- **Deduplication**: Tracks content hashes to avoid reprocessing unchanged pages
- **Native Messaging**: Integrates with a TypeScript/Node.js backend for ChromaDB storage
- **Cross-Browser**: Supports Chrome and Firefox
- **Dark/Light Theme**: User-configurable UI theme

## Quick Start

### Prerequisites

- Node.js >= 22.12.0
- pnpm 9.15.1+

### Installation

```bash
# Install dependencies
pnpm install

# Development build (watches for changes)
pnpm dev

# Load the extension in Chrome:
# 1. Go to chrome://extensions
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the `dist` folder
```

### Building for Production

```bash
# Chrome
pnpm build
pnpm zip

# Firefox
pnpm build:firefox
pnpm zip:firefox
```

## Architecture

```
├── chrome-extension/     # Manifest and background service worker
├── pages/
│   ├── content/          # Main content extraction logic
│   ├── popup/            # Extension popup UI
│   ├── side-panel/       # Sidebar panel
│   ├── options/          # Settings page
│   └── content-ui/       # Injected UI components
└── packages/             # Shared libraries
    ├── storage/          # Chrome storage API wrapper
    ├── ui/               # UI components
    ├── i18n/             # Internationalization (en, ko)
    └── shared/           # Common utilities
```

## How It Works

1. **Content Script** (`pages/content/`) monitors page changes via `MutationObserver`
2. **ConfigurableExtractor** applies domain-specific selectors to extract relevant content
3. **HtmlProcessor** cleans HTML and converts to markdown (max 30KB)
4. **Deduplicator** checks if content has changed since last extraction
5. Content is sent via **native messaging** to the backend or saved to downloads

## Configuration

### Domain-Specific Extraction

Edit `pages/content/src/domain-exclusions.json` to customize extraction for specific sites:

```json
{
  "example.com": {
    "inclusionSelectors": ["main", "article"],
    "exclusionSelectors": ["nav", "footer", ".ads"],
    "loadingIndicators": ["Loading..."]
  }
}
```

### Environment Variables

Copy `.example.env` to `.env`:

```bash
CEB_DEV_LOCALE=      # Override locale during development
CEB_CI=              # Set for CI environments
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Development build with HMR |
| `pnpm build` | Production build for Chrome |
| `pnpm build:firefox` | Production build for Firefox |
| `pnpm zip` | Build and package Chrome extension |
| `pnpm zip:firefox` | Build and package Firefox extension |
| `pnpm type-check` | Run TypeScript type checking |
| `pnpm lint` | Run ESLint |
| `pnpm lint:fix` | Fix linting issues |
| `pnpm e2e` | Run end-to-end tests |
| `pnpm clean` | Clean build artifacts |

## Tech Stack

- **Framework**: React 19, TypeScript 5.8
- **Build**: Vite 6.1, Turbo
- **Styling**: Tailwind CSS 3.4
- **Testing**: Vitest
- **Validation**: Zod

## Native Messaging Host

The extension communicates with a native host (`com.hoarder.hoard`) using Chrome's native messaging API. The host stores content in ChromaDB with semantic collection routing.

### Setup

```bash
# Build and install the native host
cd chrome-extension/host-ts
pnpm install
pnpm build
pnpm install-host

# (Optional) Start ChromaDB
docker run -p 8000:8000 chromadb/chroma
```

### Message Format

```typescript
{
  action: 'sendNativeMarkdown',
  type: 'Content' | 'Profile' | 'Search',
  content: string,  // Markdown content
  url: string       // Source URL
}
```

See [chrome-extension/host-ts/README.md](chrome-extension/host-ts/README.md) for more details.

## License

See [LICENSE](LICENSE) for details.
