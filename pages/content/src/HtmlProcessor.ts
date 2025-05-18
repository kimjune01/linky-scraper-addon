/**
 * Utility class for common HTML processing functions
 */
export class HtmlProcessor {
  /**
   * Removes image tags from HTML content
   */
  static removeImageTags(html: string): string {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const images = tempDiv.querySelectorAll('img');
    images.forEach(img => {
      const altText = img.getAttribute('alt') || '';
      const textNode = document.createTextNode(altText);
      img.parentNode?.replaceChild(textNode, img);
    });
    return tempDiv.innerHTML;
  }

  /**
   * Replaces anchor tags with their text content
   */
  static replaceAnchorTags(html: string): string {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const anchors = tempDiv.querySelectorAll('a');
    anchors.forEach(anchor => {
      const textContent = anchor.textContent || '';
      const textNode = document.createTextNode(textContent);
      anchor.parentNode?.replaceChild(textNode, anchor);
    });

    return tempDiv.innerHTML;
  }

  /**
   * Removes unwanted elements from the HTML
   */
  static removeUnwantedElements(element: HTMLElement): void {
    const unwantedSelectors = [
      'script',
      'style',
      'noscript',
      'iframe',
      'link',
      'header nav',
      'footer',
      '.advertisement',
      '.cookie-banner',
    ];

    unwantedSelectors.forEach(selector => {
      const elements = element.querySelectorAll(selector);
      elements.forEach(el => {
        const newlineNode = document.createTextNode('\t');
        el.parentNode?.replaceChild(newlineNode, el);
      });
    });
  }

  static removeTableTags(html: string): string {
    // flatten html to remove all nested table elements and their closing tags
    html = html.replace(/<table[^>]*>/g, '');
    html = html.replace(/<\/table[^>]*>/g, '');
    html = html.replace(/<tr[^>]*>/g, '');
    html = html.replace(/<\/tr[^>]*>/g, '');
    html = html.replace(/<td[^>]*>/g, '');
    html = html.replace(/<\/td[^>]*>/g, '');
    html = html.replace(/<th[^>]*>/g, '');
    html = html.replace(/<\/th[^>]*>/g, '');
    html = html.replace(/<tbody[^>]*>/g, '');
    html = html.replace(/<\/tbody[^>]*>/g, '');
    html = html.replace(/<thead[^>]*>/g, '');
    html = html.replace(/<\/thead[^>]*>/g, '');
    html = html.replace(/<tfoot[^>]*>/g, '');
    html = html.replace(/<\/tfoot[^>]*>/g, '');
    html = html.replace(/<caption[^>]*>/g, '');
    html = html.replace(/<\/caption[^>]*>/g, '');

    return html;
  }

  /**
   * Removes elements with class "Layout-sidebar" from HTML content
   */
  static removeLayoutSidebar(html: string): string {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const sidebarElements = tempDiv.querySelectorAll('.Layout-sidebar');
    sidebarElements.forEach(element => {
      element.remove();
    });

    return tempDiv.innerHTML;
  }

  /**
   * Removes elements matching the given CSS selector from HTML content
   * @param html The HTML content to process
   * @param selector The CSS selector for elements to remove
   * @returns The processed HTML with matching elements removed
   */
  static removeElementsBySelector(html: string, selector: string): string {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const elements = tempDiv.querySelectorAll(selector);
    elements.forEach(element => {
      element.remove();
    });

    return tempDiv.innerHTML;
  }

  /**
   * Processes markdown to clean up and improve readability
   */
  static processMarkdown(markdown: string): string {
    let processed = markdown
      // Replace markdown links with just the link text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Replace HTML anchor tags with just their text content
      .replace(/<a[^>]*>(.*?)<\/a>/g, '\n$1')
      // Add newline after list items
      .replace(/([-*+])\s/g, '$1\n')
      // Add newline after headings
      .replace(/(#{1,6}\s[^\n]+)/g, '$1\n')
      // Remove excessive newlines
      .replace(/\n{3,}/g, '\n\n')
      // Remove newlines that only contain whitespace
      .replace(/\n\s*\n/g, '\n')
      // Remove empty HTML tags
      .replace(/<([a-z][a-z0-9]*)[^>]*>[\s\n]*<\/\1>/gi, '')
      // Remove custom tags with minimal content
      .replace(/<-[a-z][a-z0-9-]*->[\s\n]*(?:Loading)?[\s\n]*<\/-[a-z][a-z0-9-]*->/gi, '');

    // Remove lines that only contain whitespace and trim leading whitespace
    processed = processed
      .split('\n')
      .map(line => {
        const trimmed = line.trimStart();
        // Remove 'logo' and all preceding characters on that line (case-insensitive)
        if (/logo/i.test(trimmed)) {
          return trimmed.replace(/^.*logo/i, '');
        }
        return trimmed;
      })
      .filter(line => {
        // Replace with newline if line ends with 'logo' (case-insensitive, ignoring trailing whitespace)
        if (/logo\s*$/i.test(line)) return '';
        // Replace with newline if line is only dashes (at least 2 dashes, possibly with spaces)
        if (/^[-\s]{2,}$/.test(line)) return '';
        // Replace with newline if line is a single word: subscribe, join, follow, or '-'
        if (/^(subscribe|join|follow|connections|connect|-)$/i.test(line)) return '';
        // Filter out lines that start with 'like' (case-insensitive, possibly with leading whitespace)
        if (/^like/i.test(line)) return '';
        // Filter out lines that end with the word 'followers' (case-insensitive, possibly with trailing whitespace)
        if (/followers\s*$/i.test(line)) return '';
        // Filter out lines that end with the word 'members' (case-insensitive, possibly with trailing whitespace)
        if (/members\s*$/i.test(line)) return '';
        return line.length > 0 ? line.trimStart() : '';
      })
      .join('\n')
      // Remove a newline that immediately follows a line ending with a dash
      .replace(/-\n\n/g, '-\n')
      // Remove leading whitespaces from every line
      .replace(/^ +/gm, '');

    // Remove repeated consecutive lines if the latter is contained in the former, until no more can be removed
    let lines = processed.split('\n');
    let prevLength;
    do {
      prevLength = lines.length;
      lines = lines.filter((line, idx, arr) => idx === 0 || !arr[idx - 1].includes(line));
    } while (lines.length < prevLength);
    processed = lines.join('\n');

    // For each line, if it's odd length and has a space in the middle, and the front half equals the latter half, remove the latter half and the middle space
    lines = processed.split('\n').map(line => {
      if (line.length % 2 === 1) {
        const mid = Math.floor(line.length / 2);
        if (line[mid] === ' ') {
          const front = line.slice(0, mid);
          const back = line.slice(mid + 1);
          if (front === back) {
            return front;
          }
        }
      }
      return line;
    });
    processed = lines.join('\n');

    // Insert a newline before every line that starts with # (heading), except if it's already at the start or already preceded by a newline
    const headingLines = processed.split('\n');
    const resultLines = [];
    for (let i = 0; i < headingLines.length; i++) {
      const line = headingLines[i];
      if (line.startsWith('#') && (i === 0 || headingLines[i - 1] !== '')) {
        resultLines.push('');
      }
      resultLines.push(line);
    }
    processed = resultLines.join('\n');

    // For each line, remove sequentially repeated words
    processed = processed
      .split('\n')
      .map(line => {
        const words = line.split(/(\s+)/); // keep spaces as tokens
        const filtered = words.filter((word, idx, arr) => {
          // Only compare non-space tokens
          if (/^\s+$/.test(word)) return true;
          // Find previous non-space token
          let prevIdx = idx - 1;
          while (prevIdx >= 0 && /^\s+$/.test(arr[prevIdx])) prevIdx--;
          return prevIdx < 0 || word !== arr[prevIdx];
        });
        return filtered.join('');
      })
      .join('\n');

    return processed;
  }

  /**
   * Removes all parent elements that have only one child, recursively.
   */
  static removeSingleChildParents(html: string): string {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    function flattenSingleChildParents(element: Element) {
      // Use a while loop to handle cases where flattening creates new single-child parents
      let child = element.firstElementChild;
      while (element.children.length === 1 && element !== tempDiv) {
        // Replace this element with its only child
        const parent = element.parentElement;
        if (!parent) break;
        parent.replaceChild(child!, element);
        element = child!;
        child = element.firstElementChild;
      }
      // Recursively process children
      Array.from(element.children).forEach(flattenSingleChildParents);
    }

    Array.from(tempDiv.children).forEach(flattenSingleChildParents);

    return tempDiv.innerHTML;
  }

  static removeEmptyElements(html: string): string {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Select all elements you want to check for emptiness
    const elements = tempDiv.querySelectorAll('div, p, span, li, ul, ol, h1, h2, h3, h4, h5, h6, center');
    elements.forEach(element => {
      // Check if the element is empty (no children and no text content)
      if (element.children.length === 0 && (!element.textContent || element.textContent.trim() === '')) {
        element.remove();
      }
    });

    return tempDiv.innerHTML;
  }
}
