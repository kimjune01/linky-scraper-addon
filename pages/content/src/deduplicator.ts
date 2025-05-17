// Deduplicator class using localStorage to store a set of hashes (up to 1MB)
const LOCALSTORAGE_KEY = 'deduplicator_hashes';
const MAX_STORAGE_BYTES = 1024 * 1024; // 1MB

function hashContent(content: string): string {
  // Fast, low-accuracy hash: sum char codes of every 10th character
  let hash = 0;
  for (let i = 0; i < content.length; i += 10) {
    hash += content.charCodeAt(i);
  }
  return hash.toString();
}

export class Deduplicator {
  private hashes: string[];

  constructor() {
    this.hashes = this.loadHashes();
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
    // Remove oldest hashes if storage exceeds 1MB
    let serialized = JSON.stringify(this.hashes);
    // Probabilistically run cleanup (about 1 in 1000 calls)
    if (Math.random() < 0.001) {
      while (serialized.length > MAX_STORAGE_BYTES && this.hashes.length > 0) {
        // Remove the oldest half at once
        const half = Math.ceil(this.hashes.length / 2);
        this.hashes = this.hashes.slice(half);
        serialized = JSON.stringify(this.hashes);
      }
    }
    localStorage.setItem(LOCALSTORAGE_KEY, serialized);
  }

  isContentChanged(content: string): boolean {
    const contentHash = hashContent(content);
    if (this.hashes.includes(contentHash)) {
      return false;
    }
    return true;
  }

  updateWithContent(content: string): void {
    const contentHash = hashContent(content);
    if (!this.hashes.includes(contentHash)) {
      this.hashes.push(contentHash);
      this.saveHashes();
    }
  }
}
