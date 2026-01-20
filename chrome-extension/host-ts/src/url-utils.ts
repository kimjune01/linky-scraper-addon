/**
 * URL parsing and utility functions
 */

export interface ParsedUrl {
  domain: string;
  path: string;
  query: string;
}

/**
 * Splits a URL into domain, path, and query components
 */
export function splitUrl(url: string): ParsedUrl {
  // Remove protocol
  let cleanUrl = url;
  if (cleanUrl.startsWith('http://')) {
    cleanUrl = cleanUrl.slice(7);
  } else if (cleanUrl.startsWith('https://')) {
    cleanUrl = cleanUrl.slice(8);
  }

  // Split off query string
  let query = '';
  const queryIndex = cleanUrl.indexOf('?');
  if (queryIndex !== -1) {
    query = cleanUrl.slice(queryIndex + 1);
    cleanUrl = cleanUrl.slice(0, queryIndex);
  }

  // Split into domain and path
  const slashIndex = cleanUrl.indexOf('/');
  let domain: string;
  let path: string;

  if (slashIndex === -1) {
    domain = cleanUrl.toLowerCase();
    path = '/';
  } else {
    domain = cleanUrl.slice(0, slashIndex).toLowerCase();
    path = '/' + cleanUrl.slice(slashIndex + 1);
  }

  return { domain, path, query };
}

/**
 * Gets the clean main domain name (second-to-last part before TLD)
 */
export function getCleanDomain(domain: string): string {
  // Remove www prefix
  let cleanDomain = domain.replace(/^www\./, '');

  // Split and get main domain part
  const parts = cleanDomain.split('.');
  if (parts.length >= 2) {
    return parts[parts.length - 2];
  }
  return cleanDomain;
}

/**
 * Identifies service name from domain for documentation URLs
 */
export function identifyServiceFromDomain(domain: string): string {
  const parts = domain.split('.');
  if (parts.length >= 2) {
    // Remove TLD, www, and docs subdomains
    let service = parts[parts.length - 2];
    if (parts[0] === 'www' || parts[0] === 'docs') {
      service = parts.length >= 3 ? parts[parts.length - 2] : service;
    }
    return service;
  }
  return 'general';
}

/**
 * Generates a filename from a URL for file-based storage
 */
export function makeFilename(url: string): string {
  const { domain, path } = splitUrl(url);

  // Remove www prefix
  const cleanDomain = domain.replace(/^www\./, '');

  // Handle empty or root path
  let cleanPath = path;
  if (!cleanPath || cleanPath === '/') {
    return `${cleanDomain}/${cleanDomain}.md`;
  }

  // Remove trailing slash
  if (cleanPath.endsWith('/')) {
    cleanPath = cleanPath.slice(0, -1);
  }

  // Remove leading slash and replace remaining slashes with underscores
  cleanPath = cleanPath.slice(1).replace(/\//g, '_');

  return `${cleanDomain}/${cleanPath}.md`;
}
