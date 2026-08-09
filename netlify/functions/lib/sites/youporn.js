/**
 * YouPorn search scraper
 *
 * Search URL: https://www.youporn.com/search/?query={query}
 *
 * Typical result markup:
 *   article.video-box[data-video-id]     — each result card
 *   a.video-box-image[href*="/watch/"]  — video page
 *   img.thumb-image[data-src]           — thumbnail (src is often a tiny placeholder)
 *   a.video-title-text span             — title
 *   .video-duration                     — e.g. "09:30"
 *   .info-views-container               — contains "Views: 1.7M" and "Rating: 80%"
 */

const cheerio = require('cheerio');
const { fetchHtml, absolutize, result, parseViews } = require('../http');

const SOURCE = 'YouPorn';
const BASE = 'https://www.youporn.com';

async function search(query, { limit = 24 } = {}) {
  const url = `${BASE}/search/?query=${encodeURIComponent(query)}`;
  const { ok, status, html } = await fetchHtml(url, {
    timeoutMs: 7000,
    referer: BASE + '/',
    headers: {
      Cookie: 'age_verified=1; age_gate=1; platform=pc',
    },
  });

  if (!ok) {
    throw new Error(`HTTP ${status}`);
  }

  if (/Just a moment|cf-browser-verification/i.test(html) && !/video-box/i.test(html)) {
    throw new Error('Cloudflare challenge / blocked');
  }

  const $ = cheerio.load(html);
  const items = [];
  const seen = new Set();

  $('article.video-box, .video-box[data-video-id]').each((i, el) => {
    if (items.length >= limit) return false;
    const $el = $(el);

    const $link = $el.find('a[href*="/watch/"]').first();
    const href = $link.attr('href');
    if (!href) return;

    const videoUrl = absolutize(href, BASE);
    if (!videoUrl || seen.has(videoUrl)) return;
    seen.add(videoUrl);

    const $img = $el.find('img.thumb-image, img').first();
    const thumb =
      $img.attr('data-src') ||
      $img.attr('data-poster') ||
      (!$img.attr('src')?.startsWith('data:') ? $img.attr('src') : null);

    const title =
      $el.find('a.video-title-text span, .video-title-text').first().text() ||
      $el.attr('aria-label') ||
      $img.attr('alt') ||
      '';

    const duration =
      $el.find('.video-duration, .tm_video_duration').first().text() || null;

    const infoText = $el.find('.info-views-container, .video-views').text() || '';
    const viewsMatch = infoText.match(/Views?:\s*([\d.,]+\s*[kmb]?)/i);
    const ratingMatch = infoText.match(/Rating:\s*(\d{1,3}%)/i);

    items.push(
      result({
        title,
        url: videoUrl.replace(/\/$/, '') + '/',
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

module.exports = { id: 'youporn', name: SOURCE, search };
