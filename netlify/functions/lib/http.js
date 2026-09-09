/**
 * Shared HTTP helpers for polite, browser-like scraping.
 * Realistic headers, short timeouts, and bounded concurrency across result pages.
 */

const fetch = require('node-fetch');

const DEFAULT_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const BASE_HEADERS = {
  'User-Agent': DEFAULT_UA,
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
};

/**
 * Fetch a URL with browser-like headers and a hard timeout.
 * @param {string} url
 * @param {{ timeoutMs?: number, headers?: Record<string,string>, referer?: string }} [opts]
 * @returns {Promise<{ ok: boolean, status: number, html: string, finalUrl: string }>}
 */
async function fetchHtml(url, opts = {}) {
  const timeoutMs = opts.timeoutMs ?? 7000;
  const headers = {
    ...BASE_HEADERS,
    ...(opts.referer ? { Referer: opts.referer } : {}),
    ...(opts.headers || {}),
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers,
      redirect: 'follow',
      signal: controller.signal,
    });
    const html = await res.text();
    return {
      ok: res.ok,
      status: res.status,
      html,
      finalUrl: res.url || url,
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Absolute-ize a possibly relative URL against a base.
 * @param {string} href
 * @param {string} base
 */
function absolutize(href, base) {
  if (!href) return null;
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

/**
 * Parse common duration strings into a display string (passthrough cleaned).
 * Accepts "12:34", "1h 2m", "74 min", etc.
 */
function normalizeDuration(raw) {
  if (!raw) return null;
  const s = String(raw).replace(/\s+/g, ' ').trim();
  if (!s) return null;
  return s;
}

/**
 * Parse view counts like "1.2M", "45K", "1,234 views".
 * Returns a number when possible, else null.
 */
function parseViews(raw) {
  if (raw == null) return null;
  const s = String(raw).replace(/,/g, '').replace(/\s*views?/i, '').trim();
  const m = s.match(/^([\d.]+)\s*([kmb])?$/i);
  if (!m) {
    const n = parseInt(s, 10);
    return Number.isFinite(n) ? n : null;
  }
  let n = parseFloat(m[1]);
  const suffix = (m[2] || '').toLowerCase();
  if (suffix === 'k') n *= 1e3;
  if (suffix === 'm') n *= 1e6;
  if (suffix === 'b') n *= 1e9;
  return Math.round(n);
}

/**
 * Build a normalized video result object.
 */
function result({
  title,
  url,
  thumbnail,
  duration,
  source,
  views,
  rating,
  uploaded,
  rank,
}) {
  return {
    title: (title || '').trim() || 'Untitled',
    url,
    thumbnail: thumbnail || null,
    duration: normalizeDuration(duration),
    source,
    views: typeof views === 'number' ? views : parseViews(views),
    rating: rating || null,
    uploaded: uploaded || null,
    rank: typeof rank === 'number' ? rank : null,
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 1-based source page numbers for a fetch batch.
 * startPage=1, pages=8 → [1,2,3,4,5,6,7,8]
 */
function eachSourcePage(startPage, pages, makeUrl) {
  const start = Math.max(1, Number(startPage) || 1);
  const count = Math.max(1, Number(pages) || 1);
  return Array.from({ length: count }, (_, i) => makeUrl(start + i));
}

async function fetchHtmlRetry(url, opts = {}, retries = 1) {
  let last = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      await sleep(350 * attempt + Math.floor(Math.random() * 250));
    }
    try {
      last = await fetchHtml(url, opts);
    } catch (err) {
      last = err;
      continue;
    }
    if (last.ok) return last;
    if (![403, 429, 503].includes(last.status)) return last;
  }
  if (last && typeof last.status === 'number') return last;
  throw last || new Error('Fetch failed');
}

/**
 * Fetch several result pages with bounded concurrency and merge unique videos.
 * Merges in source-page order so ranking stays stable.
 */
async function collectFromPages(
  urls,
  fetchOpts,
  parseHtml,
  { limit = 360, concurrency = 4 } = {}
) {
  const timeoutMs = fetchOpts.timeoutMs ?? 8000;
  const pool = Math.max(1, Math.min(concurrency, urls.length));
  const responses = new Array(urls.length);
  let next = 0;

  async function worker() {
    while (true) {
      const idx = next++;
      if (idx >= urls.length) return;
      try {
        responses[idx] = await fetchHtmlRetry(urls[idx], {
          ...fetchOpts,
          timeoutMs,
        });
      } catch (err) {
        responses[idx] = err;
      }
    }
  }

  await Promise.all(Array.from({ length: pool }, () => worker()));

  const seen = new Set();
  const items = [];
  let lastError = null;

  for (const res of responses) {
    if (!res || typeof res.ok !== 'boolean') {
      lastError = res instanceof Error ? res : new Error('Fetch failed');
      continue;
    }
    if (!res.ok) {
      lastError = new Error(`HTTP ${res.status}`);
      continue;
    }
    let parsed = [];
    try {
      parsed = parseHtml(res.html, res) || [];
    } catch (err) {
      lastError = err;
      continue;
    }
    for (const item of parsed) {
      if (!item?.url || seen.has(item.url)) continue;
      seen.add(item.url);
      items.push({ ...item, rank: items.length });
      if (items.length >= limit) return items;
    }
  }

  if (!items.length && lastError) throw lastError;
  return items;
}

module.exports = {
  fetchHtml,
  fetchHtmlRetry,
  collectFromPages,
  eachSourcePage,
  absolutize,
  normalizeDuration,
  parseViews,
  result,
  DEFAULT_UA,
};
