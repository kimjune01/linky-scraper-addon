import { ConfigurableExtractor } from './ConfigurableExtractor';

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
  if (domain !== 'www.linkedin.com') {
    return;
  }
  const extractor = new ConfigurableExtractor(domain, true);

  // Extraction logic
  let latestMarkdown = '';
  const extractAndLog = () => {
    const markdown = extractor.extractContent(document.body.innerHTML);
    latestMarkdown = markdown;
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

  // Add a button to trigger download
  function addDownloadButton() {
    if (document.getElementById('extractor-download-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'extractor-download-btn';
    btn.textContent = 'Download Extracted Markdown';
    btn.style.position = 'fixed';
    btn.style.bottom = '20px';
    btn.style.right = '20px';
    btn.style.zIndex = '99999';
    btn.style.padding = '8px 16px';
    btn.style.background = '#2563eb';
    btn.style.color = 'white';
    btn.style.border = 'none';
    btn.style.borderRadius = '4px';
    btn.style.cursor = 'pointer';
    btn.onclick = () => {
      const blob = new Blob([latestMarkdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'extracted-content.md';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
    };
    document.body.appendChild(btn);
  }

  addDownloadButton();

  // Optional: return a cleanup function if used in a context that needs it
  // return () => observer.disconnect();
}
