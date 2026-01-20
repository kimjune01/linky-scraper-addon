import { describe, it, expect } from 'vitest';
import { determineCollectionName } from './collectionName.js';

describe('determineCollectionName', () => {
  describe('LinkedIn', () => {
    it('identifies LinkedIn profiles', () => {
      expect(determineCollectionName('https://www.linkedin.com/in/johndoe/')).toBe('linkedin_profiles');
      expect(determineCollectionName('https://linkedin.com/in/johndoe')).toBe('linkedin_profiles');
    });

    it('identifies LinkedIn companies', () => {
      expect(determineCollectionName('https://www.linkedin.com/company/google/')).toBe('linkedin_companies');
    });

    it('identifies LinkedIn jobs', () => {
      expect(determineCollectionName('https://www.linkedin.com/jobs/view/123456')).toBe('linkedin_jobs');
    });

    it('identifies LinkedIn learning', () => {
      expect(determineCollectionName('https://www.linkedin.com/learning/course-name')).toBe('linkedin_learning');
    });
  });

  describe('GitHub', () => {
    it('identifies GitHub profiles', () => {
      expect(determineCollectionName('https://github.com/octocat')).toBe('github_profiles');
      expect(determineCollectionName('https://github.com/octocat/')).toBe('github_profiles');
    });

    it('identifies GitHub repositories', () => {
      expect(determineCollectionName('https://github.com/octocat/hello-world')).toBe('github_repositories');
      expect(determineCollectionName('https://github.com/octocat/hello-world/')).toBe('github_repositories');
    });

    it('identifies GitHub pull requests', () => {
      expect(determineCollectionName('https://github.com/octocat/repo/pull/123')).toBe('github_pull_requests');
    });

    it('identifies GitHub issues', () => {
      expect(determineCollectionName('https://github.com/octocat/repo/issues/456')).toBe('github_issues');
    });

    it('identifies GitHub gists', () => {
      expect(determineCollectionName('https://gist.github.com/octocat/abc123')).toBe('github_gists');
    });
  });

  describe('YouTube', () => {
    it('identifies YouTube videos', () => {
      expect(determineCollectionName('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('youtube_videos');
      expect(determineCollectionName('https://youtu.be/dQw4w9WgXcQ')).toBe('youtube_videos');
    });

    it('identifies YouTube playlists', () => {
      expect(determineCollectionName('https://www.youtube.com/playlist?list=PLtest')).toBe('youtube_playlists');
    });

    it('identifies YouTube channels', () => {
      expect(determineCollectionName('https://www.youtube.com/channel/UCtest')).toBe('youtube_channels');
      expect(determineCollectionName('https://www.youtube.com/c/ChannelName')).toBe('youtube_channels');
      expect(determineCollectionName('https://www.youtube.com/user/username')).toBe('youtube_channels');
    });
  });

  describe('Reddit', () => {
    it('identifies subreddits with name', () => {
      expect(determineCollectionName('https://www.reddit.com/r/programming/comments/123')).toBe('reddit_programming');
      expect(determineCollectionName('https://reddit.com/r/javascript')).toBe('reddit_javascript');
    });

    it('handles Reddit without subreddit', () => {
      expect(determineCollectionName('https://www.reddit.com/user/username')).toBe('reddit_posts');
    });
  });

  describe('Stack Overflow', () => {
    it('identifies Stack Overflow questions', () => {
      expect(determineCollectionName('https://stackoverflow.com/questions/12345/how-to-do-x')).toBe(
        'stackoverflow_questions',
      );
    });

    it('identifies Stack Overflow users', () => {
      expect(determineCollectionName('https://stackoverflow.com/users/12345/johndoe')).toBe('stackoverflow_users');
    });
  });

  describe('Social Media', () => {
    it('identifies Twitter posts', () => {
      expect(determineCollectionName('https://twitter.com/elonmusk/status/123456789')).toBe('twitter_posts');
      expect(determineCollectionName('https://x.com/elonmusk/status/123456789')).toBe('twitter_posts');
    });

    it('identifies Twitter profiles', () => {
      expect(determineCollectionName('https://twitter.com/elonmusk')).toBe('twitter_profiles');
    });
  });

  describe('E-commerce', () => {
    it('identifies Amazon products', () => {
      expect(determineCollectionName('https://www.amazon.com/dp/B08N5WRWNW')).toBe('ecommerce_products');
    });

    it('identifies eBay listings', () => {
      expect(determineCollectionName('https://www.ebay.com/itm/123456789')).toBe('ecommerce_products');
    });

    it('identifies e-commerce search results', () => {
      expect(determineCollectionName('https://www.amazon.com/s/ref=nb_sb_noss?q=laptop')).toBe(
        'ecommerce_search_results',
      );
    });
  });

  describe('Google Services', () => {
    it('identifies Google Drive', () => {
      expect(determineCollectionName('https://drive.google.com/file/d/abc123')).toBe('google_drive_files');
    });

    it('identifies Google Docs', () => {
      expect(determineCollectionName('https://docs.google.com/document/d/abc123')).toBe('google_docs');
    });

    it('identifies Google Sheets', () => {
      expect(determineCollectionName('https://docs.google.com/spreadsheets/d/abc123')).toBe('google_sheets');
    });

    it('identifies Google Slides', () => {
      expect(determineCollectionName('https://docs.google.com/presentation/d/abc123')).toBe('google_slides');
    });
  });

  describe('Music Streaming', () => {
    it('identifies Spotify tracks', () => {
      expect(determineCollectionName('https://open.spotify.com/track/abc123')).toBe('spotify_tracks');
    });

    it('identifies Spotify albums', () => {
      expect(determineCollectionName('https://open.spotify.com/album/abc123')).toBe('spotify_albums');
    });

    it('identifies Spotify playlists', () => {
      expect(determineCollectionName('https://open.spotify.com/playlist/abc123')).toBe('spotify_playlists');
    });
  });

  describe('Documentation', () => {
    it('identifies documentation URLs', () => {
      expect(determineCollectionName('https://react.dev/docs/getting-started')).toBe('react_documentation');
      expect(determineCollectionName('https://nodejs.org/api/fs.html')).toBe('nodejs_documentation');
    });
  });

  describe('File Types', () => {
    it('identifies document files', () => {
      expect(determineCollectionName('https://example.com/report.pdf')).toBe('document_files');
      expect(determineCollectionName('https://example.com/doc.docx')).toBe('document_files');
    });

    it('identifies image files', () => {
      expect(determineCollectionName('https://example.com/photo.jpg')).toBe('image_files');
      expect(determineCollectionName('https://example.com/logo.png')).toBe('image_files');
    });

    it('identifies video files', () => {
      expect(determineCollectionName('https://example.com/video.mp4')).toBe('video_files');
    });

    it('identifies code files', () => {
      expect(determineCollectionName('https://example.com/script.js')).toBe('code_files');
      expect(determineCollectionName('https://example.com/main.py')).toBe('code_files');
    });
  });

  describe('Default/Fallback', () => {
    it('uses domain for unknown sites', () => {
      expect(determineCollectionName('https://mysite.com/page')).toBe('mysite_pages');
    });

    it('includes subdomain for non-www subdomains', () => {
      expect(determineCollectionName('https://blog.mysite.com/post')).toBe('mysite_blog_posts');
      expect(determineCollectionName('https://api.mysite.com/endpoint')).toBe('mysite_api_pages');
    });

    it('handles IP addresses', () => {
      expect(determineCollectionName('http://192.168.1.1/admin')).toBe('ip_address_sites');
    });

    it('handles invalid URLs gracefully', () => {
      // URL constructor parses 'not-a-url' as a relative path, resulting in empty domain
      // which falls through to the default case
      expect(determineCollectionName('not-a-url')).toBe('_pages');
    });
  });
});
