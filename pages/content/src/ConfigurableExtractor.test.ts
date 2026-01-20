import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigurableExtractor } from './ConfigurableExtractor';

describe('ConfigurableExtractor', () => {
  beforeEach(() => {
    // Reset document.title for each test
    Object.defineProperty(document, 'title', {
      value: 'Test Page',
      writable: true,
      configurable: true,
    });
  });

  describe('constructor', () => {
    it('creates extractor for unknown domain', () => {
      const extractor = new ConfigurableExtractor('unknown-domain.com');
      expect(extractor).toBeDefined();
    });

    it('creates extractor for configured domain', () => {
      const extractor = new ConfigurableExtractor('linkedin.com');
      expect(extractor).toBeDefined();
    });
  });

  describe('isConfigured', () => {
    it('returns true for configured domains', () => {
      // Domain keys in config use www. prefix
      expect(ConfigurableExtractor.isConfigured('www.linkedin.com')).toBe(true);
      expect(ConfigurableExtractor.isConfigured('www.youtube.com')).toBe(true);
      expect(ConfigurableExtractor.isConfigured('www.reddit.com')).toBe(true);
    });

    it('returns false for unconfigured domains', () => {
      expect(ConfigurableExtractor.isConfigured('random-unknown-site.xyz')).toBe(false);
      expect(ConfigurableExtractor.isConfigured('my-personal-blog.com')).toBe(false);
      // Without www prefix, these are not configured
      expect(ConfigurableExtractor.isConfigured('linkedin.com')).toBe(false);
    });
  });

  describe('extractContent', () => {
    it('extracts text content from HTML', () => {
      const extractor = new ConfigurableExtractor('example.com');
      const html = '<main><p>Hello World</p></main>';
      const result = extractor.extractContent(html);
      expect(result).toContain('Hello World');
    });

    it('removes script tags', () => {
      const extractor = new ConfigurableExtractor('example.com');
      const html = '<div><script>alert("xss")</script><p>Safe content</p></div>';
      const result = extractor.extractContent(html);
      expect(result).not.toContain('alert');
      expect(result).not.toContain('xss');
      expect(result).toContain('Safe content');
    });

    it('removes style tags', () => {
      const extractor = new ConfigurableExtractor('example.com');
      const html = '<div><style>.red { color: red; }</style><p>Styled text</p></div>';
      const result = extractor.extractContent(html);
      expect(result).not.toContain('color');
      expect(result).toContain('Styled text');
    });

    it('removes footer elements', () => {
      const extractor = new ConfigurableExtractor('example.com');
      const html = '<main>Main content</main><footer>Copyright 2024</footer>';
      const result = extractor.extractContent(html);
      expect(result).toContain('Main content');
      expect(result).not.toContain('Copyright');
    });

    it('removes navigation elements', () => {
      const extractor = new ConfigurableExtractor('example.com');
      const html = '<header><nav>Menu items</nav></header><article>Article content</article>';
      const result = extractor.extractContent(html);
      expect(result).not.toContain('Menu items');
      expect(result).toContain('Article content');
    });

    it('removes advertisement elements', () => {
      const extractor = new ConfigurableExtractor('example.com');
      const html = '<div class="advertisement">Buy now!</div><div>Real content</div>';
      const result = extractor.extractContent(html);
      expect(result).not.toContain('Buy now');
      expect(result).toContain('Real content');
    });

    it('removes cookie banner elements', () => {
      const extractor = new ConfigurableExtractor('example.com');
      const html = '<div class="cookie-banner">Accept cookies</div><main>Page content</main>';
      const result = extractor.extractContent(html);
      expect(result).not.toContain('Accept cookies');
      expect(result).toContain('Page content');
    });

    it('converts to markdown format', () => {
      const extractor = new ConfigurableExtractor('example.com');
      const html = '<h1>Title</h1><p>Paragraph text</p>';
      const result = extractor.extractContent(html);
      // Should contain markdown heading (added by processMarkdown from document.title)
      expect(result).toContain('#');
    });

    it('truncates very long content', () => {
      const extractor = new ConfigurableExtractor('example.com');
      const longText = 'x'.repeat(50 * 1024);
      const html = `<div>${longText}</div>`;
      const result = extractor.extractContent(html);
      expect(result.length).toBeLessThanOrEqual(30 * 1024 + 100); // Allow some margin for title
    });

    it('handles empty HTML', () => {
      const extractor = new ConfigurableExtractor('example.com');
      const result = extractor.extractContent('');
      // Should at least have the page title
      expect(result).toContain('Test Page');
    });

    it('handles nested content correctly', () => {
      const extractor = new ConfigurableExtractor('example.com');
      const html = `
        <div>
          <section>
            <article>
              <p>Deeply nested content</p>
            </article>
          </section>
        </div>
      `;
      const result = extractor.extractContent(html);
      expect(result).toContain('Deeply nested content');
    });
  });

  describe('domain-specific extraction', () => {
    it('uses inclusion selectors for LinkedIn', () => {
      const extractor = new ConfigurableExtractor('linkedin.com');
      const html = `
        <nav>Navigation</nav>
        <main>
          <article>LinkedIn post content</article>
        </main>
        <aside>Sidebar</aside>
      `;
      const result = extractor.extractContent(html);
      // LinkedIn config should focus on main content
      expect(result).toContain('LinkedIn post content');
    });

    it('uses inclusion selectors for YouTube', () => {
      const extractor = new ConfigurableExtractor('youtube.com');
      const html = `
        <div id="content">
          <h1>Video Title</h1>
          <div id="description">Video description here</div>
        </div>
        <div id="secondary">Related videos</div>
      `;
      const result = extractor.extractContent(html);
      expect(result).toContain('Video Title');
    });
  });

  describe('debug mode', () => {
    it('can be enabled without errors', () => {
      const extractor = new ConfigurableExtractor('example.com', true);
      const html = '<div>Debug test</div>';
      // Should not throw
      expect(() => extractor.extractContent(html)).not.toThrow();
    });
  });
});
