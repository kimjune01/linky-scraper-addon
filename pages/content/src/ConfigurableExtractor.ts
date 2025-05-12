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
    if (!this.debugMode) return;
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

  /**
   * Debug function to log the presence of specific tags in the HTML string
   */
  private debugLogTagPresence(html: string, context: string): void {
    if (!this.debugMode) return;
    const tagsToCheck = ['img', 'a'];
    tagsToCheck.forEach(tag => {
      const regex = new RegExp(`<${tag}(\s|>)`, 'gi');
      const count = (html.match(regex) || []).length;
      if (count > 0) {
        console.log(`[DEBUG][${context}] Found <${tag}> tags:`, count);
      } else {
        console.log(`[DEBUG][${context}] No <${tag}> tags found.`);
      }
    });
  }

  /**
   * Extracts content from HTML while including and excluding specified selectors
   * @param html The HTML content to extract from
   * @returns Extracted content as a string
   */
  extractContent(html: string): string {
    // Create a temporary DOM element to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    let elementsToProcess: HTMLElement[] = [];
    if (this.inclusionSelectors && this.inclusionSelectors.length > 0) {
      // Only process elements matching inclusion selectors
      this.inclusionSelectors.forEach(selector => {
        tempDiv.querySelectorAll(selector).forEach(el => {
          elementsToProcess.push(el as HTMLElement);
        });
      });
    } else {
      // No inclusion selectors: process the whole document
      elementsToProcess = [tempDiv];
    }

    // For each included element, remove excluded elements inside it
    elementsToProcess.forEach(element => {
      this.debugHighlightExcludedElements(element);
      this.debugHighlightIncludedElements(element);
      this.exclusionSelectors.forEach(selector => {
        const elements = element.querySelectorAll(selector);
        elements.forEach(el => {
          el.remove();
        });
      });
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

  static isConfigured(host: string): boolean {
    return host in domainExclusions;
  }
}
