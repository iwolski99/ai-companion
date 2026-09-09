/**
 * GifReels — many posts flag hasAudio and host mp4s on xcdn.tv / p5rn.com
 * that allow hotlinking from this app.
 *
 * API: https://api.gifreels.com/post/by-tag-random?tag=
 *      https://api.gifreels.com/post/by-query?query=
 *      https://api.gifreels.com/post/feed-by-key?key=hot
 */

const fetch = require('node-fetch');
const { DEFAULT_UA } = require('../http');
const { isStraightText, tagsAreStraight } = require('../straight');

const API = 'https://api.gifreels.com';
const SITE = 'https://gifreels.com';
const CDN = 'https://xcdn.tv/cdn/storage/production/gifreels/post';

function tagSlug(query) {
  return String(query || 'amateur')
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'amateur';
}

async function apiGet(path) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  try {
    const res = await fetch(`${API}${path}`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': DEFAULT_UA,
        Referer: SITE + '/',
        Origin: SITE,
      },
      signal: controller.signal,
    });
    const text = await res.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = {};
    }
    if (!res.ok) {
      const err = new Error(`GifReels HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

function normalize(post) {
  const uid = post.uid || post.id;
  if (!uid) return null;
  if (post.mediaType && String(post.mediaType).toUpperCase() === 'IMAGE') return null;
  const title = post.title || String(uid);
  const tags = Array.isArray(post.tags)
    ? post.tags.map((t) => (typeof t === 'string' ? t : t.name || t.title)).filter(Boolean)
    : post.tagName
      ? [post.tagName]
      : [];
  if (!isStraightText(title) || !tagsAreStraight(tags)) return null;
  const watch = `${SITE}/gif/${uid}`;
  const file = `${CDN}/${uid}/gif.mp4`;
  return {
    id: `gifreels-${uid}`,
    title,
    tags,
    url: watch,
    embed: watch,
    hd: file,
    sd: file,
    thumbnail: `${CDN}/${uid}/poster-240.webp`,
    duration: post.duration || null,
    source: 'GifReels',
    hasAudio: post.hasAudio !== false,
    play: 'direct',
    width: post.width || null,
    height: post.height || null,
  };
}

async function search(query, page = 1) {
  const q = (query || 'amateur').trim();
  const slug = tagSlug(q);
  const limit = 20;
  const cursor = page > 1 ? `&cursor=${encodeURIComponent(String((page - 1) * limit))}` : '';
  let data = {};
  try {
    data = await apiGet(
      `/post/by-tag-random?tag=${encodeURIComponent(slug)}&limit=${limit}${cursor}`
    );
  } catch {
    data = {};
  }
  let posts = Array.isArray(data.posts) ? data.posts : [];
  if (!posts.length) {
    try {
      data = await apiGet(
        `/post/by-query?query=${encodeURIComponent(q)}&limit=${limit}`
      );
      posts = Array.isArray(data.posts) ? data.posts : [];
    } catch {
      posts = [];
    }
  }
  if (!posts.length && page === 1) {
    try {
      data = await apiGet(`/post/feed-by-key?key=hot&limit=${limit}`);
      posts = Array.isArray(data.posts) ? data.posts : [];
    } catch {
      posts = [];
    }
  }
  return posts.map(normalize).filter(Boolean);
}

module.exports = { search };
