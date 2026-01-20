/**
 * Determines semantic collection names based on URLs
 * Used to categorize scraped content into logical groups
 */

/**
 * Splits a URL into its components
 */
function splitUrl(url: string): { domain: string; path: string; query: string } {
  try {
    const parsed = new URL(url);
    return {
      domain: parsed.hostname,
      path: parsed.pathname,
      query: parsed.search,
    };
  } catch {
    return { domain: '', path: '', query: '' };
  }
}

/**
 * Gets the main domain without subdomains (except for special cases)
 */
function getCleanDomain(domain: string): string {
  const parts = domain.split('.');
  if (parts.length <= 2) return parts[0];

  // Keep first part of domain (without www)
  const filtered = parts.filter(p => p !== 'www');
  return filtered.length > 2 ? filtered[filtered.length - 2] : filtered[0];
}

/**
 * Identifies service name from domain for documentation URLs
 */
function identifyServiceFromDomain(domain: string): string {
  const serviceMappings: Record<string, string> = {
    'react.dev': 'react',
    'reactjs.org': 'react',
    'nodejs.org': 'nodejs',
    'vuejs.org': 'vuejs',
    'angular.io': 'angular',
    'nextjs.org': 'nextjs',
    'svelte.dev': 'svelte',
    'typescriptlang.org': 'typescript',
    'python.org': 'python',
    'rust-lang.org': 'rust',
    'golang.org': 'go',
    'developer.mozilla.org': 'mdn',
  };

  for (const [key, value] of Object.entries(serviceMappings)) {
    if (domain.includes(key)) return value;
  }

  return getCleanDomain(domain);
}

/**
 * Determines a semantic collection name based on a URL
 */
export function determineCollectionName(url: string): string {
  try {
    const { domain, path, query } = splitUrl(url);

    // Special case: IP addresses
    if (/^\d+\.\d+\.\d+\.\d+$/.test(domain)) {
      return 'ip_address_sites';
    }

    // LinkedIn patterns
    if (domain.includes('linkedin.com')) {
      if (path.includes('/in/') || /^\/in\/[\w-]+\/?$/.test(path)) {
        return 'linkedin_profiles';
      }
      if (path.includes('/company/')) return 'linkedin_companies';
      if (path.includes('/jobs/')) return 'linkedin_jobs';
      if (path.includes('/learning/')) return 'linkedin_learning';
      return 'linkedin_other';
    }

    // Gist (check before GitHub since gist.github.com contains github.com)
    if (domain.includes('gist.github.com')) {
      return 'github_gists';
    }

    // GitHub patterns
    if (domain.includes('github.com')) {
      if (/^\/[^/]+\/[^/]+\/pull\//.test(path)) return 'github_pull_requests';
      if (/^\/[^/]+\/[^/]+\/issues\//.test(path)) return 'github_issues';
      if (/^\/[^/]+\/[^/]+\/?$/.test(path)) return 'github_repositories';
      if (/^\/[^/]+\/?$/.test(path)) return 'github_profiles';
      return 'github_other';
    }

    // GitLab patterns
    if (domain.includes('gitlab.com')) {
      if (path.includes('/issues/')) return 'gitlab_issues';
      if (path.includes('/merge_requests/')) return 'gitlab_merge_requests';
      if (/^\/[^/]+\/[^/]+\/?$/.test(path)) return 'gitlab_repositories';
      if (/^\/[^/]+\/?$/.test(path)) return 'gitlab_profiles';
      return 'gitlab_other';
    }

    // Stack Overflow and Stack Exchange
    if (domain.includes('stackoverflow.com')) {
      if (path.includes('/questions/')) return 'stackoverflow_questions';
      if (path.includes('/users/')) return 'stackoverflow_users';
      return 'stackoverflow_other';
    }
    if (domain.includes('stackexchange.com')) {
      return 'stackexchange_questions';
    }

    // npm
    if (domain.includes('npmjs.com')) {
      if (path.includes('/package/')) return 'npm_packages';
      return 'npm_other';
    }

    // PyPI
    if (domain.includes('pypi.org')) {
      if (path.includes('/project/')) return 'pypi_packages';
      return 'pypi_other';
    }

    // YouTube patterns
    if (domain.includes('youtube.com') || domain === 'youtu.be') {
      if (path.includes('/watch') || domain === 'youtu.be') return 'youtube_videos';
      if (path.includes('/playlist')) return 'youtube_playlists';
      if (path.includes('/channel/') || path.includes('/c/') || path.includes('/user/')) {
        return 'youtube_channels';
      }
      return 'youtube_other';
    }

    // Documentation sites
    const docPatterns = ['/docs/', '/documentation/', '/manual/', '/guide/', '/api/'];
    if (docPatterns.some(pattern => path.includes(pattern))) {
      const serviceName = identifyServiceFromDomain(domain);
      return `${serviceName}_documentation`;
    }

    // Twitter/X
    if (domain.includes('twitter.com') || domain.includes('x.com')) {
      if (/^\/[^/]+\/status\//.test(path)) return 'twitter_posts';
      if (/^\/[^/]+\/?$/.test(path)) return 'twitter_profiles';
      return 'twitter_other';
    }

    // Reddit
    if (domain.includes('reddit.com')) {
      if (path.includes('/r/')) {
        const subredditMatch = path.match(/\/r\/([^/]+)/);
        if (subredditMatch) {
          return `reddit_${subredditMatch[1]}`;
        }
      }
      return 'reddit_posts';
    }

    // Medium
    if (domain.includes('medium.com')) {
      return 'medium_articles';
    }

    // News sites
    const newsSites = ['nytimes', 'washingtonpost', 'bbc', 'cnn', 'reuters'];
    if (domain.endsWith('news') || newsSites.some(news => domain.includes(news))) {
      return 'news_articles';
    }

    // Academic and research
    const academicSites = ['scholar.google.', 'arxiv.org', 'researchgate', 'academia.edu', 'jstor.org'];
    if (academicSites.some(site => domain.includes(site))) {
      return 'academic_papers';
    }

    // Google services
    if (domain.includes('drive.google.com')) return 'google_drive_files';
    if (domain.includes('docs.google.com')) {
      if (path.includes('/document/')) return 'google_docs';
      if (path.includes('/spreadsheets/')) return 'google_sheets';
      if (path.includes('/presentation/')) return 'google_slides';
      return 'google_docs_other';
    }

    // E-commerce
    const ecommerceShops = ['amazon.', 'ebay.', 'walmart.', 'etsy.'];
    if (ecommerceShops.some(shop => domain.includes(shop))) {
      const productPatterns = ['/product/', '/dp/', '/itm/', '/ip/'];
      if (productPatterns.some(p => path.includes(p))) return 'ecommerce_products';
      if (path.includes('/s/') || path.includes('/sch/') || query.includes('search=') || query.includes('q=')) {
        return 'ecommerce_search_results';
      }
      return 'ecommerce_other';
    }

    // Music streaming
    if (domain.includes('spotify.com')) {
      if (path.includes('/track/')) return 'spotify_tracks';
      if (path.includes('/album/')) return 'spotify_albums';
      if (path.includes('/playlist/')) return 'spotify_playlists';
      return 'spotify_other';
    }

    // File type patterns
    if (/\.(pdf|docx?|xlsx?|pptx?|txt)$/i.test(path)) return 'document_files';
    if (/\.(jpe?g|png|gif|bmp|webp|svg)$/i.test(path)) return 'image_files';
    if (/\.(mp4|webm|mov|avi|wmv)$/i.test(path)) return 'video_files';
    if (/\.(mp3|wav|aac|flac|ogg)$/i.test(path)) return 'audio_files';
    if (/\.(py|js|ts|java|cpp|c|rb|go|rs|php|sh)$/i.test(path)) return 'code_files';

    // Blog patterns
    if (domain.includes('blog.') || path.includes('/blog/')) {
      const mainDomain = getCleanDomain(domain);
      return `${mainDomain}_blog_posts`;
    }

    // Default: use domain as prefix
    const mainDomain = getCleanDomain(domain);
    const domainParts = domain.split('.');
    if (domainParts.length > 2 && domainParts[0] !== 'www') {
      const subdomain = domainParts[0];
      return `${mainDomain}_${subdomain}_pages`;
    }
    return `${mainDomain}_pages`;
  } catch (error) {
    console.error('Error parsing URL:', error);
    return 'uncategorized';
  }
}
