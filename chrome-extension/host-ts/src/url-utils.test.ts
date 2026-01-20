import { describe, it, expect } from 'vitest';
import { splitUrl, getCleanDomain, makeFilename } from './url-utils.js';

describe('splitUrl', () => {
  it('parses https URLs', () => {
    const result = splitUrl('https://example.com/path/to/page');
    expect(result.domain).toBe('example.com');
    expect(result.path).toBe('/path/to/page');
    expect(result.query).toBe('');
  });

  it('parses http URLs', () => {
    const result = splitUrl('http://example.com/page');
    expect(result.domain).toBe('example.com');
    expect(result.path).toBe('/page');
  });

  it('handles query strings', () => {
    const result = splitUrl('https://example.com/search?q=test&page=1');
    expect(result.domain).toBe('example.com');
    expect(result.path).toBe('/search');
    expect(result.query).toBe('q=test&page=1');
  });

  it('handles root path', () => {
    const result = splitUrl('https://example.com');
    expect(result.domain).toBe('example.com');
    expect(result.path).toBe('/');
  });

  it('handles trailing slash', () => {
    const result = splitUrl('https://example.com/');
    expect(result.domain).toBe('example.com');
    expect(result.path).toBe('/');
  });

  it('lowercases domain', () => {
    const result = splitUrl('https://EXAMPLE.COM/Path');
    expect(result.domain).toBe('example.com');
    expect(result.path).toBe('/Path');
  });
});

describe('getCleanDomain', () => {
  it('removes www prefix', () => {
    expect(getCleanDomain('www.example.com')).toBe('example');
  });

  it('extracts main domain from subdomain', () => {
    expect(getCleanDomain('blog.example.com')).toBe('example');
  });

  it('handles simple domains', () => {
    expect(getCleanDomain('example.com')).toBe('example');
  });

  it('handles co.uk style TLDs', () => {
    expect(getCleanDomain('example.co.uk')).toBe('co');
  });
});

describe('makeFilename', () => {
  it('creates filename from URL with path', () => {
    expect(makeFilename('https://linkedin.com/in/kimjune01/')).toBe('linkedin.com/in_kimjune01.md');
  });

  it('handles URL without trailing slash', () => {
    expect(makeFilename('https://linkedin.com/in/kimjune01')).toBe('linkedin.com/in_kimjune01.md');
  });

  it('handles root URL', () => {
    expect(makeFilename('https://linkedin.com/')).toBe('linkedin.com/linkedin.com.md');
  });

  it('handles URL without path', () => {
    expect(makeFilename('https://domain.com')).toBe('domain.com/domain.com.md');
  });

  it('removes www prefix', () => {
    expect(makeFilename('http://www.example.com/foo/bar/baz/')).toBe('example.com/foo_bar_baz.md');
  });

  it('handles deep paths', () => {
    expect(makeFilename('https://sub.domain.com/path/to/resource/')).toBe('sub.domain.com/path_to_resource.md');
  });
});
