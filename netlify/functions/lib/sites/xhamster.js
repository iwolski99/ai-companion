/**
 * xHamster search scraper
 *
 * Search URL: https://xhamster.com/search/{query}
 *
 * Typical result markup:
 *   .thumb-list__item / .video-thumb  — result cards
 *   a.video-thumb__image-container    — link to /videos/...
 *   img[src], img[data-src]           — thumbnail
 *   .video-thumb-info__name / .title  — title
 *   .thumb-image-container__duration  — duration
 *   .video-thumb-views                — views
 */

const cheerio = require('cheerio');
const { collectFromPages, eachSourcePage, absolutize, result, parseViews, pickChannelText } = require('../http');

const SOURCE = 'xHamster';
const BASE = 'https://xhamster.com';

async function search(query, { limit = 360, pages = 8, startPage = 1 } = {}) {
  const pathQuery = encodeURIComponent(query).replace(/%20/g, '+');
  const urls = eachSourcePage(startPage, pages, (n) => {
    const base = `${BASE}/search/${pathQuery}`;
    return n === 1 ? base : `${base}?page=${n}`;
  });
  return collectFromPages(
    urls,
    {
      referer: BASE + '/',
      headers: { Cookie: 'cookie_accept=1; lang=en' },
    },
    parseHtml,
    { limit }
  );
}

function parseHtml(html) {
  const $ = cheerio.load(html);
  const items = [];
  const seen = new Set();

  const cards = $(
    '.thumb-list__item, .video-thumb, .mixed-list__item, .xh-thumb'
  ).toArray();

  $(cards).each((i, el) => {
    const $el = $(el);

    const $link = $el
      .find('a[href*="/videos/"], a[href*="/movies/"]')
      .first();
    const href = $link.attr('href');
    if (!href) return;

    const videoUrl = absolutize(href, BASE);
    if (!videoUrl || seen.has(videoUrl)) return;
    // Skip non-video paths (creators, categories, etc.)
    if (!/\/(videos|movies)\//.test(videoUrl)) return;
    seen.add(videoUrl);

    const $img = $el.find('img').first();
    const thumb =
      $img.attr('src') ||
      $img.attr('data-src') ||
      $img.attr('data-previewvideo') ||
      null;

    const title =
      $el.find('.video-thumb-info__name, .thumb-list__item-title, .title a, a.video-thumb-info__name')
        .first()
        .text() ||
      $link.attr('title') ||
      $img.attr('alt') ||
      '';

    const duration =
      $el
        .find(
          '.thumb-image-container__duration, .duration, [data-role="video-duration"]'
        )
        .first()
        .text() || null;

    const viewsRaw =
      $el.find('.video-thumb-views, .views, [data-role="video-views"]').first().text() ||
      null;

    const rating =
      $el.find('.rating, .xh-stat-value').first().text()?.trim() || null;

    items.push(
      result({
        title,
        url: videoUrl,
        thumbnail: thumb ? absolutize(String(thumb).split(' ')[0], BASE) : null,
        duration,
        source: SOURCE,
        views: parseViews(viewsRaw),
        rating,
        studio: pickChannelText($el),
        rank: i,
      })
    );
  });

  if (items.length === 0) {
    $('a[href*="/videos/"]').each((i, el) => {
      const $a = $(el);
      const videoUrl = absolutize($a.attr('href'), BASE);
      if (!videoUrl || seen.has(videoUrl)) return;
      if (!/\/videos\/[^/?#]+/.test(videoUrl)) return;
      const $img = $a.find('img').first();
      if (!$img.length) return;
      seen.add(videoUrl);

      items.push(
        result({
          title: $a.attr('title') || $img.attr('alt') || '',
          url: videoUrl,
          thumbnail: absolutize($img.attr('src') || $img.attr('data-src'), BASE),
          duration: $a.find('.duration').text() || null,
          source: SOURCE,
          studio: pickChannelText($a.parent()),
          rank: i,
        })
      );
    });
  }

  return items;
}

module.exports = { id: 'xhamster', name: SOURCE, search };
