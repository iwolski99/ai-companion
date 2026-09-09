/**
 * SpankBang search scraper
 *
 * Search URL: https://spankbang.com/s/{query}/
 *
 * Typical result markup (update if redesigns):
 *   .video-item / .video-list .thumb  — result cards
 *   a[href*="/video/"]                — video page
 *   img[data-src], img[src]           — thumbnail
 *   .name / .title                    — title
 *   .l / .length / .duration          — duration
 *   .v / .views                       — views
 */

const cheerio = require('cheerio');
const { collectFromPages, eachSourcePage, absolutize, result, parseViews, pickChannelText } = require('../http');

const SOURCE = 'SpankBang';
const BASE = 'https://spankbang.com';

async function search(query, { limit = 360, pages = 8, startPage = 1 } = {}) {
  const slug = encodeURIComponent(query).replace(/%20/g, '+');
  const urls = eachSourcePage(startPage, pages, (n) =>
    n === 1
      ? `https://www.spankbang.com/s/${slug}/`
      : `https://www.spankbang.com/s/${slug}/${n}/`
  );
  return collectFromPages(
    urls,
    {
      referer: 'https://www.spankbang.com/',
      headers: { Cookie: 'age_verified=1' },
    },
    parseHtml,
    { limit, concurrency: 2 }
  );
}

function parseHtml(html, res) {
  if (
    (res && res.status === 403) ||
    /Just a moment\.\.\.|cf-browser-verification|challenge-platform/i.test(html)
  ) {
    throw new Error(
      'Cloudflare challenge (site blocks this network). Works from some residential IPs; Cheerio cannot solve CF.'
    );
  }
  const $ = cheerio.load(html);
  const items = [];
  const seen = new Set();

  // Prefer structured video-item cards
  const cards = $('.video-item, .video-list .thumb, main .js-video').toArray();
  const nodes = cards.length
    ? cards
    : $('a[href*="/video/"]').parent().toArray();

  $(nodes).each((i, el) => {
    const $el = $(el);

    const $link = $el.find('a[href*="/video/"]').first().length
      ? $el.find('a[href*="/video/"]').first()
      : $el.is('a[href*="/video/"]')
        ? $el
        : $el.find('a').first();

    const href = $link.attr('href');
    if (!href || !/\/video\//.test(href)) return;

    const videoUrl = absolutize(href, BASE);
    if (!videoUrl || seen.has(videoUrl)) return;
    seen.add(videoUrl);

    const $img = $el.find('img').first();
    const thumb =
      $img.attr('data-src') ||
      $img.attr('data-original') ||
      $img.attr('src') ||
      null;

    const title =
      $el.find('.name, .n, .title').first().text() ||
      $link.attr('title') ||
      $img.attr('alt') ||
      '';

    const duration =
      $el.find('.l, .length, .duration, .video-length').first().text() || null;

    const viewsRaw =
      $el.find('.v, .views, .stats').first().text() ||
      $el.find('[class*="view"]').first().text() ||
      null;

    items.push(
      result({
        title,
        url: videoUrl,
        thumbnail: thumb ? absolutize(thumb, BASE) : null,
        duration,
        source: SOURCE,
        views: parseViews(viewsRaw),
        studio: pickChannelText($el),
        rank: i,
      })
    );
  });

  // Broad fallback
  if (items.length === 0) {
    $('a[href*="/video/"]').each((i, el) => {
      const $a = $(el);
      const videoUrl = absolutize($a.attr('href'), BASE);
      if (!videoUrl || seen.has(videoUrl)) return;
      const $img = $a.find('img').first();
      if (!$img.length && !$a.attr('title')) return;
      seen.add(videoUrl);

      items.push(
        result({
          title: $a.attr('title') || $img.attr('alt') || $a.text(),
          url: videoUrl,
          thumbnail: absolutize(
            $img.attr('data-src') || $img.attr('src'),
            BASE
          ),
          duration: $a.parent().find('.l, .length').first().text() || null,
          source: SOURCE,
          studio: pickChannelText($a.parent()),
          rank: i,
        })
      );
    });
  }

  return items;
}

module.exports = { id: 'spankbang', name: SOURCE, search };
