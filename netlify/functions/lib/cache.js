/**
 * Short-lived cache for search results.
 * Prefer Netlify Blobs when available; fall back to process memory (warm instances only).
 */

const DEFAULT_TTL = Number(process.env.CACHE_TTL_SECONDS || 180); // 3 minutes

/** @type {Map<string, { expires: number, value: any }>} */
const memory = new Map();

function cacheKey(query, sites) {
  const q = String(query || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
  const s = (sites || []).slice().sort().join(',');
  return `search:${q}|${s}`;
}

async function getStore() {
  try {
    // Lazy require so local/unit use still works without Netlify context
    const { getStore } = require('@netlify/blobs');
    return getStore({ name: 'search-cache', consistency: 'eventual' });
  } catch {
    return null;
  }
}

/**
 * @param {string} key
 * @returns {Promise<any|null>}
 */
async function cacheGet(key) {
  const now = Date.now();

  const mem = memory.get(key);
  if (mem && mem.expires > now) return mem.value;
  if (mem) memory.delete(key);

  const store = await getStore();
  if (!store) return null;

  try {
    const raw = await store.get(key, { type: 'json' });
    if (!raw || !raw.expires || raw.expires <= now) return null;
    // hydrate memory for subsequent warm hits
    memory.set(key, { expires: raw.expires, value: raw.value });
    return raw.value;
  } catch {
    return null;
  }
}

/**
 * @param {string} key
 * @param {any} value
 * @param {number} [ttlSeconds]
 */
async function cacheSet(key, value, ttlSeconds = DEFAULT_TTL) {
  const expires = Date.now() + ttlSeconds * 1000;
  memory.set(key, { expires, value });

  // prune memory map opportunistically
  if (memory.size > 200) {
    for (const [k, v] of memory) {
      if (v.expires <= Date.now()) memory.delete(k);
    }
  }

  const store = await getStore();
  if (!store) return;
  try {
    await store.setJSON(key, { expires, value });
  } catch {
    // Blobs unavailable in some local contexts — ignore
  }
}

module.exports = { cacheKey, cacheGet, cacheSet, DEFAULT_TTL };
