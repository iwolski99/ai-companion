/**
 * XNXX search scraper
 *
 * Search URL: https://www.xnxx.com/search/{query}
 * (Same parent company as XVideos — markup is related but not identical.)
 *
 * Typical result markup:
 *   .mozaique .thumb-block                 — each result
 *   .thumb a[href*="/video-"]              — video page
 *   img[data-src]                          — thumbnail (src is often a blank gif)
 *   .thumb-under p a[title]                — title (NOT .title like XVideos)
 *   .metadata                              — contains duration text (e.g. "2min") + views
 */

const cheerio = require('cheerio');
const { fetchHtml, absolutize, result, parseViews } = require('../http');

const SOURCE = 'XNXX';
const BASE = 'https://www.xnxx.com';

function extractDurationFromMetadata(metaText) {
  if (!metaText) return null;
  // e.g. "14.9k 70% 2min - 1080p" or "12:34"
  const m =
    metaText.match(/\b(\d+:\d{2}(?::\d{2})?)\b/) ||
    metaText.match(/\b(\d+\s*min)\b/i) ||
    metaText.match(/\b(\d+min)\b/i);
  return m ? m[1].replace(/(\d)min/i, '$1 min') : null;
}

async function search(query, { limit = 24 } = {}) {
  const pathQuery = encodeURIComponent(query).replace(/%20/g, '+');
  const url = `${BASE}/search/${pathQuery}`;
  const { ok, status, html } = await fetchHtml(url, {
    timeoutMs: 7000,
    referer: BASE + '/',
  });

  if (!ok) {
    throw new Error(`HTTP ${status}`);
  }

  const $ = cheerio.load(html);
  const items = [];
  const seen = new Set();

  $('.mozaique .thumb-block, .thumb-block').each((i, el) => {
    if (items.length >= limit) return false;
    const $el = $(el);

    const $link = $el.find('a[href*="/video-"]').first();
    const href = $link.attr('href');
    if (!href) return;

    const videoUrl = absolutize(href, BASE);
    if (!videoUrl || seen.has(videoUrl)) return;
    seen.add(videoUrl);

    const $img = $el.find('.thumb img').first().length
      ? $el.find('.thumb img').first()
      : $el.find('img').first();

    const thumb =
      $img.attr('data-src') ||
      $img.attr('data-mzl') ||
      ($img.attr('src') && !$img.attr('src').includes('blank.gif')
        ? $img.attr('src')
        : null);

    // Title lives on the under-thumb anchor (title attr preferred)
    const title =
      $el.find('.thumb-under a[title]').attr('title') ||
      $el.find('.thumb-under a[href*="/video-"]').first().text() ||
      $link.attr('title') ||
      $img.attr('alt') ||
      '';

    const metaText = $el.find('.metadata').text() || '';
    const duration =
      extractDurationFromMetadata(metaText) ||
      $el.find('.duration').first().text() ||
      null;

    // Views often look like "14.9k" next to an eye icon in .metadata .right
    const viewsChunk =
      $el.find('.metadata .right').clone().children().remove().end().text() ||
      metaText;
    const viewsMatch = viewsChunk.match(/([\d.,]+\s*[kmb]?)/i);

    const ratingMatch = metaText.match(/(\d{1,3}%)/);

    items.push(
      result({
        title,
        url: videoUrl,
        thumbnail: thumb ? absolutize(thumb, BASE) : null,
        duration,
        source: SOURCE,
        views: viewsMatch ? parseViews(viewsMatch[1]) : null,
        rating: ratingMatch ? ratingMatch[1] : null,
        rank: i,
      })
    );
  });

  return items;
}

module.exports = { id: 'xnxx', name: SOURCE, search };
