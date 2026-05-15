/**
 * Simple in-memory cache with TTL support.
 * For production, consider using Redis or a similar caching layer.
 */

class SimpleCache {
  constructor(defaultTTL = 300000) { // 5 minutes default TTL
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  /**
   * Get a value from cache.
   * @param {string} key - Cache key
   * @returns {*} - Cached value or undefined if expired/not found
   */
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  /**
   * Set a value in cache with optional TTL.
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Time to live in ms (optional, uses default)
   */
  set(key, value, ttl = this.defaultTTL) {
    this.cache.set(key, {
      value,
      expires: Date.now() + ttl,
    });
  }

  /**
   * Delete a specific key from cache.
   * @param {string} key - Cache key
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Clear all entries from cache.
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Delete all entries matching a pattern.
   * @param {string} pattern - Pattern to match (e.g., "goal:*")
   */
  deletePattern(pattern) {
    const regex = new RegExp(pattern.replace(/\*/g, ".*"));
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clean up expired entries (called periodically to prevent memory leaks).
   */
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key);
      }
    }
  }
}

// Export a singleton instance
const goalProgressCache = new SimpleCache(300000); // 5 minute TTL for goal progress

// Run cleanup every minute to prevent memory leaks
setInterval(() => goalProgressCache.cleanup(), 60000);

module.exports = { SimpleCache, goalProgressCache };
