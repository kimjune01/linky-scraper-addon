import { ConfigurableExtractor } from './ConfigurableExtractor';
import { Deduplicator } from './deduplicator';
import { saveContent, determineCollectionName } from '@extension/storage';

const DEBOUNCE_DELAY_MS = 2000; // Wait for DOM to settle before extracting

// Debounce utility
function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function (this: unknown, ...args: unknown[]) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), delay);
  } as T;
}

const domain = window.location.hostname;
const extractor = new ConfigurableExtractor(domain);
const deduplicator = new Deduplicator();

// Extraction logic - saves directly to IndexedDB
const extractAndSave = async () => {
  const content = extractor.extractContent(document.body.innerHTML);
  if (!deduplicator.isContentChanged(content)) {
    console.log('[Linky] Content unchanged, skipping');
    return;
  }
  console.log('[Linky] Content changed, saving');
  deduplicator.updateWithContent(content);

  const url = window.location.href;
  const collection = determineCollectionName(url);

  try {
    const result = await saveContent(url, content, collection);
    if (result.saved) {
      console.log(`[Linky] Saved to collection: ${result.collection}`);
    } else {
      console.error('[Linky] Failed to save:', result.error);
    }
  } catch (error) {
    console.error('[Linky] Error saving content:', error);
  }
};

// Debounced version to avoid excessive calls
const debouncedExtractAndSave = debounce(() => {
  extractAndSave().catch(console.error);
}, DEBOUNCE_DELAY_MS);

// Set up a MutationObserver to watch for DOM changes
const observer = new MutationObserver(() => {
  debouncedExtractAndSave();
});
observer.observe(document.body, {
  childList: true,
  subtree: true,
  characterData: true,
});

window.addEventListener('beforeunload', () => {
  observer.disconnect();
});
