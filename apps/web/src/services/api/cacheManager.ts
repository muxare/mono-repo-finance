/**
 * Cache Manager - Handles HTTP request caching with TTL, ETags, and memory management
 */

import type { CacheEntry, CacheConfig } from '../../types/ApiTypes';

export class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize: number;
  private defaultTTL: number;
  private accessTimes = new Map<string, number>();

  constructor(maxSize = 100, defaultTTL = 300000) { // 5 minutes default
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  /**
   * Get cached data if valid
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.accessTimes.delete(key);
      return null;
    }

    // Update access time for LRU
    this.accessTimes.set(key, Date.now());
    return entry.data;
  }

  /**
   * Set cached data with TTL
   */
  set<T>(key: string, data: T, config?: CacheConfig): void {
    const now = Date.now();
    const ttl = config?.ttl || this.defaultTTL;

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl,
      etag: this.generateETag(data),
    };

    // Evict old entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, entry);
    this.accessTimes.set(key, now);
  }

  /**
   * Check if cached entry is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry ? !this.isExpired(entry) : false;
  }

  /**
   * Remove specific cache entry
   */
  delete(key: string): boolean {
    this.accessTimes.delete(key);
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.accessTimes.clear();
  }

  /**
   * Clear expired entries
   */  clearExpired(): number {
    let cleared = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        this.accessTimes.delete(key);
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Clear entries by tag
   */
  clearByTag(tag: string): number {
    let cleared = 0;
    // For now, we'll implement a simple key-based clearing
    // In a more advanced implementation, we'd store tag mappings
    for (const key of this.cache.keys()) {
      if (key.includes(tag)) {
        this.cache.delete(key);
        this.accessTimes.delete(key);
        cleared++;
      }
    }
    return cleared;
  }
  /**
   * Get cache statistics
   */
  getStats() {
    let validEntries = 0;
    let expiredEntries = 0;
    let totalSize = 0;

    for (const [, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        expiredEntries++;
      } else {
        validEntries++;
      }
      totalSize += this.getEntrySize(entry);
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      totalSize,
      maxSize: this.maxSize,
      hitRate: this.getHitRate(),
      oldestEntry: this.getOldestEntryAge(),
      newestEntry: this.getNewestEntryAge()
    };
  }

  /**
   * Generate cache key from URL and parameters
   */
  static generateKey(url: string, params?: Record<string, any>, headers?: Record<string, string>): string {
    const paramString = params ? JSON.stringify(params) : '';
    const headerString = headers ? JSON.stringify(headers) : '';
    return `${url}:${paramString}:${headerString}`;
  }

  /**
   * Check if entry should be revalidated (stale-while-revalidate)
   */
  shouldRevalidate(key: string, staleThreshold = 0.8): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const age = Date.now() - entry.timestamp;
    const staleTime = entry.ttl * staleThreshold;
    
    return age > staleTime;
  }

  /**
   * Get entry age in milliseconds
   */
  getEntryAge(key: string): number | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    return Date.now() - entry.timestamp;
  }

  /**
   * Check if we can use conditional request (If-None-Match, If-Modified-Since)
   */
  getConditionalHeaders(key: string): Record<string, string> {
    const entry = this.cache.get(key);
    const headers: Record<string, string> = {};

    if (entry?.etag) {
      headers['If-None-Match'] = entry.etag;
    }

    if (entry?.lastModified) {
      headers['If-Modified-Since'] = entry.lastModified;
    }

    return headers;
  }

  /**
   * Update cache entry with new response headers
   */
  updateFromResponse(key: string, headers: Record<string, string>): void {
    const entry = this.cache.get(key);
    if (!entry) return;

    if (headers.etag) {
      entry.etag = headers.etag;
    }

    if (headers['last-modified']) {
      entry.lastModified = headers['last-modified'];
    }

    // Update timestamp to extend cache life
    entry.timestamp = Date.now();
    this.accessTimes.set(key, Date.now());
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private evictLRU(): void {
    if (this.accessTimes.size === 0) return;

    // Find the least recently used entry
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, time] of this.accessTimes.entries()) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.accessTimes.delete(oldestKey);
    }
  }

  private generateETag(data: any): string {
    // Simple ETag generation based on data hash
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `"${Math.abs(hash).toString(16)}"`;
  }

  private getEntrySize(entry: CacheEntry<any>): number {
    // Rough estimation of entry size in bytes
    const dataSize = JSON.stringify(entry.data).length * 2; // UTF-16
    const metadataSize = 64; // Rough estimate for timestamps, etag, etc.
    return dataSize + metadataSize;
  }

  private getHitRate(): number {
    // This would need to be tracked separately in a real implementation
    // For now, return a placeholder
    return 0;
  }

  private getOldestEntryAge(): number {
    let oldestAge = 0;
    const now = Date.now();

    for (const entry of this.cache.values()) {
      const age = now - entry.timestamp;
      if (age > oldestAge) {
        oldestAge = age;
      }
    }

    return oldestAge;
  }

  private getNewestEntryAge(): number {
    let newestAge = Infinity;
    const now = Date.now();

    for (const entry of this.cache.values()) {
      const age = now - entry.timestamp;
      if (age < newestAge) {
        newestAge = age;
      }
    }

    return newestAge === Infinity ? 0 : newestAge;
  }
}

// Export singleton instance
export const cacheManager = new CacheManager();
