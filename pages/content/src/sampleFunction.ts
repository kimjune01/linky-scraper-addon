import { ConfigurableExtractor } from './ConfigurableExtractor';
import type { NativeMessage } from './NativeMessage';
import { NativeMessageType } from './NativeMessage';
// import { isContentLoading } from './isContentLoading';

// Debounce utility (can be reused elsewhere)
function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function (this: unknown, ...args: unknown[]) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), delay);
  } as T;
}

export function sampleFunction() {
  const domain = window.location.hostname;
  const extractor = new ConfigurableExtractor(domain);

  let previousContentHash: string | null = null;

  function hashContent(content: string): string {
    // Simple non-secure hash (djb2)
    let hash = 5381;
    for (let i = 0; i < content.length; i++) {
      hash = (hash << 5) + hash + content.charCodeAt(i); // hash * 33 + c
    }
    return hash.toString();
  }

  // Extraction logic
  const extractAndLog = () => {
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) return;
    const content = extractor.extractContent(document.body.innerHTML);
    const contentHash = hashContent(content);
    if (contentHash === previousContentHash) {
      console.log('Content unchanged, skipping');
      return;
    }
    previousContentHash = contentHash;
    const message: NativeMessage = {
      action: 'sendNativeMarkdown',
      type: NativeMessageType.Content,
      content,
      url: window.location.href,
    };
    chrome.runtime.sendMessage(message);
  };

  // Debounced version to avoid excessive calls
  const debouncedExtractAndLog = debounce(extractAndLog, 2000);

  // Set up a MutationObserver to watch for DOM changes
  const observer = new MutationObserver(() => {
    debouncedExtractAndLog();
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  // Remove the download button logic and related code
}
