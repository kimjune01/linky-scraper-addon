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
    const processed = markdown
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
    return (
      processed
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
        // Double every newline
        .replace(/\n/g, '\n\n')
        // Remove leading whitespaces from every line
        .replace(/^ +/gm, '')
        // Remove a newline that immediately follows a line ending with a dash (again, in case doubling reintroduced it)
        .replace(/-\s*\n{2,}/g, '-\n')
        // Join lines where a line ends with a dash and the next line is non-empty
        .replace(/-\s*\n+(\S)/g, '-$1')
    );
  }
}
