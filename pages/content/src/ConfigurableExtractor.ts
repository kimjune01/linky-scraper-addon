import { convertHtmlToMarkdown } from 'dom-to-semantic-markdown';
import { HtmlProcessor } from './HtmlProcessor';
import domainExclusions from './domain-exclusions.json';

/**
 * Content extractor that can be configured with domain-specific exclusions and inclusions
 */

type DomainExclusionConfig = {
  exclusionSelectors?: string[];
  inclusionSelectors?: string[];
};

export class ConfigurableExtractor {
  private exclusionSelectors: string[];
  private inclusionSelectors: string[] | null;
  private domain: string;
  private debugMode: boolean;
  private exclusionTextLiterals: string[] = ['download', 'search'];

  /**
   * Creates a new ConfigurableContentExtractor
   * @param domain The domain to extract content from
   * @param debugMode Whether to enable debug mode
   */
  constructor(domain: string, debugMode = false) {
    this.domain = domain;
    this.debugMode = debugMode;
    // Load selectors from config if available
    const config = (domainExclusions as Record<string, DomainExclusionConfig>)[domain] || {};
    this.exclusionSelectors = config.exclusionSelectors || [
      // Default exclusions that are generally unwanted
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
    this.inclusionSelectors = config.inclusionSelectors || null;
  }

  /**
   * Debug function to highlight elements that will be excluded
   * @param element The root element to start highlighting from
   */
  private debugHighlightExcludedElements(element: HTMLElement): void {
    console.log('debugHighlightExcludedElements', this.exclusionSelectors);
    this.exclusionSelectors.forEach(selector => {
      const elements = element.querySelectorAll(selector);
      elements.forEach(el => {
        // Add a red border and semi-transparent red background
        (el as HTMLElement).style.border = '2px solid red';
        (el as HTMLElement).style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
        // Add a tooltip with the selector that matched
        (el as HTMLElement).title = `Will be excluded by selector: ${selector}`;
      });
    });
    // Log the total number of elements that will be excluded
    const totalExcluded = element.querySelectorAll(this.exclusionSelectors.join(',')).length;
    console.log(`[ConfigurableContentExtractor] Will exclude ${totalExcluded} elements for domain: ${this.domain}`);
    console.log('[ConfigurableContentExtractor] Exclusion selectors:', this.exclusionSelectors);
  }

  /**
   * Debug function to highlight elements that will be included
   * @param element The root element to start highlighting from
   */
  private debugHighlightIncludedElements(element: HTMLElement): void {
    if (!this.debugMode || !this.inclusionSelectors || this.inclusionSelectors.length === 0) return;
    this.inclusionSelectors.forEach(selector => {
      const elements = element.querySelectorAll(selector);
      elements.forEach(el => {
        // Add a green border and semi-transparent green background
        (el as HTMLElement).style.border = '2px solid green';
        (el as HTMLElement).style.backgroundColor = 'rgba(0, 255, 0, 0.1)';
        // Add a tooltip with the selector that matched
        (el as HTMLElement).title = `Will be included by selector: ${selector}`;
      });
    });
    // Log the total number of elements that will be included
    const totalIncluded = element.querySelectorAll(this.inclusionSelectors.join(',')).length;
    console.log(`[ConfigurableContentExtractor] Will include ${totalIncluded} elements for domain: ${this.domain}`);
    console.log('[ConfigurableContentExtractor] Inclusion selectors:', this.inclusionSelectors);
  }

  extractContent(): string {
    // this.debugHighlightExcludedElements(document.body);
    const tempDiv = document.createElement('div');
    const elements = getAboveTheFoldTopLevelElements();
    const htmlSnippets = elements.map(el => el.outerHTML);
    tempDiv.innerHTML = htmlSnippets.join('\n');

    const elementsToProcessSet = new Set<HTMLElement>();
    if (this.inclusionSelectors && this.inclusionSelectors.length > 0) {
      const combinedSelector = this.inclusionSelectors.join(',');
      tempDiv.querySelectorAll(combinedSelector).forEach(el => {
        elementsToProcessSet.add(el as HTMLElement);
      });
    } else {
      elementsToProcessSet.add(tempDiv);
    }

    const elementsToProcess = Array.from(elementsToProcessSet);

    // For each included element, remove excluded elements inside it
    elementsToProcess.forEach(element => {
      if (this.exclusionSelectors.length > 0) {
        const combinedSelector = this.exclusionSelectors.join(',');
        element.querySelectorAll(combinedSelector).forEach(el => el.remove());
      }
    });

    // Gather the HTML from all included elements
    let extractedContent = elementsToProcess.map(el => el.innerHTML).join('\n');
    extractedContent = HtmlProcessor.removeImageTags(extractedContent);
    extractedContent = HtmlProcessor.replaceAnchorTags(extractedContent);

    // Convert to markdown
    const markdown = convertHtmlToMarkdown(extractedContent);

    // Process the markdown for better readability
    return HtmlProcessor.processMarkdown(markdown);
  }

  /**
   * Extracts content from HTML while including and excluding specified selectors
   * @param html The HTML content to extract from
   * @returns Extracted content as a string
   */
  extractProfileContent(html: string): string {
    // Create a temporary DOM element to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const elementsToProcessSet = new Set<HTMLElement>();
    if (this.inclusionSelectors && this.inclusionSelectors.length > 0) {
      const combinedSelector = this.inclusionSelectors.join(',');
      tempDiv.querySelectorAll(combinedSelector).forEach(el => {
        elementsToProcessSet.add(el as HTMLElement);
      });
    } else {
      elementsToProcessSet.add(tempDiv);
    }

    let elementsToProcess = Array.from(elementsToProcessSet);

    // For each included element, remove excluded elements inside it
    elementsToProcess.forEach(element => {
      this.debugHighlightExcludedElements(element);
      this.debugHighlightIncludedElements(element);
      if (this.exclusionSelectors.length > 0) {
        const combinedSelector = this.exclusionSelectors.join(',');
        element.querySelectorAll(combinedSelector).forEach(el => el.remove());
      }
    });

    // Gather the HTML from all included elements
    let extractedContent = elementsToProcess.map(el => el.innerHTML).join('\n');
    extractedContent = HtmlProcessor.removeImageTags(extractedContent);
    extractedContent = HtmlProcessor.replaceAnchorTags(extractedContent);

    // Convert to markdown
    const markdown = convertHtmlToMarkdown(extractedContent);

    // Process the markdown for better readability
    return HtmlProcessor.processMarkdown(markdown);
  }

  extractSearchContent(html: string): string[] {
    // Create a temporary DOM element to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const elementsToProcessSet = new Set<HTMLElement>();
    if (this.inclusionSelectors && this.inclusionSelectors.length > 0) {
      const combinedSelector = this.inclusionSelectors.join(',');
      tempDiv.querySelectorAll(combinedSelector).forEach(el => {
        elementsToProcessSet.add(el as HTMLElement);
      });
    } else {
      elementsToProcessSet.add(tempDiv);
    }

    const elementsToProcess = Array.from(elementsToProcessSet);

    // For each included element, remove excluded elements inside it
    elementsToProcess.forEach(element => {
      this.debugHighlightExcludedElements(element);
      this.debugHighlightIncludedElements(element);
      if (this.exclusionSelectors.length > 0) {
        const combinedSelector = this.exclusionSelectors.join(',');
        element.querySelectorAll(combinedSelector).forEach(el => el.remove());
      }
    });

    // Extract anchor tags that contain /in/ and return the list of extracted handles
    const anchorHandles = new Set<string>();
    const anchors = tempDiv.querySelectorAll('a[href*="/in/"]');
    anchors.forEach(anchor => {
      const href = anchor.getAttribute('href');
      if (href && href.includes('miniProfileUrn')) {
        const match = href.match(/\/in\/([^/?#]+)/i);
        if (match && match[1] && !/^ACoA/i.test(match[1])) {
          anchorHandles.add(match[1]);
        }
      }
    });
    return Array.from(anchorHandles);
  }

  static isConfigured(host: string): boolean {
    return host in domainExclusions;
  }
}

function getAboveTheFoldTopLevelElements() {
  const fold = window.innerHeight;
  const elements: HTMLElement[] = [];

  function traverse(node: HTMLElement) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const rect = node.getBoundingClientRect();
      if (rect.top < fold && rect.bottom > 0) {
        // Only add if parent is not already in the list
        if (!elements.some(parent => parent.contains(node))) {
          elements.push(node);
        }
        // Do NOT traverse children if this node is already included
        return;
      }
      // Otherwise, keep traversing children
      for (const child of Array.from(node.children)) {
        traverse(child as HTMLElement);
      }
    }
  }

  traverse(document.body);
  return elements;
}

function filterOutBelowTheFoldElements(root: HTMLElement = document.body) {
  const fold = window.innerHeight;

  function traverse(node: HTMLElement) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const rect = node.getBoundingClientRect();
      // If the element is completely below the fold, remove it
      if (rect.top >= fold) {
        node.remove();
        return;
      }
      // Otherwise, traverse children
      for (const child of Array.from(node.children)) {
        traverse(child as HTMLElement);
      }
    }
  }

  traverse(root);
}
