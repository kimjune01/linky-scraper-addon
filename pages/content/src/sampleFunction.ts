import { ConfigurableExtractor } from './ConfigurableExtractor';
import type { NativeMessage } from './NativeMessage';
import { NativeMessageType } from './NativeMessage';

// Debounce utility (can be reused elsewhere)
function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function (this: unknown, ...args: unknown[]) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), delay);
  } as T;
}

function extractLinkedInUsername(url: string): string | null {
  const match = url.match(/linkedin\.com\/in\/([^/]+)/);
  return match ? match[1] : null;
}

export function sampleFunction() {
  const domain = window.location.hostname;
  const extractor = new ConfigurableExtractor(domain);

  // Extraction logic
  const extractAndLog = () => {
    const profile = extractLinkedInUsername(window.location.href);
    const isSearchPage = window.location.pathname.includes('/search/results/');
    if (profile) {
      const markdown = extractor.extractProfileContent(document.body.innerHTML);
      // Send a message to the background script to handle native messaging
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        const message: NativeMessage = {
          action: 'sendNativeMarkdown',
          type: NativeMessageType.Profile,
          content: markdown,
          filename: profile + '.md',
        };
        chrome.runtime.sendMessage(message);
      }
    } else if (isSearchPage) {
      const handles = extractor.extractSearchContent(document.body.innerHTML);
      // Extract 'keywords' param from URL
      const urlParams = new URLSearchParams(window.location.search);
      const keywords = urlParams.get('keywords');
      const page = urlParams.get('page') || 1;
      const filename = keywords ? encodeURIComponent(keywords) + '_page' + page + '.txt' : 'search.txt';
      // Send a message to the background script to handle native messaging
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        const message: NativeMessage = {
          action: 'sendNativeMarkdown',
          type: NativeMessageType.Search,
          content: handles.join('\n'),
          filename: filename,
        };
        chrome.runtime.sendMessage(message);
      }
    } else {
      const content = extractor.extractContent(document.body.innerHTML);
      const url = new URL(window.location.href);
      // Remove leading 'www.' from the domain if present
      const domain = url.hostname.replace(/^www\./, '');
      let filename = domain + url.pathname;
      if (url.search) filename += url.search;
      // Remove leading slash for filename
      filename = filename.replace(/^\//, '');
      // Replace slashes with underscores
      filename = filename.replace(/\//g, '_');
      // Optionally, remove any trailing underscore
      filename = filename.replace(/_+$/, '');
      // Add .txt extension
      filename += '.txt';
      // Send a message to the background script to handle native messaging
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        const message: OutgoingMessage = {
          action: 'sendNativeMarkdown',
          type: OutgoingMessageType.Content,
          content: content,
          filename: filename,
        };
        chrome.runtime.sendMessage(message);
      }
    }
  };

  // Debounced version to avoid excessive calls
  const debouncedExtractAndLog = debounce(extractAndLog, 1000);

  // Initial extraction
  extractAndLog();

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
