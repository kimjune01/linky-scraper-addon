// Deduplicator class using localStorage to store a set of hashes (up to 1MB)
const LOCALSTORAGE_KEY = 'deduplicator_hashes';
const MAX_STORAGE_BYTES = 1024 * 1024; // 1MB
const CLEANUP_PROBABILITY = 0.001; // Run cleanup ~1 in 1000 calls

function hashContent(content: string): string {
  // Fast, low-accuracy hash: sum char codes of every 10th character
  let hash = 0;
  for (let i = 0; i < content.length; i += 10) {
    hash += content.charCodeAt(i);
  }
  return hash.toString();
}

export class Deduplicator {
  private hashes: Set<string>;
  private hashOrder: string[]; // Track insertion order for cleanup

  constructor() {
    const loaded = this.loadHashes();
    this.hashes = new Set(loaded);
    this.hashOrder = loaded;
  }

  private loadHashes(): string[] {
    const data = localStorage.getItem(LOCALSTORAGE_KEY);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private saveHashes() {
    // Probabilistically run cleanup (about 1 in 1000 calls)
    if (Math.random() < CLEANUP_PROBABILITY) {
      let serialized = JSON.stringify(this.hashOrder);
      while (serialized.length > MAX_STORAGE_BYTES && this.hashOrder.length > 0) {
        // Remove the oldest half at once
        const half = Math.ceil(this.hashOrder.length / 2);
        const removed = this.hashOrder.splice(0, half);
        removed.forEach(h => this.hashes.delete(h));
        serialized = JSON.stringify(this.hashOrder);
      }
    }
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(this.hashOrder));
  }

  isContentChanged(content: string): boolean {
    const contentHash = hashContent(content);
    return !this.hashes.has(contentHash);
  }

  updateWithContent(content: string): void {
    const contentHash = hashContent(content);
    if (!this.hashes.has(contentHash)) {
      this.hashes.add(contentHash);
      this.hashOrder.push(contentHash);
      this.saveHashes();
    }
  }
}
