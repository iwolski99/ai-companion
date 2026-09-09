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
const { collectFromPages, eachSourcePage, absolutize, result, parseViews } = require('../http');

const SOURCE = 'XVideos';
const BASE = 'https://www.xvideos.com';

function parseHtml(html) {
  const $ = cheerio.load(html);
  const items = [];

  $('.mozaique .thumb-block, .thumb-block').each((i, el) => {
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

    const duration =
      $el.find('.metadata .duration').first().text() ||
      $el.find('span.duration').first().text() ||
      null;

    const viewsText = $el.find('.metadata').text() || '';
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

  if (items.length === 0) {
    $('a[href*="/video"]').each((i, el) => {
      const $a = $(el);
      const videoUrl = absolutize($a.attr('href'), BASE);
      if (!videoUrl || !/\/video\d+/.test(videoUrl)) return;
      const $img = $a.find('img').first();
      if (!$img.length) return;
      items.push(
        result({
          title: $a.attr('title') || $img.attr('alt') || $a.text(),
          url: videoUrl,
          thumbnail: absolutize($img.attr('data-src') || $img.attr('src'), BASE),
          duration: $a.find('.duration').text() || null,
          source: SOURCE,
          rank: i,
        })
      );
    });
  }

  return items;
}

async function search(query, { limit = 360, pages = 8, startPage = 1 } = {}) {
  const k = encodeURIComponent(query);
  const urls = eachSourcePage(startPage, pages, (n) =>
    n === 1 ? `${BASE}/?k=${k}` : `${BASE}/?k=${k}&p=${n - 1}`
  );
  return collectFromPages(
    urls,
    { referer: BASE + '/' },
    parseHtml,
    { limit }
  );
}

module.exports = { id: 'xvideos', name: SOURCE, search };
