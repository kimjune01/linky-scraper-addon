/**
 * Determines semantic collection names based on URLs
 * Ported from Python determine_collection_name.py
 */

import { splitUrl, getCleanDomain, identifyServiceFromDomain } from './url-utils.js';

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

    // Bitbucket patterns
    if (domain.includes('bitbucket.org')) {
      if (path.includes('/pull-requests/')) return 'bitbucket_pull_requests';
      if (path.includes('/issues/')) return 'bitbucket_issues';
      if (/^\/[^/]+\/[^/]+\/?$/.test(path)) return 'bitbucket_repositories';
      if (/^\/[^/]+\/?$/.test(path)) return 'bitbucket_profiles';
      return 'bitbucket_other';
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

    // Docker Hub
    if (domain.includes('hub.docker.com')) {
      if (path.includes('/r/')) return 'docker_images';
      return 'docker_other';
    }

    // Jupyter Notebooks
    if (domain.includes('nbviewer.jupyter.org')) {
      return 'jupyter_notebooks';
    }

    // CodePen
    if (domain.includes('codepen.io')) {
      if (path.includes('/pen/')) return 'codepen_pens';
      if (/^\/[^/]+\/?$/.test(path)) return 'codepen_profiles';
      return 'codepen_other';
    }

    // Glitch
    if (domain.includes('glitch.com')) {
      if (path.includes('/edit/')) return 'glitch_projects';
      return 'glitch_other';
    }

    // Replit
    if (domain.includes('replit.com')) {
      if (path.includes('/@')) return 'replit_profiles';
      return 'replit_other';
    }

    // JSFiddle
    if (domain.includes('jsfiddle.net')) {
      return 'jsfiddle_fiddles';
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

    // Facebook
    if (domain.includes('facebook.com')) {
      if (path.includes('/events/')) return 'facebook_events';
      if (path.includes('/groups/')) return 'facebook_groups';
      if (/^\/[^/]+\/?$/.test(path)) return 'facebook_profiles';
      return 'facebook_other';
    }

    // Instagram
    if (domain.includes('instagram.com')) {
      if (/^\/p\//.test(path)) return 'instagram_posts';
      if (/^\/[^/]+\/?$/.test(path)) return 'instagram_profiles';
      return 'instagram_other';
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

    // Quora
    if (domain.includes('quora.com')) {
      return 'quora_questions';
    }

    // Video streaming
    const streamingSites = ['netflix.com', 'hulu.com', 'disneyplus.com', 'hbomax.com'];
    if (streamingSites.some(site => domain.includes(site))) {
      return 'streaming_content';
    }

    // File type patterns
    if (/\.(pdf|docx?|xlsx?|pptx?|txt)$/i.test(path)) return 'document_files';
    if (/\.(jpe?g|png|gif|bmp|webp|svg)$/i.test(path)) return 'image_files';
    if (/\.(mp4|webm|mov|avi|wmv)$/i.test(path)) return 'video_files';
    if (/\.(mp3|wav|aac|flac|ogg)$/i.test(path)) return 'audio_files';
    if (/\.(zip|rar|tar|gz|7z)$/i.test(path)) return 'archive_files';
    if (/\.(py|js|ts|java|cpp|c|rb|go|rs|php|sh)$/i.test(path)) return 'code_files';

    // Blog patterns
    if (domain.includes('blog.') || path.includes('/blog/')) {
      const mainDomain = getCleanDomain(domain);
      return `${mainDomain}_blog_posts`;
    }

    // Google services
    if (domain.includes('drive.google.com')) return 'google_drive_files';
    if (domain.includes('docs.google.com')) {
      if (path.includes('/document/')) return 'google_docs';
      if (path.includes('/spreadsheets/')) return 'google_sheets';
      if (path.includes('/presentation/')) return 'google_slides';
      return 'google_docs_other';
    }
    if (domain.includes('calendar.google.com')) return 'google_calendar';
    if (domain.includes('maps.google.com')) return 'google_maps';

    // Microsoft services
    if (domain.includes('onedrive.live.com') || domain.includes('1drv.ms')) return 'onedrive_files';
    if (domain.includes('office.com')) return 'microsoft_office';
    if (domain.includes('teams.microsoft.com')) return 'microsoft_teams';

    // Cloud storage
    if (domain.includes('dropbox.com')) return 'dropbox_files';
    if (domain.includes('box.com')) return 'box_files';

    // Learning platforms
    if (domain.includes('coursera.org')) return 'coursera_courses';
    if (domain.includes('udemy.com')) return 'udemy_courses';
    if (domain.includes('edx.org')) return 'edx_courses';
    if (domain.includes('khanacademy.org')) return 'khanacademy_courses';

    // Shopping
    if (domain.includes('aliexpress.com')) return 'aliexpress_products';
    if (domain.includes('shopify.com')) return 'shopify_stores';

    // Music streaming
    if (domain.includes('spotify.com')) {
      if (path.includes('/track/')) return 'spotify_tracks';
      if (path.includes('/album/')) return 'spotify_albums';
      if (path.includes('/playlist/')) return 'spotify_playlists';
      return 'spotify_other';
    }
    if (domain.includes('soundcloud.com')) return 'soundcloud_tracks';
    if (domain.includes('music.apple.com')) return 'apple_music';

    // Messaging/social
    if (domain.includes('slack.com')) return 'slack_workspaces';
    if (domain.includes('discord.com') || domain.includes('discord.gg')) return 'discord_servers';
    if (domain.includes('telegram.me') || domain.includes('t.me')) return 'telegram_channels';
    if (domain.includes('whatsapp.com')) return 'whatsapp_chats';

    // Finance
    const financeSites = ['chase.com', 'bankofamerica.com', 'wellsfargo.com', 'coinbase.com', 'binance.com'];
    if (financeSites.some(site => domain.includes(site))) {
      return 'finance_sites';
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
