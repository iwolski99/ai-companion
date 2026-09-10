/**
 * BDSMStreak search scraper
 *
 * Search URL: https://bdsmstreak.com/search?q={query}
 *
 * Typical result markup (Tailwind card grid):
 *   a.group.block[href^="/video/"]     — each result card (link wraps whole card)
 *   img.v2-card-thumb[src]             — thumbnail on v3.bdsmstreak.com CDN
 *   h3                                 — title
 *   span.duration-pill                 — e.g. "0:28" / "12:34"
 *   meta row under title               — "8 hours ago · 88 views"
 */

const cheerio = require('cheerio');
const { collectFromPages, eachSourcePage, absolutize, result, parseViews, pickChannelText } = require('../http');

const SOURCE = 'BDSMStreak';
const BASE = 'https://bdsmstreak.com';

async function search(query, { limit = 360, pages = 8, startPage = 1 } = {}) {
  const q = encodeURIComponent(query);
  const urls = eachSourcePage(startPage, pages, (n) =>
    n === 1
      ? `${BASE}/search?q=${q}`
      : `${BASE}/search?q=${q}&page=${n}`
  );
  return collectFromPages(urls, { referer: BASE + '/' }, parseHtml, { limit });
}

function parseHtml(html) {
  const $ = cheerio.load(html);
  const items = [];
  const seen = new Set();

  // Prefer full card anchors in the results grid
  const cards = $('a.group.block[href^="/video/"], a[href^="/video/"].group').toArray();
  const nodes = cards.length
    ? cards
    : $('a[href^="/video/"]').toArray();

  $(nodes).each((i, el) => {
    const $el = $(el);
    const href = $el.attr('href');
    if (!href || !/^\/video\/\d+/.test(href)) return;

    const videoUrl = absolutize(href, BASE);
    if (!videoUrl || seen.has(videoUrl)) return;
    seen.add(videoUrl);

    const $img = $el.find('img.v2-card-thumb, img').first();
    const thumb = $img.attr('src') || $img.attr('data-src') || null;

    const title =
      $el.find('h3').first().text() ||
      $img.attr('alt') ||
      $el.attr('title') ||
      '';

    const duration =
      $el.find('.duration-pill, .duration').first().text() || null;

    const metaText = $el.find('.mt-1, .text-xs').first().text() || '';
    const viewsMatch = metaText.match(/([\d.,]+\s*[kmb]?)\s*views?/i);
    const uploadedMatch = metaText.match(
      /((?:\d+\s*(?:minutes?|hours?|days?|weeks?|months?|years?)\s*ago)|(?:yesterday)|(?:just now))/i
    );

    items.push(
      result({
        title,
        url: videoUrl,
        thumbnail: thumb ? absolutize(thumb, BASE) : null,
        duration,
        source: SOURCE,
        views: viewsMatch ? parseViews(viewsMatch[1]) : null,
        uploaded: uploadedMatch ? uploadedMatch[1] : null,
        studio: pickChannelText($el),
        rank: i,
      })
    );
  });

  return items;
}

module.exports = { id: 'bdsmstreak', name: SOURCE, search };
