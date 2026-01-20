import { describe, it, expect, beforeAll, vi } from 'vitest';
import 'fake-indexeddb/auto';
import {
  saveContent,
  getContentByUrl,
  getContentByCollection,
  getStorageStats,
  clearAllContent,
  deleteContentByUrl,
} from './contentStorage.js';

// Tests run in sequence with shared state
describe('contentStorage', () => {
  // Clear all content once at the start
  beforeAll(async () => {
    await clearAllContent();
  });

  describe('saveContent', () => {
    it('saves content successfully', async () => {
      const result = await saveContent('https://save-test.com/page1', 'Test content', 'test_pages');

      expect(result.saved).toBe(true);
      expect(result.collection).toBe('test_pages');
      expect(result.error).toBeUndefined();
    });

    it('stores content that can be retrieved', async () => {
      await saveContent('https://retrieve-test.com/page1', 'Test content for retrieve', 'retrieve_pages');

      const entries = await getContentByUrl('https://retrieve-test.com/page1');

      expect(entries.length).toBe(1);
      expect(entries[0].content).toBe('Test content for retrieve');
      expect(entries[0].collection).toBe('retrieve_pages');
    });

    it('updates existing entry within the same minute', async () => {
      await saveContent('https://update-test.com/page1', 'Initial content', 'update_pages');
      await saveContent('https://update-test.com/page1', 'Updated content', 'update_pages');

      const entries = await getContentByUrl('https://update-test.com/page1');

      expect(entries.length).toBe(1);
      expect(entries[0].content).toBe('Updated content');
    });

    it('calculates content size correctly', async () => {
      const content = 'a'.repeat(1024); // 1KB of 'a's
      await saveContent('https://size-test.com/page1', content, 'size_pages');

      const entries = await getContentByUrl('https://size-test.com/page1');

      expect(entries[0].sizeBytes).toBe(1024);
    });
  });

  describe('getContentByUrl', () => {
    it('returns empty array for non-existent URL', async () => {
      const entries = await getContentByUrl('https://definitely-nonexistent-url.com');

      expect(entries).toEqual([]);
    });

    it('returns multiple entries for a URL with different timestamps', async () => {
      const originalNow = Date.now;
      let timestamp = 2000000 * 60000; // Use a different base timestamp

      vi.spyOn(Date, 'now').mockImplementation(() => timestamp);
      await saveContent('https://multi-entry-test.com/page1', 'Content 1', 'multi_pages');

      timestamp += 60000; // Next minute
      await saveContent('https://multi-entry-test.com/page1', 'Content 2', 'multi_pages');

      vi.restoreAllMocks();

      const entries = await getContentByUrl('https://multi-entry-test.com/page1');

      expect(entries.length).toBe(2);
    });
  });

  describe('getContentByCollection', () => {
    it('returns all entries in a collection', async () => {
      const timestamp = 3000000 * 60000;
      vi.spyOn(Date, 'now').mockImplementation(() => timestamp);

      await saveContent('https://github.com/collection-user1', 'User 1 profile', 'github_collection_test');
      await saveContent('https://github.com/collection-user2', 'User 2 profile', 'github_collection_test');

      vi.restoreAllMocks();

      const entries = await getContentByCollection('github_collection_test');

      expect(entries.length).toBe(2);
      expect(entries.every(e => e.collection === 'github_collection_test')).toBe(true);
    });

    it('returns empty array for non-existent collection', async () => {
      const entries = await getContentByCollection('definitely_nonexistent_collection');

      expect(entries).toEqual([]);
    });
  });

  describe('getStorageStats', () => {
    it('returns stats with entries', async () => {
      // Save a unique entry for this test
      const timestamp = 4000000 * 60000;
      vi.spyOn(Date, 'now').mockImplementation(() => timestamp);

      await saveContent('https://stats-test.com/unique', 'a'.repeat(1024), 'stats_test_collection');

      vi.restoreAllMocks();

      const stats = await getStorageStats();

      // Should have at least this entry
      expect(stats.totalEntries).toBeGreaterThan(0);
      expect(stats.collections['stats_test_collection']).toBeGreaterThanOrEqual(1);
    });
  });

  describe('deleteContentByUrl', () => {
    it('deletes entries for a URL', async () => {
      const timestamp = 5000000 * 60000;
      vi.spyOn(Date, 'now').mockImplementation(() => timestamp);

      await saveContent('https://delete-test.com/page1', 'To be deleted', 'delete_pages');

      vi.restoreAllMocks();

      const deleted = await deleteContentByUrl('https://delete-test.com/page1');

      expect(deleted).toBe(1);

      const entries = await getContentByUrl('https://delete-test.com/page1');
      expect(entries.length).toBe(0);
    });

    it('returns 0 for non-existent URL', async () => {
      const deleted = await deleteContentByUrl('https://definitely-nonexistent-delete.com');

      expect(deleted).toBe(0);
    });
  });

  describe('clearAllContent', () => {
    it('clears all stored content', async () => {
      // This is the final test - clears everything
      const timestamp = 6000000 * 60000;
      vi.spyOn(Date, 'now').mockImplementation(() => timestamp);

      await saveContent('https://clear-test.com/page1', 'Content 1', 'clear_pages');

      vi.restoreAllMocks();

      await clearAllContent();

      const stats = await getStorageStats();
      expect(stats.totalEntries).toBe(0);
    });
  });
});
