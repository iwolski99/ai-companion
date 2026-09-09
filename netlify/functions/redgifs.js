/**
 * RedGifs proxy — temporary guest token + search / tags.
 *
 * GET /api/redgifs?action=search&q=&order=trending|top|latest&page=1&count=40
 * GET /api/redgifs?action=tags&q=   (tag suggestions; omit q for trending)
 *
 * Straight-only: gay / bi / trans-coded tags are stripped server-side.
 * Token is cached in memory (~20 min) so we do not hammer /v2/auth/temporary.
 */

const fetch = require('node-fetch');
const { checkPassword } = require('./lib/auth');
const { isStraightGif, isStraightText, isBlockedQuery } = require('./lib/straight');
const { DEFAULT_UA } = require('./lib/http');

const API = 'https://api.redgifs.com';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, X-Search-Password',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8',
};

/** @type {{ token: string|null, expires: number }} */
let tokenCache = { token: null, expires: 0 };

function json(statusCode, data) {
  return { statusCode, headers: corsHeaders, body: JSON.stringify(data) };
}

async function getToken() {
  if (tokenCache.token && Date.now() < tokenCache.expires - 60_000) {
    return tokenCache.token;
  }
  const res = await fetch(`${API}/v2/auth/temporary`, {
    headers: {
      Accept: 'application/json',
      'User-Agent': DEFAULT_UA,
    },
  });
  if (!res.ok) {
    throw new Error(`RedGifs auth HTTP ${res.status}`);
  }
  const data = await res.json();
  const token = data.token || data.access_token;
  if (!token) throw new Error('RedGifs auth returned no token');
  tokenCache = { token, expires: Date.now() + 20 * 60 * 1000 };
  return token;
}

async function rgFetch(path, token) {
  const res = await fetch(`${API}${path}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': DEFAULT_UA,
    },
  });
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text.slice(0, 200) };
  }
  if (!res.ok) {
    const err = new Error(`RedGifs HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function normalizeGif(gif) {
  const urls = gif.urls || {};
  const id = gif.id || gif.gifId;
  return {
    id,
    title: gif.title || (Array.isArray(gif.tags) ? gif.tags.slice(0, 4).join(' ') : id),
    tags: Array.isArray(gif.tags) ? gif.tags : [],
    url: `https://www.redgifs.com/watch/${id}`,
    embed: `https://www.redgifs.com/ifr/${id}`,
    thumbnail:
      urls.poster ||
      urls.thumbnail ||
      urls.posterPortrait ||
      urls.vthumbnail ||
      null,
    duration: gif.duration || null,
    views: gif.views || null,
    likes: gif.likes || null,
    userName: gif.userName || null,
    hasAudio: Boolean(gif.hasAudio),
    width: gif.width || null,
    height: gif.height || null,
    createDate: gif.createDate || null,
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return json(405, { error: 'Method not allowed' });
  }

  const auth = checkPassword(event);
  if (!auth.ok) {
    return { statusCode: auth.statusCode, headers: corsHeaders, body: auth.body };
  }

  const qs = event.queryStringParameters || {};
  const action = (qs.action || 'search').toLowerCase();

  try {
    const token = await getToken();

    if (action === 'tags') {
      const q = (qs.q || '').trim();
      let tags = [];
      if (q) {
        const data = await rgFetch(
          `/v2/search/tags?query=${encodeURIComponent(q)}`,
          token
        );
        const list = data.tags || data.items || [];
        tags = list
          .map((t) => (typeof t === 'string' ? t : t.name || t.tag || ''))
          .filter(Boolean);
      } else {
        const data = await rgFetch('/v2/gifs/search?type=g&order=trending&count=40', token);
        const gifs = data.gifs || [];
        const counts = new Map();
        for (const gif of gifs) {
          for (const tag of gif.tags || []) {
            if (!isStraightText(tag)) continue;
            counts.set(tag, (counts.get(tag) || 0) + 1);
          }
        }
        tags = [...counts.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 24)
          .map(([name]) => name);
      }
      return json(200, {
        tags: tags.filter(isStraightText).slice(0, 24),
      });
    }

    const q = (qs.q || qs.query || qs.tags || '').trim();
    if (isBlockedQuery(q)) {
      return json(200, {
        query: q,
        order: 'trending',
        page: 1,
        count: 0,
        total: 0,
        gifs: [],
        blocked: true,
      });
    }
    const orderRaw = (qs.order || 'trending').toLowerCase();
    const order = ['trending', 'top', 'latest', 'latest-by-likes'].includes(orderRaw)
      ? orderRaw
      : 'trending';
    const page = Math.max(1, Number(qs.page || 1) || 1);
    const count = Math.min(80, Math.max(8, Number(qs.count || 40) || 40));

    const params = new URLSearchParams({
      type: 'g',
      order,
      count: String(count),
      page: String(page),
    });
    if (q) params.set('tags', q);

    const data = await rgFetch(`/v2/gifs/search?${params.toString()}`, token);
    const gifs = (data.gifs || [])
      .filter(isStraightGif)
      .map(normalizeGif);

    return json(200, {
      query: q,
      order,
      page,
      count: gifs.length,
      total: data.total || gifs.length,
      gifs,
    });
  } catch (err) {
    return json(err.status && err.status >= 400 ? err.status : 502, {
      error: 'RedGifs request failed',
      message: err.message || String(err),
    });
  }
};
