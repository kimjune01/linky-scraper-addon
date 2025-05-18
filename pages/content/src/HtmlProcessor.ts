/**
 * Utility class for common HTML processing functions
 */
export class HtmlProcessor {
  static removeTableTags(html: string): string {
    // Remove all table-related tags in one pass
    html = html.replace(/<\/?(table|tr|td|th|tbody|thead|tfoot|caption)[^>]*>/gi, '');

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

    // add the title of the tab to the beginning of the markdown
    const title = document.title;
    if (title) {
      processed = `# ${title}\n\n${processed}`;
    }

    return processed;
  }

  static truncateTo100Kb(markdown: string): string {
    const maxLength = 100 * 1024;
    if (markdown.length > maxLength) {
      return markdown.slice(0, maxLength) + '...';
    }
    return markdown;
  }
  /**
   * Removes all parent elements that have only one child, recursively.
   */

  static cleanHtmlDom(html: string): string {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Remove images (replace with alt text)
    tempDiv.querySelectorAll('img').forEach(img => {
      const altText = img.getAttribute('alt') || '';
      const textNode = document.createTextNode(altText);
      img.parentNode?.replaceChild(textNode, img);
    });

    // Replace anchor tags with their text content
    tempDiv.querySelectorAll('a').forEach(anchor => {
      const textContent = anchor.textContent || '';
      const textNode = document.createTextNode(textContent);
      anchor.parentNode?.replaceChild(textNode, anchor);
    });

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
      tempDiv.querySelectorAll(selector).forEach(element => {
        element.remove();
      });
    });

    // Unwrap all table-related elements but keep their contents
    tempDiv.querySelectorAll('table, tr, td, th, tbody, thead, tfoot, caption').forEach(el => {
      // Move all children before the element
      while (el.firstChild) {
        el.parentNode?.insertBefore(el.firstChild, el);
      }
      // Remove the now-empty element
      el.remove();
    });

    // Remove single-child parents recursively
    function flattenSingleChildParents(element: Element) {
      let child = element.firstElementChild;
      while (element.children.length === 1 && element !== tempDiv) {
        const parent = element.parentElement;
        if (!parent) break;
        parent.replaceChild(child!, element);
        element = child!;
        child = element.firstElementChild;
      }
      Array.from(element.children).forEach(flattenSingleChildParents);
    }
    Array.from(tempDiv.children).forEach(flattenSingleChildParents);

    // Remove empty elements
    tempDiv.querySelectorAll('div, p, span, li, ul, ol, h1, h2, h3, h4, h5, h6, center').forEach(element => {
      if (element.children.length === 0 && (!element.textContent || element.textContent.trim() === '')) {
        element.remove();
      }
    });

    return tempDiv.innerHTML;
  }
}
