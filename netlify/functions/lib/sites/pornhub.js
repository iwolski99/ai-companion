/**
 * PornHub search scraper
 *
 * Search URL: https://www.pornhub.com/video/search?search={query}
 *
 * Typical result markup:
 *   li.pcVideoListItem / li.videoBox   — result cards
 *   a[href*="/view_video.php"]         — video link
 *   img[data-src], img[src]            — thumbnail (data-mediumthumb / data-src preferred)
 *   .title a / span.title              — title
 *   .duration                          — duration
 *   .views                             — views
 *   .rating / .value                   — rating %
 *
 * Note: PornHub may geo-block or challenge some datacenter IPs.
 * Failures are reported per-site without breaking the whole search.
 */

const cheerio = require('cheerio');
const { fetchHtml, absolutize, result, parseViews } = require('../http');

const SOURCE = 'PornHub';
const BASE = 'https://www.pornhub.com';

async function search(query, { limit = 24 } = {}) {
  const url = `${BASE}/video/search?search=${encodeURIComponent(query)}`;
  const { ok, status, html } = await fetchHtml(url, {
    timeoutMs: 7500,
    referer: BASE + '/',
    headers: {
      Cookie: 'accessAgeDisclaimerPH=1; platform=pc',
    },
  });

  if (!ok) {
    throw new Error(`HTTP ${status}`);
  }

  // Soft detect age-gate / challenge pages
  if (/Access Denied|cf-browser-verification|Just a moment/i.test(html) && !/pcVideoListItem|view_video\.php/i.test(html)) {
    throw new Error('Blocked or age-gated by site');
  }

  const $ = cheerio.load(html);
  const items = [];
  const seen = new Set();

  $('li.pcVideoListItem, li.videoBox, ul.videos li, .videoPreviewBg').each(
    (i, el) => {
      if (items.length >= limit) return false;
      const $el = $(el);

      const $link = $el.find('a[href*="view_video.php"]').first();
      const href = $link.attr('href');
      if (!href) return;

      const videoUrl = absolutize(href, BASE);
      if (!videoUrl || seen.has(videoUrl)) return;
      seen.add(videoUrl);

      const $img = $el.find('img').first();
      const thumb =
        $img.attr('data-mediumthumb') ||
        $img.attr('data-src') ||
        $img.attr('data-thumb_url') ||
        $img.attr('src') ||
        null;

      const title =
        $el.find('.title a, span.title a, a.gtm-event-thumb').first().text() ||
        $link.attr('title') ||
        $img.attr('alt') ||
        '';

      const duration =
        $el.find('.duration, var.duration').first().text() || null;

      const viewsRaw =
        $el.find('.views var, .views').first().text() || null;

      const rating =
        $el.find('.rating-container .value, .rating .value').first().text() ||
        null;

      items.push(
        result({
          title,
          url: videoUrl.split('&pkey')[0],
          thumbnail: thumb && !String(thumb).startsWith('data:')
            ? absolutize(thumb, BASE)
            : null,
          duration,
          source: SOURCE,
          views: parseViews(viewsRaw),
          rating: rating ? rating.trim() : null,
          rank: i,
        })
      );
    }
  );

  if (items.length === 0) {
    $('a[href*="view_video.php"]').each((i, el) => {
      if (items.length >= limit) return false;
      const $a = $(el);
      const videoUrl = absolutize($a.attr('href'), BASE);
      if (!videoUrl || seen.has(videoUrl)) return;
      const $img = $a.find('img').first();
      if (!$img.length) return;
      seen.add(videoUrl);

      items.push(
        result({
          title: $a.attr('title') || $img.attr('alt') || '',
          url: videoUrl.split('&pkey')[0],
          thumbnail: absolutize(
            $img.attr('data-src') ||
              $img.attr('data-mediumthumb') ||
              $img.attr('src'),
            BASE
          ),
          duration: $a.parent().find('.duration').text() || null,
          source: SOURCE,
          rank: i,
        })
      );
    });
  }

  return items;
}

module.exports = { id: 'pornhub', name: SOURCE, search };
