/**
 * Thumbnail proxy — use when a CDN blocks hotlinking.
 *
 * GET /api/thumbnail?url=https://...
 * Optional: ?password= if SITE_PASSWORD is set
 *
 * Only allows http(s) image URLs. Streams bytes with a short cache.
 */

const fetch = require('node-fetch');
const { checkPassword } = require('./lib/auth');
const { DEFAULT_UA } = require('./lib/http');

const ALLOWED_HOST_HINTS = [
  'xvideos',
  'xnxx',
  'spankbang',
  'xhcdn',
  'xhamster',
  'phncdn',
  'pornhub',
  'ypncdn',
  'youporn',
  'bdsmstreak',
  'mespeaks',
  'trafficjunky',
  'minutemedia',
  'erome',
  'redgifs',
  'xcdn',
  'p5rn',
  'gifreels',
  'redd.it',
  'reddit',
  'nsfwmonster',
  'hardgif',
  'cdn',
];

function isProbablyImageHost(hostname) {
  const h = hostname.toLowerCase();
  return ALLOWED_HOST_HINTS.some((hint) => h.includes(hint));
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, X-Search-Password',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const auth = checkPassword(event);
  if (!auth.ok) {
    return {
      statusCode: auth.statusCode,
      headers: { 'Content-Type': 'application/json' },
      body: auth.body,
    };
  }

  const qs = event.queryStringParameters || {};
  const rawUrl = qs.url;
  if (!rawUrl) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing url parameter' }),
    };
  }

  let target;
  try {
    target = new URL(rawUrl);
  } catch {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid url' }),
    };
  }

  if (!/^https?:$/i.test(target.protocol)) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Only http(s) URLs allowed' }),
    };
  }

  if (!isProbablyImageHost(target.hostname)) {
    return {
      statusCode: 403,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Host not allowed for proxying' }),
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(target.toString(), {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': DEFAULT_UA,
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        Referer: `${target.protocol}//${target.hostname}/`,
      },
    });

    if (!res.ok) {
      return {
        statusCode: res.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: `Upstream HTTP ${res.status}` }),
      };
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    if (!/^image\//i.test(contentType) && !/octet-stream/i.test(contentType)) {
      return {
        statusCode: 415,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Upstream did not return an image' }),
      };
    }

    const buf = Buffer.from(await res.arrayBuffer());
    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
      body: buf.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Proxy fetch failed',
        message: err.message || String(err),
      }),
    };
  } finally {
    clearTimeout(timer);
  }
};
