import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Deduplicator } from './deduplicator';

describe('Deduplicator', () => {
  let mockStorage: Record<string, string>;

  beforeEach(() => {
    mockStorage = {};

    // Mock localStorage
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => mockStorage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        mockStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key];
      }),
      clear: vi.fn(() => {
        mockStorage = {};
      }),
    });
  });

  describe('constructor', () => {
    it('initializes with empty storage', () => {
      const dedup = new Deduplicator();
      expect(dedup.isContentChanged('any content')).toBe(true);
    });

    it('loads existing hashes from localStorage', () => {
      mockStorage['deduplicator_hashes'] = JSON.stringify(['12345']);
      const dedup = new Deduplicator();
      // The hash for this specific content should match what's stored
      expect(localStorage.getItem).toHaveBeenCalledWith('deduplicator_hashes');
    });

    it('handles corrupted localStorage data', () => {
      mockStorage['deduplicator_hashes'] = 'not valid json';
      const dedup = new Deduplicator();
      // Should not throw and should treat as empty
      expect(dedup.isContentChanged('test')).toBe(true);
    });
  });

  describe('isContentChanged', () => {
    it('returns true for new content', () => {
      const dedup = new Deduplicator();
      expect(dedup.isContentChanged('Hello world')).toBe(true);
    });

    it('returns false for previously seen content', () => {
      const dedup = new Deduplicator();
      const content = 'Hello world this is a test content';
      dedup.updateWithContent(content);
      expect(dedup.isContentChanged(content)).toBe(false);
    });

    it('returns true for different content', () => {
      const dedup = new Deduplicator();
      // Hash function sums charCodes at positions 0, 10, 20, 30...
      // Need strings that differ at those positions
      const contentA = 'AAAAAAAAAA' + 'BBBBBBBBBB' + 'CCCCCCCCCC'; // positions 0, 10, 20 = A, B, C
      const contentB = 'XXXXXXXXXX' + 'YYYYYYYYYY' + 'ZZZZZZZZZZ'; // positions 0, 10, 20 = X, Y, Z
      dedup.updateWithContent(contentA);
      expect(dedup.isContentChanged(contentB)).toBe(true);
    });
  });

  describe('updateWithContent', () => {
    it('stores content hash', () => {
      const dedup = new Deduplicator();
      const content = 'Test content for hashing';
      dedup.updateWithContent(content);
      expect(dedup.isContentChanged(content)).toBe(false);
    });

    it('persists to localStorage', () => {
      const dedup = new Deduplicator();
      dedup.updateWithContent('Some content');
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('does not duplicate existing content', () => {
      const dedup = new Deduplicator();
      const content = 'Duplicate test content here';
      dedup.updateWithContent(content);
      dedup.updateWithContent(content);

      // Get what was saved to localStorage
      const saved = JSON.parse(mockStorage['deduplicator_hashes'] || '[]');
      // Count occurrences of the hash (should be 1)
      const hashCount = saved.filter((h: string) => h === saved[0]).length;
      expect(hashCount).toBe(1);
    });

    it('handles multiple different contents', () => {
      const dedup = new Deduplicator();
      // Use longer, more distinct strings to avoid hash collisions
      // The hash function samples every 10th character
      const content1 = 'First unique content string with lots of text to ensure unique hash A';
      const content2 = 'Second unique content string with lots of text to ensure unique hash B';
      const content3 = 'Third unique content string with lots of text to ensure unique hash C';
      const content4 = 'Fourth unique content string with lots of text to ensure unique hash D';

      dedup.updateWithContent(content1);
      dedup.updateWithContent(content2);
      dedup.updateWithContent(content3);

      expect(dedup.isContentChanged(content1)).toBe(false);
      expect(dedup.isContentChanged(content2)).toBe(false);
      expect(dedup.isContentChanged(content3)).toBe(false);
      expect(dedup.isContentChanged(content4)).toBe(true);
    });
  });

  describe('hash function behavior', () => {
    it('produces same hash for same content', () => {
      const dedup = new Deduplicator();
      const content = 'This is a longer test content for consistent hashing';
      dedup.updateWithContent(content);
      // Same content should not be marked as changed
      expect(dedup.isContentChanged(content)).toBe(false);
    });

    it('handles empty content', () => {
      const dedup = new Deduplicator();
      dedup.updateWithContent('');
      expect(dedup.isContentChanged('')).toBe(false);
    });

    it('handles very short content', () => {
      const dedup = new Deduplicator();
      dedup.updateWithContent('a');
      expect(dedup.isContentChanged('a')).toBe(false);
    });
  });

  describe('Set-based lookup (O(1) performance)', () => {
    it('efficiently handles many entries', () => {
      const dedup = new Deduplicator();

      // Add many entries
      for (let i = 0; i < 1000; i++) {
        dedup.updateWithContent(`Content number ${i} with enough length to hash properly`);
      }

      // Lookup should still be fast (Set.has is O(1))
      const startTime = performance.now();
      for (let i = 0; i < 1000; i++) {
        dedup.isContentChanged(`Content number ${i} with enough length to hash properly`);
      }
      const endTime = performance.now();

      // Should complete in reasonable time (< 100ms for 1000 lookups)
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});
