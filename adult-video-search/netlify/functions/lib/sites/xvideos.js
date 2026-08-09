/**
 * XVideos search scraper
 *
 * Search URL: https://www.xvideos.com/?k={query}
 *
 * Typical result markup (update selectors if the site redesigns):
 *   .mozaique .thumb-block          — each result card
 *   .thumb a[href]                  — video link (/video....)
 *   img[data-src], img[src]         — thumbnail (prefer data-src)
 *   .title a                        — title text
 *   .duration                       — e.g. "12 min"
 *   .metadata / .views              — view count when present
 */

const cheerio = require('cheerio');
const { fetchHtml, absolutize, result, parseViews } = require('../http');

const SOURCE = 'XVideos';
const BASE = 'https://www.xvideos.com';

async function search(query, { limit = 24 } = {}) {
  const url = `${BASE}/?k=${encodeURIComponent(query)}`;
  const { ok, status, html } = await fetchHtml(url, {
    timeoutMs: 7000,
    referer: BASE + '/',
  });

  if (!ok) {
    throw new Error(`HTTP ${status}`);
  }

  const $ = cheerio.load(html);
  const items = [];

  // Primary: classic thumb-block mosaic
  $('.mozaique .thumb-block, .thumb-block').each((i, el) => {
    if (items.length >= limit) return false;
    const $el = $(el);

    const $link =
      $el.find('.thumb a[href*="/video"]').first().length
        ? $el.find('.thumb a[href*="/video"]').first()
        : $el.find('a[href*="/video"]').first();

    const href = $link.attr('href');
    if (!href) return;

    const videoUrl = absolutize(href, BASE);
    if (!videoUrl || !/\/video/.test(videoUrl)) return;

    const $img = $el.find('img').first();
    const thumb =
      $img.attr('data-src') ||
      $img.attr('data-srcset')?.split(/\s+/)[0] ||
      $img.attr('src') ||
      null;

    const title =
      $el.find('.title a').attr('title') ||
      $el.find('.title a').text() ||
      $img.attr('alt') ||
      $link.attr('title') ||
      '';

    // Prefer metadata duration to avoid concatenating title+duration spans
    const duration =
      $el.find('.metadata .duration').first().text() ||
      $el.find('span.duration').first().text() ||
      null;

    const viewsText = $el.find('.metadata').text() || '';
    // Patterns: "8.1M Views", "12k views", etc.
    const viewsMatch =
      viewsText.match(/([\d.,]+\s*[kmb])\s*(?:views?)?/i) ||
      viewsText.match(/([\d.,]+)\s*views?/i);

    items.push(
      result({
        title,
        url: videoUrl,
        thumbnail: thumb ? absolutize(thumb, BASE) : null,
        duration,
        source: SOURCE,
        views: viewsMatch ? parseViews(viewsMatch[1]) : null,
        rank: i,
      })
    );
  });

  // Fallback: any video anchors with nearby images
  if (items.length === 0) {
    $('a[href*="/video"]').each((i, el) => {
      if (items.length >= limit) return false;
      const $a = $(el);
      const href = $a.attr('href');
      const videoUrl = absolutize(href, BASE);
      if (!videoUrl || !/\/video\d+/.test(videoUrl)) return;

      const $img = $a.find('img').first();
      if (!$img.length) return;

      items.push(
        result({
          title: $a.attr('title') || $img.attr('alt') || $a.text(),
          url: videoUrl,
          thumbnail: absolutize(
            $img.attr('data-src') || $img.attr('src'),
            BASE
          ),
          duration: $a.find('.duration').text() || null,
          source: SOURCE,
          rank: i,
        })
      );
    });
  }

  return items;
}

module.exports = { id: 'xvideos', name: SOURCE, search };
