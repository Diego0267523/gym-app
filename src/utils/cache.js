/**
 * Simple in-memory cache with TTL (Time To Live)
 * Ideal for high-traffic endpoints without additional infrastructure
 */

const cache = new Map();

/**
 * Get value from cache
 * @param {string} key Cache key
 * @returns {any} Cached value or null if expired/not found
 */
function get(key) {
  const entry = cache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.value;
}

/**
 * Set value in cache
 * @param {string} key Cache key
 * @param {any} value Value to cache
 * @param {number} ttlMs Time to live in milliseconds (default: 10s)
 */
function set(key, value, ttlMs = 10000) {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * Clear specific cache key
 * @param {string} key Cache key
 */
function clear(key) {
  cache.delete(key);
}

/**
 * Clear all cache
 */
function clearAll() {
  cache.clear();
}

/**
 * Get cache stats (for debugging)
 */
function stats() {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}
/**
 * Clear cache by prefix (PRO)
 * @param {string} prefix Prefix of keys to delete
 */
function clearByPrefix(prefix) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}
module.exports = { get, set, clear, clearAll, clearByPrefix, stats };
