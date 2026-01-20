# Linky - Web Content Scraper Extension

A Chrome/Firefox extension that intelligently extracts web content and converts it to clean markdown format. All data is stored locally in IndexedDB with automatic LRU eviction.

## Features

- **Smart Content Extraction**: Domain-specific CSS selectors for 50+ websites (LinkedIn, Reddit, Twitter, YouTube, etc.)
- **HTML to Markdown**: Clean conversion using semantic markdown processing
- **Deduplication**: Tracks content hashes to avoid reprocessing unchanged pages
- **Local Storage**: Content stored in IndexedDB with automatic eviction (no external dependencies)
- **URL Categorization**: Automatic collection assignment based on URL patterns (70+ rules)
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
└── packages/
    ├── storage/          # IndexedDB storage with LRU eviction
    ├── ui/               # UI components
    ├── i18n/             # Internationalization (en, ko)
    └── shared/           # Common utilities
```

## How It Works

1. **Content Script** (`pages/content/`) monitors page changes via `MutationObserver`
2. **ConfigurableExtractor** applies domain-specific selectors to extract relevant content
3. **HtmlProcessor** cleans HTML and converts to markdown (max 30KB)
4. **Deduplicator** checks if content has changed since last extraction
5. **Collection Name** determines category from URL (e.g., `github_repositories`, `linkedin_profiles`)
6. Content is saved to **IndexedDB** with automatic LRU eviction

### Data Flow

```
Page loads → DOM mutation detected → 2s debounce
    ↓
Content extracted (domain-specific selectors)
    ↓
Converted to markdown
    ↓
Deduplicated (hash comparison)
    ↓
URL categorized → Collection assigned
    ↓
Saved to IndexedDB
    ↓
(If storage full) → LRU eviction (oldest 10% removed)
```

### Storage Limits

- **Max entries**: 10,000
- **Max size**: 100MB
- **Eviction**: Least-recently-accessed entries removed first

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
| `pnpm test` | Run unit tests |
| `pnpm type-check` | Run TypeScript type checking |
| `pnpm lint` | Run ESLint |
| `pnpm lint:fix` | Fix linting issues |
| `pnpm e2e` | Run end-to-end tests |
| `pnpm clean` | Clean build artifacts |

## Storage API

The extension exposes these functions for querying stored content:

```typescript
import {
  saveContent,
  getContentByUrl,
  getContentByCollection,
  getStorageStats,
  clearAllContent,
  deleteContentByUrl
} from '@extension/storage';

// Get all saved versions of a URL
const entries = await getContentByUrl('https://github.com/user/repo');

// Get all content in a collection
const githubRepos = await getContentByCollection('github_repositories');

// Get storage statistics
const stats = await getStorageStats();
// { totalEntries: 1234, totalSizeMB: 45.6, collections: { ... } }
```

### URL Collections

URLs are automatically categorized into collections:

| URL Pattern | Collection |
|-------------|------------|
| `github.com/user/repo` | `github_repositories` |
| `github.com/user/repo/pull/123` | `github_pull_requests` |
| `linkedin.com/in/name` | `linkedin_profiles` |
| `stackoverflow.com/questions/...` | `stackoverflow_questions` |
| `reddit.com/r/subreddit` | `reddit_subreddit` |
| `*.com/docs/*` | `*_documentation` |
| (default) | `domain_pages` |

See `packages/storage/lib/impl/collectionName.ts` for the full list of 70+ patterns.

## Tech Stack

- **Framework**: React 19, TypeScript 5.8
- **Build**: Vite 6.1, Turbo
- **Styling**: Tailwind CSS 3.4
- **Testing**: Vitest, fake-indexeddb
- **Validation**: Zod

## License

See [LICENSE](LICENSE) for details.
