import { ConfigurableExtractor } from './ConfigurableExtractor';
import type { NativeMessage } from './NativeMessage';
import { NativeMessageType } from './NativeMessage';
import { Deduplicator } from './deduplicator';
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
  const deduplicator = new Deduplicator();

  // Extraction logic
  const extractAndLog = () => {
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) return;
    const content = extractor.extractContent(document.body.innerHTML);
    if (!deduplicator.isContentChanged(content)) {
      console.log('Content unchanged, skipping');
      return;
    }
    deduplicator.updateWithContent(content);

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
