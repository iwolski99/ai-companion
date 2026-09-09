/**
 * GET/POST /.netlify/functions/search
 * Also available at /api/search via redirect.
 *
 * Query params / JSON body:
 *   q          — search query (required)
 *   sites      — comma-separated site ids (optional; default DEFAULT_SITE_IDS)
 *                Max MAX_SITES (5) per request — extras are rejected.
 *   limit      — per-site result cap (default 120, max 200)
 *   pages      — search-result pages to fetch per site (default 4, max 6)
 *   password   — if SITE_PASSWORD is set
 *   nocache    — "1" to bypass cache
 *
 * Response:
 *   {
 *     query, cached, tookMs,
 *     results: [...normalized videos],
 *     meta: { sites: { id: { ok, count, error? } } }
 *   }
 */

const { ALL, byId, MAX_SITES, DEFAULT_SITE_IDS } = require('./lib/sites');
const { checkPassword } = require('./lib/auth');
const { cacheKey, cacheGet, cacheSet } = require('./lib/cache');
const { isStraightVideo } = require('./lib/straight');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, X-Search-Password',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8',
};

function json(statusCode, data) {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(data),
  };
}

function parseInput(event) {
  const qs = event.queryStringParameters || {};
  let body = {};
  if (event.body) {
    try {
      body =
        typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } catch {
      body = {};
    }
  }

  const q = (qs.q || qs.query || body.q || body.query || '').trim();
  const limit = Math.min(
    200,
    Math.max(1, Number(qs.limit || body.limit || 120) || 120)
  );
  const pages = Math.min(
    6,
    Math.max(1, Number(qs.pages || body.pages || 4) || 4)
  );
  const nocache = qs.nocache === '1' || body.nocache === true;

  let siteIds = null;
  const rawSites = qs.sites || body.sites;
  if (rawSites) {
    siteIds = String(rawSites)
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }

  return { q, limit, pages, nocache, siteIds };
}

/**
 * Interleave results by original site ranking so one source doesn't dominate.
 * Within the same rank, preserve source registry order.
 */
function interleaveByRank(groups) {
  const maxLen = Math.max(0, ...groups.map((g) => g.length));
  const out = [];
  for (let rank = 0; rank < maxLen; rank++) {
    for (const group of groups) {
      if (group[rank]) out.push(group[rank]);
    }
  }
  return out;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const auth = checkPassword(event);
  if (!auth.ok) {
    return {
      statusCode: auth.statusCode,
      headers: corsHeaders,
      body: auth.body,
    };
  }

  const { q, limit, pages, nocache, siteIds } = parseInput(event);
  if (!q) {
    return json(400, {
      error: 'Missing query',
      message: 'Provide q (or query) as a query param or JSON body field.',
    });
  }
  if (q.length > 200) {
    return json(400, { error: 'Query too long' });
  }

  const requestedIds = siteIds || DEFAULT_SITE_IDS;
  if (requestedIds.length > MAX_SITES) {
    return json(400, {
      error: 'Too many sites',
      message: `Select at most ${MAX_SITES} sites per search.`,
      maxSites: MAX_SITES,
      available: ALL.map((s) => s.id),
    });
  }

  const sites = requestedIds.map((id) => byId[id]).filter(Boolean);

  if (!sites.length) {
    return json(400, {
      error: 'No valid sites',
      available: ALL.map((s) => s.id),
      maxSites: MAX_SITES,
    });
  }

  const key = cacheKey(
    `straight:p${pages}:l${limit}:${q}`,
    sites.map((s) => s.id)
  );

  if (!nocache) {
    const hit = await cacheGet(key);
    if (hit) {
      return json(200, { ...hit, cached: true });
    }
  }

  const started = Date.now();

  const settled = await Promise.allSettled(
    sites.map((site) =>
      site.search(q, { limit, pages }).then((results) => ({
        id: site.id,
        name: site.name,
        results,
      }))
    )
  );

  const meta = { sites: {} };
  const groups = [];

  settled.forEach((outcome, i) => {
    const site = sites[i];
    if (outcome.status === 'fulfilled') {
      const results = outcome.value.results.filter(isStraightVideo);
      meta.sites[site.id] = {
        ok: true,
        name: site.name,
        count: results.length,
      };
      groups.push(results);
    } else {
      const message =
        outcome.reason?.message || String(outcome.reason || 'Unknown error');
      meta.sites[site.id] = {
        ok: false,
        name: site.name,
        count: 0,
        error: message,
      };
      groups.push([]);
    }
  });

  const results = interleaveByRank(groups);
  const payload = {
    query: q,
    cached: false,
    tookMs: Date.now() - started,
    count: results.length,
    results,
    meta,
  };

  // Cache successful (even partial) responses
  await cacheSet(key, payload);

  return json(200, payload);
};
