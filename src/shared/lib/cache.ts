type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

const DEFAULT_TTL = 60 * 60 * 1000; // 60 minutes

export class ServiceCache {
  private static memoryCache = new Map<string, CacheEntry<any>>();

  static set<T>(key: string, data: T, useStorage = true) {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    this.memoryCache.set(key, entry);
    
    if (useStorage) {
      try {
        localStorage.setItem(`app_cache_${key}`, JSON.stringify(entry));
      } catch (e) {
        // Fallback
      }
    }
  }

  static get<T>(key: string, ttl = DEFAULT_TTL, useStorage = true): T | null {
    let entry = this.memoryCache.get(key);
    
    if (!entry && useStorage) {
      const stored = localStorage.getItem(`app_cache_${key}`);
      if (stored) {
        try {
          entry = JSON.parse(stored);
          if (entry) this.memoryCache.set(key, entry);
        } catch (e) {
          return null;
        }
      }
    }

    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > ttl;
    if (isExpired) {
      this.memoryCache.delete(key);
      if (useStorage) localStorage.removeItem(`app_cache_${key}`);
      return null;
    }

    return entry.data as T;
  }

  static invalidate(key: string) {
    this.memoryCache.delete(key);
    localStorage.removeItem(`app_cache_${key}`);
  }

  static invalidateAll() {
    this.memoryCache.clear();
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('app_cache_')) localStorage.removeItem(key);
    });
  }
}
