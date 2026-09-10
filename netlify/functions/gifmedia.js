/**
 * Same-origin media proxy so <video> can play clips that 403 when the
 * browser sends this app as Referer (RedGifs) or require a site Referer
 * (PornHub CDN, Reddit).
 *
 * GET /api/gifmedia?url=https://...
 * Forwards Range so native players can stream under the Lambda body cap.
 */

const fetch = require('node-fetch');
const { checkPassword } = require('./lib/auth');
const { DEFAULT_UA } = require('./lib/http');

const MAX_CHUNK = 4 * 1024 * 1024;
const ALLOWED_HOST_HINTS = [
  'redgifs.com',
  'phncdn.com',
  'pornhub.com',
  'xcdn.tv',
  'p5rn.com',
  'redd.it',
  'reddit.com',
  'erome.com',
  'gifreels.com',
  'nsfwmonster.com',
  'hardgif.com',
];

function hostAllowed(hostname) {
  const h = String(hostname || '').toLowerCase();
  return ALLOWED_HOST_HINTS.some((hint) => h === hint || h.endsWith(`.${hint}`) || h.includes(hint));
}

function refererFor(hostname) {
  const h = String(hostname || '').toLowerCase();
  if (h.includes('redgifs')) return 'https://www.redgifs.com/';
  if (h.includes('phncdn') || h.includes('pornhub')) return 'https://www.pornhub.com/';
  if (h.includes('xcdn') || h.includes('p5rn') || h.includes('gifreels')) return 'https://gifreels.com/';
  if (h.includes('redd') || h.includes('reddit')) return 'https://www.reddit.com/';
  if (h.includes('erome')) return 'https://www.erome.com/';
  if (h.includes('nsfwmonster')) return 'https://nsfwmonster.com/';
  if (h.includes('hardgif')) return 'https://hardgif.com/';
  return `https://${hostname}/`;
}

function parseRange(header) {
  const raw = header ? String(header) : '';
  const m = raw.match(/bytes=(\d+)-(\d*)/i);
  const start = m ? Number(m[1]) : 0;
  const requestedEnd = m && m[2] !== '' ? Number(m[2]) : start + MAX_CHUNK - 1;
  const end = Math.min(requestedEnd, start + MAX_CHUNK - 1);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start) {
    return { start: 0, end: MAX_CHUNK - 1 };
  }
  return { start, end };
}

function corsHeaders(extra) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Search-Password, Range',
    'Access-Control-Allow-Methods': 'GET, OPTIONS, HEAD',
    'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
    ...extra,
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders({}), body: '' };
  }
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'HEAD') {
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

  if (!/^https?:$/i.test(target.protocol) || !hostAllowed(target.hostname)) {
    return {
      statusCode: 403,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Host not allowed for proxying' }),
    };
  }

  const headersIn = event.headers || {};
  const { start, end } = parseRange(headersIn.range || headersIn.Range);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 18000);

  try {
    const res = await fetch(target.toString(), {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': DEFAULT_UA,
        Accept: 'video/mp4,video/webm,video/*,*/*;q=0.8',
        Referer: refererFor(target.hostname),
        Range: `bytes=${start}-${end}`,
      },
    });

    if (!res.ok && res.status !== 206) {
      return {
        statusCode: res.status,
        headers: corsHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ error: `Upstream HTTP ${res.status}` }),
      };
    }

    const contentType = res.headers.get('content-type') || 'video/mp4';
    if (!/^(video|audio|application\/octet-stream)/i.test(contentType)) {
      return {
        statusCode: 415,
        headers: corsHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ error: 'Upstream did not return video' }),
      };
    }

    const bufFull = Buffer.from(await res.arrayBuffer());
    const sliced = bufFull.length > MAX_CHUNK;
    const buf = sliced ? bufFull.subarray(0, MAX_CHUNK) : bufFull;
    const outHeaders = corsHeaders({
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=3600',
      'Content-Length': String(buf.length),
    });
    const contentRange = res.headers.get('content-range');
    const totalHint = res.headers.get('content-length');
    if (contentRange && !sliced) {
      outHeaders['Content-Range'] = contentRange;
    } else if (sliced || res.status === 206) {
      const total = contentRange
        ? (contentRange.split('/')[1] || '*')
        : totalHint || '*';
      outHeaders['Content-Range'] = `bytes ${start}-${start + buf.length - 1}/${total}`;
    }

    const statusCode =
      contentRange || sliced || res.status === 206 ? 206 : res.status;

    return {
      statusCode,
      headers: outHeaders,
      body: event.httpMethod === 'HEAD' ? '' : buf.toString('base64'),
      isBase64Encoded: event.httpMethod !== 'HEAD',
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: corsHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        error: 'Proxy fetch failed',
        message: err.message || String(err),
      }),
    };
  } finally {
    clearTimeout(timer);
  }
};
