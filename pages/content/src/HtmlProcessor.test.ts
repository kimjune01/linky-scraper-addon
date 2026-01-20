import { describe, it, expect, beforeEach } from 'vitest';
import { HtmlProcessor } from './HtmlProcessor';

describe('HtmlProcessor', () => {
  describe('removeTableTags', () => {
    it('removes table-related tags', () => {
      const html = '<table><tr><td>Cell</td></tr></table>';
      expect(HtmlProcessor.removeTableTags(html)).toBe('Cell');
    });

    it('removes nested table tags', () => {
      const html = '<table><thead><tr><th>Header</th></tr></thead><tbody><tr><td>Data</td></tr></tbody></table>';
      expect(HtmlProcessor.removeTableTags(html)).toBe('HeaderData');
    });

    it('preserves non-table content', () => {
      const html = '<div>Hello</div><p>World</p>';
      expect(HtmlProcessor.removeTableTags(html)).toBe('<div>Hello</div><p>World</p>');
    });
  });

  describe('removeElementsBySelector', () => {
    it('removes elements matching selector', () => {
      const html = '<div class="keep">Keep</div><div class="remove">Remove</div>';
      const result = HtmlProcessor.removeElementsBySelector(html, '.remove');
      expect(result).toContain('Keep');
      expect(result).not.toContain('Remove');
    });

    it('removes multiple matching elements', () => {
      const html = '<nav>Nav1</nav><main>Content</main><nav>Nav2</nav>';
      const result = HtmlProcessor.removeElementsBySelector(html, 'nav');
      expect(result).toContain('Content');
      expect(result).not.toContain('Nav1');
      expect(result).not.toContain('Nav2');
    });

    it('handles nested selectors', () => {
      const html = '<div><span class="ad">Ad</span><span>Text</span></div>';
      const result = HtmlProcessor.removeElementsBySelector(html, '.ad');
      expect(result).toContain('Text');
      expect(result).not.toContain('Ad');
    });
  });

  describe('removeLayoutSidebar', () => {
    it('removes elements with Layout-sidebar class', () => {
      const html = '<div class="Layout-sidebar">Sidebar</div><main>Content</main>';
      const result = HtmlProcessor.removeLayoutSidebar(html);
      expect(result).toContain('Content');
      expect(result).not.toContain('Sidebar');
    });
  });

  describe('truncateToFit', () => {
    it('returns unchanged string if under limit', () => {
      const short = 'Hello world';
      expect(HtmlProcessor.truncateToFit(short)).toBe(short);
    });

    it('truncates string over 30KB with ellipsis', () => {
      const long = 'x'.repeat(35 * 1024);
      const result = HtmlProcessor.truncateToFit(long);
      expect(result.length).toBe(30 * 1024 + 3); // 30KB + "..."
      expect(result.endsWith('...')).toBe(true);
    });

    it('handles exactly 30KB string', () => {
      const exact = 'y'.repeat(30 * 1024);
      expect(HtmlProcessor.truncateToFit(exact)).toBe(exact);
    });
  });

  describe('processMarkdown', () => {
    beforeEach(() => {
      // Mock document.title for tests
      Object.defineProperty(document, 'title', {
        value: '',
        writable: true,
      });
    });

    it('removes markdown links keeping text', () => {
      document.title = '';
      const md = 'Check out [this link](https://example.com) for more';
      const result = HtmlProcessor.processMarkdown(md);
      expect(result).toContain('this link');
      expect(result).not.toContain('https://example.com');
    });

    it('removes excessive newlines', () => {
      document.title = '';
      const md = 'Line 1\n\n\n\nLine 2';
      const result = HtmlProcessor.processMarkdown(md);
      expect(result).not.toContain('\n\n\n');
    });

    it('removes repeated consecutive lines', () => {
      document.title = '';
      const md = 'Hello World\nWorld';
      const result = HtmlProcessor.processMarkdown(md);
      // 'World' should be removed as it's contained in previous line
      expect(result.split('\n').filter(l => l === 'World').length).toBe(0);
    });

    it('removes duplicated text on same line', () => {
      document.title = '';
      // "David Choe David Choe" has odd length with space in middle
      const md = 'David Choe David Choe';
      const result = HtmlProcessor.processMarkdown(md);
      expect(result.trim()).toBe('David Choe');
    });

    it('removes sequentially repeated words', () => {
      document.title = '';
      const md = 'hello hello world';
      const result = HtmlProcessor.processMarkdown(md);
      // The filter removes repeated word but keeps the space between
      expect(result.trim()).toContain('hello');
      expect(result.trim()).toContain('world');
      // Should only have one 'hello' now
      expect(result.match(/hello/g)?.length).toBe(1);
    });

    it('adds page title as heading when present', () => {
      document.title = 'Test Page';
      const md = 'Some content';
      const result = HtmlProcessor.processMarkdown(md);
      expect(result.startsWith('# Test Page')).toBe(true);
    });
  });

  describe('cleanHtmlDom', () => {
    it('replaces images with alt text', () => {
      const html = '<img src="test.jpg" alt="Test Image">';
      const result = HtmlProcessor.cleanHtmlDom(html);
      expect(result).toContain('Test Image');
      expect(result).not.toContain('<img');
    });

    it('replaces anchors with text content', () => {
      const html = '<a href="https://example.com">Click here</a>';
      const result = HtmlProcessor.cleanHtmlDom(html);
      expect(result).toContain('Click here');
      expect(result).not.toContain('<a');
    });

    it('removes script tags', () => {
      const html = '<script>alert("xss")</script><p>Content</p>';
      const result = HtmlProcessor.cleanHtmlDom(html);
      expect(result).not.toContain('script');
      expect(result).not.toContain('alert');
      expect(result).toContain('Content');
    });

    it('removes style tags', () => {
      const html = '<style>.red { color: red; }</style><p>Text</p>';
      const result = HtmlProcessor.cleanHtmlDom(html);
      expect(result).not.toContain('style');
      expect(result).not.toContain('color');
      expect(result).toContain('Text');
    });

    it('removes footer elements', () => {
      const html = '<main>Main content</main><footer>Footer</footer>';
      const result = HtmlProcessor.cleanHtmlDom(html);
      expect(result).toContain('Main content');
      expect(result).not.toContain('Footer');
    });

    it('removes advertisement class elements', () => {
      const html = '<div class="advertisement">Ad</div><div>Content</div>';
      const result = HtmlProcessor.cleanHtmlDom(html);
      expect(result).not.toContain('Ad');
      expect(result).toContain('Content');
    });

    it('removes empty elements', () => {
      const html = '<div></div><p>   </p><span>Real content</span>';
      const result = HtmlProcessor.cleanHtmlDom(html);
      expect(result).toContain('Real content');
    });

    it('unwraps table elements but keeps content', () => {
      const html = '<table><tr><td>Cell 1</td><td>Cell 2</td></tr></table>';
      const result = HtmlProcessor.cleanHtmlDom(html);
      expect(result).toContain('Cell 1');
      expect(result).toContain('Cell 2');
      expect(result).not.toContain('<table');
      expect(result).not.toContain('<td');
    });
  });
});
