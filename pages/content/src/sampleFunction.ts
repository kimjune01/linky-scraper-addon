import { ConfigurableExtractor } from './ConfigurableExtractor';

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
  console.log('sampleFunction');
  const domain = window.location.hostname;
  if (domain !== 'www.linkedin.com') {
    return;
  }
  const extractor = new ConfigurableExtractor(domain);

  // Extraction logic
  const extractAndLog = () => {
    console.log('Extracting content');
    const profile = extractLinkedInUsername(window.location.href);
    if (profile) {
      const markdown = extractor.extractProfileContent(document.body.innerHTML);
      // Send a message to the background script to handle native messaging
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
          action: 'sendNativeMarkdown',
          type: 'profile',
          content: markdown,
          profile: profile,
          filename: (profile ? profile : 'profile') + '.md',
        });
      }
    }
    const isSearchPage = window.location.pathname.includes('/search/results/');
    if (isSearchPage) {
      const handles = extractor.extractSearchContent(document.body.innerHTML);
      // Extract 'keywords' param from URL
      const urlParams = new URLSearchParams(window.location.search);
      const keywords = urlParams.get('keywords');
      const page = urlParams.get('page') || 1;
      const filename = keywords ? encodeURIComponent(keywords) + '_page' + page + '.txt' : 'search.txt';
      // Send a message to the background script to handle native messaging
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
          action: 'sendNativeMarkdown',
          type: 'search',
          content: handles,
          filename: filename,
        });
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
