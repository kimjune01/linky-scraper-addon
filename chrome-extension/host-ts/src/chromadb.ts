/**
 * ChromaDB integration for storing scraped content
 */

import { determineCollectionName } from './collection-name.js';
import { splitUrl } from './url-utils.js';
import type { SaveResponse } from './types.js';

// ChromaDB types (dynamic import to handle missing module gracefully)
interface ChromaClientInterface {
  heartbeat(): Promise<number>;
  getCollection(params: { name: string }): Promise<CollectionInterface>;
  createCollection(params: { name: string; metadata?: Record<string, unknown> }): Promise<CollectionInterface>;
}

interface CollectionInterface {
  metadata?: Record<string, unknown>;
  modify(params: { metadata?: Record<string, unknown> }): Promise<void>;
  get(params: { ids: string[] }): Promise<{ ids: string[] }>;
  update(params: { ids: string[]; documents: string[]; metadatas: Record<string, unknown>[] }): Promise<void>;
  add(params: { ids: string[]; documents: string[]; metadatas: Record<string, unknown>[] }): Promise<void>;
}

const CHROMA_HOST = 'localhost';
const CHROMA_PORT = 8000;

let chromaClient: ChromaClientInterface | null = null;
let ChromaClient: (new (config: { path: string }) => ChromaClientInterface) | null = null;

/**
 * Dynamically loads the ChromaDB client
 */
async function loadChromaClient(): Promise<boolean> {
  if (ChromaClient) return true;

  try {
    const chromadb = await import('chromadb');
    ChromaClient = chromadb.ChromaClient as unknown as typeof ChromaClient;
    return true;
  } catch {
    console.error('ChromaDB is not installed. Run: pnpm add chromadb');
    return false;
  }
}

/**
 * Gets or initializes the ChromaDB client
 */
async function getClient(): Promise<ChromaClientInterface | null> {
  if (chromaClient) return chromaClient;

  const loaded = await loadChromaClient();
  if (!loaded || !ChromaClient) return null;

  try {
    chromaClient = new ChromaClient({
      path: `http://${CHROMA_HOST}:${CHROMA_PORT}`,
    });
    // Test connection
    await chromaClient.heartbeat();
    return chromaClient;
  } catch (error) {
    console.error('Failed to connect to ChromaDB:', error);
    return null;
  }
}

/**
 * Updates the collection's metadata to signal recency (LRU tracking)
 */
async function updateLruCollection(client: ChromaClientInterface, collectionName: string): Promise<void> {
  try {
    const collection = await client.getCollection({ name: collectionName });
    const metadata = { ...(collection.metadata || {}), updated_at: Math.floor(Date.now() / 1000) };
    await collection.modify({ metadata });
  } catch (error) {
    console.error(`Failed to update LRU metadata for ${collectionName}:`, error);
  }
}

/**
 * Gets or creates a collection with the given name
 */
async function getOrCreateCollection(
  client: ChromaClientInterface,
  collectionName: string,
  metadata: Record<string, unknown>,
): Promise<CollectionInterface> {
  try {
    // Try to get existing collection
    return await client.getCollection({ name: collectionName });
  } catch {
    // Collection doesn't exist, create it
    return await client.createCollection({
      name: collectionName,
      metadata,
    });
  }
}

/**
 * Saves content to ChromaDB
 */
export async function saveToChromaDb(url: string, content: string): Promise<SaveResponse> {
  const client = await getClient();

  if (!client) {
    return { saved: false, error: 'ChromaDB is not available' };
  }

  try {
    const collectionName = determineCollectionName(url);
    const { domain } = splitUrl(url);
    const createdAt = Math.floor(Date.now() / 1000);

    const collectionMetadata: Record<string, unknown> = {
      domain,
      description: `Collection for ${collectionName}`,
      created_at: createdAt,
    };

    const documentMetadata: Record<string, unknown> = {
      url,
      created_at: createdAt,
      content_size_kb: Math.round((Buffer.byteLength(content, 'utf-8') / 1024) * 100) / 100,
    };

    const collection = await getOrCreateCollection(client, collectionName, collectionMetadata);

    // Create timestamped ID to allow updates within the same minute
    // but prevent duplicates from rapid-fire calls
    const minuteTimestamp = Math.floor(Date.now() / 60000);
    const timestampedUrl = `${url}_${minuteTimestamp}`;

    // Check if document exists
    let exists = false;
    try {
      const existing = await collection.get({ ids: [timestampedUrl] });
      exists = existing.ids.length > 0;
    } catch {
      exists = false;
    }

    if (exists) {
      // Update existing document
      await collection.update({
        ids: [timestampedUrl],
        documents: [content],
        metadatas: [documentMetadata],
      });
    } else {
      // Add new document
      await collection.add({
        ids: [timestampedUrl],
        documents: [content],
        metadatas: [documentMetadata],
      });
    }

    // Update LRU tracking
    await updateLruCollection(client, collectionName);

    return { saved: true, collection_name: collectionName };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Failed to save to ChromaDB:', error);
    return { saved: false, error: errorMessage };
  }
}
