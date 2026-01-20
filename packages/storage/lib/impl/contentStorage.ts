/**
 * IndexedDB-based content storage with LRU eviction policy
 *
 * Stores scraped content with automatic eviction when storage limits are reached.
 * Uses IndexedDB for persistence across browser sessions.
 */

const DB_NAME = 'linky-content-db';
const DB_VERSION = 1;
const STORE_NAME = 'content';
const META_STORE_NAME = 'metadata';

// Storage limits
const MAX_ENTRIES = 10000; // Maximum number of entries to store
const MAX_SIZE_MB = 100; // Maximum total size in MB
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export interface ContentEntry {
  id: string; // URL + timestamp
  url: string;
  content: string;
  collection: string;
  createdAt: number;
  accessedAt: number;
  sizeBytes: number;
}

export interface StorageMetadata {
  key: string;
  totalEntries: number;
  totalSizeBytes: number;
  lastEviction: number;
}

interface ContentStorageDB extends IDBDatabase {
  objectStoreNames: DOMStringList;
}

let dbPromise: Promise<ContentStorageDB> | null = null;

/**
 * Opens or creates the IndexedDB database
 */
function openDatabase(): Promise<ContentStorageDB> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      dbPromise = null;
      reject(new Error(`Failed to open IndexedDB: ${request.error?.message}`));
    };

    request.onsuccess = () => {
      resolve(request.result as ContentStorageDB);
    };

    request.onupgradeneeded = event => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create content store with indexes
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const contentStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        contentStore.createIndex('url', 'url', { unique: false });
        contentStore.createIndex('collection', 'collection', { unique: false });
        contentStore.createIndex('accessedAt', 'accessedAt', { unique: false });
        contentStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // Create metadata store for tracking totals
      if (!db.objectStoreNames.contains(META_STORE_NAME)) {
        db.createObjectStore(META_STORE_NAME, { keyPath: 'key' });
      }
    };
  });

  return dbPromise;
}

/**
 * Gets the current storage metadata
 */
async function getMetadata(): Promise<StorageMetadata> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(META_STORE_NAME, 'readonly');
    const store = tx.objectStore(META_STORE_NAME);
    const request = store.get('stats');

    request.onsuccess = () => {
      resolve(
        request.result || {
          key: 'stats',
          totalEntries: 0,
          totalSizeBytes: 0,
          lastEviction: 0,
        },
      );
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Updates the storage metadata
 */
async function updateMetadata(metadata: StorageMetadata): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(META_STORE_NAME, 'readwrite');
    const store = tx.objectStore(META_STORE_NAME);
    const request = store.put(metadata);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Evicts oldest entries (LRU) until storage is within limits
 */
async function evictIfNeeded(metadata: StorageMetadata): Promise<StorageMetadata> {
  if (metadata.totalEntries <= MAX_ENTRIES && metadata.totalSizeBytes <= MAX_SIZE_BYTES) {
    return metadata;
  }

  const db = await openDatabase();

  // Evict 10% of entries or until under limits
  const targetEntries = Math.floor(MAX_ENTRIES * 0.9);
  const targetSize = Math.floor(MAX_SIZE_BYTES * 0.9);

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME, META_STORE_NAME], 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('accessedAt');

    let evictedCount = 0;
    let evictedSize = 0;
    let currentEntries = metadata.totalEntries;
    let currentSize = metadata.totalSizeBytes;

    const cursorRequest = index.openCursor();

    cursorRequest.onsuccess = event => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

      if (cursor && (currentEntries > targetEntries || currentSize > targetSize)) {
        const entry = cursor.value as ContentEntry;
        evictedCount++;
        evictedSize += entry.sizeBytes;
        currentEntries--;
        currentSize -= entry.sizeBytes;
        cursor.delete();
        cursor.continue();
      } else {
        // Update metadata
        const newMetadata: StorageMetadata = {
          key: 'stats',
          totalEntries: currentEntries,
          totalSizeBytes: currentSize,
          lastEviction: Date.now(),
        };

        const metaStore = tx.objectStore(META_STORE_NAME);
        metaStore.put(newMetadata);

        tx.oncomplete = () => {
          console.log(`Evicted ${evictedCount} entries (${Math.round(evictedSize / 1024)}KB)`);
          resolve(newMetadata);
        };
      }
    };

    cursorRequest.onerror = () => reject(cursorRequest.error);
  });
}

/**
 * Saves content to IndexedDB
 */
export async function saveContent(
  url: string,
  content: string,
  collection: string,
): Promise<{ saved: boolean; collection: string; error?: string }> {
  try {
    const db = await openDatabase();
    const now = Date.now();
    const minuteTimestamp = Math.floor(now / 60000);
    const id = `${url}_${minuteTimestamp}`;
    const sizeBytes = new TextEncoder().encode(content).length;

    const entry: ContentEntry = {
      id,
      url,
      content,
      collection,
      createdAt: now,
      accessedAt: now,
      sizeBytes,
    };

    // Get existing entry to check if update or insert
    const existingEntry = await new Promise<ContentEntry | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    // Get and potentially update metadata
    let metadata = await getMetadata();

    // Calculate size delta
    const sizeDelta = existingEntry ? sizeBytes - existingEntry.sizeBytes : sizeBytes;
    const countDelta = existingEntry ? 0 : 1;

    metadata.totalEntries += countDelta;
    metadata.totalSizeBytes += sizeDelta;

    // Evict if needed before insert
    metadata = await evictIfNeeded(metadata);

    // Save the entry
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([STORE_NAME, META_STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const metaStore = tx.objectStore(META_STORE_NAME);

      store.put(entry);

      // Update metadata with new counts
      if (!existingEntry) {
        metadata.totalEntries++;
        metadata.totalSizeBytes += sizeBytes;
      } else {
        metadata.totalSizeBytes += sizeDelta;
      }
      metaStore.put(metadata);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    return { saved: true, collection };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Failed to save to IndexedDB:', error);
    return { saved: false, collection, error: message };
  }
}

/**
 * Gets content by URL (updates access time for LRU)
 */
export async function getContentByUrl(url: string): Promise<ContentEntry[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('url');
    const request = index.getAll(url);

    request.onsuccess = () => {
      const entries = request.result as ContentEntry[];
      // Update access time for LRU
      const now = Date.now();
      for (const entry of entries) {
        entry.accessedAt = now;
        store.put(entry);
      }
      resolve(entries);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Gets all content in a collection
 */
export async function getContentByCollection(collection: string): Promise<ContentEntry[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('collection');
    const request = index.getAll(collection);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Gets storage statistics
 */
export async function getStorageStats(): Promise<{
  totalEntries: number;
  totalSizeMB: number;
  collections: Record<string, number>;
}> {
  const db = await openDatabase();
  const metadata = await getMetadata();

  const collections: Record<string, number> = {};

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('collection');
    const request = index.openCursor();

    request.onsuccess = event => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        const entry = cursor.value as ContentEntry;
        collections[entry.collection] = (collections[entry.collection] || 0) + 1;
        cursor.continue();
      } else {
        resolve();
      }
    };
    request.onerror = () => reject(request.error);
  });

  return {
    totalEntries: metadata.totalEntries,
    totalSizeMB: Math.round((metadata.totalSizeBytes / (1024 * 1024)) * 100) / 100,
    collections,
  };
}

/**
 * Clears all stored content
 */
export async function clearAllContent(): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME, META_STORE_NAME], 'readwrite');

    tx.objectStore(STORE_NAME).clear();
    tx.objectStore(META_STORE_NAME).put({
      key: 'stats',
      totalEntries: 0,
      totalSizeBytes: 0,
      lastEviction: 0,
    });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Deletes content by URL
 */
export async function deleteContentByUrl(url: string): Promise<number> {
  const db = await openDatabase();
  let deletedCount = 0;
  let deletedSize = 0;

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('url');
    const request = index.openCursor(url);

    request.onsuccess = event => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        const entry = cursor.value as ContentEntry;
        deletedCount++;
        deletedSize += entry.sizeBytes;
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };
    request.onerror = () => reject(request.error);
  });

  // Update metadata
  const metadata = await getMetadata();
  metadata.totalEntries -= deletedCount;
  metadata.totalSizeBytes -= deletedSize;
  await updateMetadata(metadata);

  return deletedCount;
}

// Export for testing
export const _internals = {
  DB_NAME,
  MAX_ENTRIES,
  MAX_SIZE_BYTES,
  openDatabase,
  evictIfNeeded,
};
