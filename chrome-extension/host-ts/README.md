# Native Messaging Host (TypeScript)

This is the native messaging host for the Hoarder Chrome extension. It receives scraped content from the extension and stores it in ChromaDB.

## Prerequisites

- Node.js >= 22.12.0
- ChromaDB server running on `localhost:8000` (optional, but required for storage)

## Installation

### 1. Build the host

```bash
cd chrome-extension/host-ts
pnpm install
pnpm build
```

### 2. Register with Chrome

```bash
pnpm install-host
```

This creates the native messaging manifest and wrapper script in the appropriate system location:

- **macOS**: `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/`
- **Linux**: `~/.config/google-chrome/NativeMessagingHosts/`
- **Windows**: `%LOCALAPPDATA%\Google\Chrome\User Data\NativeMessagingHosts\`

### 3. (Optional) Start ChromaDB

```bash
docker run -p 8000:8000 chromadb/chroma
```

## Uninstallation

```bash
pnpm uninstall-host
```

## Development

```bash
# Watch mode for development
pnpm dev

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

## Architecture

```
src/
├── index.ts           # Main entry point (message loop)
├── stdio.ts           # Chrome native messaging protocol
├── validator.ts       # Message validation
├── chromadb.ts        # ChromaDB integration
├── collection-name.ts # URL → collection name mapping
├── url-utils.ts       # URL parsing utilities
├── install.ts         # Installation script
└── types.ts           # TypeScript type definitions
```

## Message Format

The host expects messages in this format:

```typescript
{
  action: 'sendNativeMarkdown',
  url: string,
  type: 'profile' | 'search' | 'content',
  content: string  // Markdown content
}
```

And responds with:

```typescript
{
  saved: boolean,
  collection_name?: string,
  error?: string
}
```

## Collection Routing

URLs are automatically routed to semantic collections based on domain and path patterns:

| URL Pattern | Collection |
|-------------|------------|
| `linkedin.com/in/*` | `linkedin_profiles` |
| `github.com/user/repo` | `github_repositories` |
| `github.com/user/repo/pull/*` | `github_pull_requests` |
| `youtube.com/watch*` | `youtube_videos` |
| `reddit.com/r/subreddit` | `reddit_subreddit` |
| `*.pdf` | `document_files` |
| Default | `domain_pages` |

See `collection-name.ts` for the full list of 70+ patterns.
