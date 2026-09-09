/**
 * PornHub GIF search — looping mp4/webm clips (often with audio on the mp4).
 * Search: https://www.pornhub.com/gifs/search?search={q}&page={n}
 */

const cheerio = require('cheerio');
const { fetchHtml, absolutize } = require('../http');
const { isStraightText } = require('../straight');

const BASE = 'https://www.pornhub.com';

async function search(query, page = 1) {
  const q = encodeURIComponent(query || 'amateur');
  const n = Math.max(1, Number(page) || 1);
  const url =
    n === 1
      ? `${BASE}/gifs/search?search=${q}`
      : `${BASE}/gifs/search?search=${q}&page=${n}`;
  const res = await fetchHtml(url, {
    referer: BASE + '/',
    headers: { Cookie: 'accessAgeDisclaimerPH=1; platform=pc' },
    timeoutMs: 9000,
  });
  if (!res.ok) throw new Error(`PornHub GIFs HTTP ${res.status}`);
  if (
    /Access Denied|cf-browser-verification|Just a moment/i.test(res.html) &&
    !/gifVideoBlock|\/gif\//i.test(res.html)
  ) {
    throw new Error('PornHub GIFs blocked or age-gated');
  }

  const $ = cheerio.load(res.html);
  const items = [];
  const seen = new Set();

  $('li.gifVideoBlock, li.js-gifVideoBlock').each((_, el) => {
    const $el = $(el);
    const $link = $el.find('a[href*="/gif/"]').first();
    const href = $link.attr('href');
    if (!href) return;
    const abs = absolutize(href, BASE);
    if (!abs || seen.has(abs)) return;

    const $video = $el.find('video').first();
    const mp4 = $video.attr('data-mp4') || $video.attr('data-src') || null;
    const webm = $video.attr('data-webm') || null;
    if (!mp4 && !webm) return;

    const idMatch = abs.match(/\/gif\/(\d+)/);
    const id = idMatch ? idMatch[1] : abs.split('/').pop();
    const title =
      ($el.find('span.title, .title').first().text() || '').trim() ||
      $link.attr('title') ||
      `GIF ${id}`;
    if (!isStraightText(title)) return;

    seen.add(abs);
    const thumb =
      $video.attr('data-poster') ||
      $el.find('img').attr('data-src') ||
      $el.find('img').attr('src') ||
      null;

    items.push({
      id: `phgif-${id}`,
      title,
      tags: [title].filter(Boolean),
      url: abs,
      embed: abs,
      hd: mp4 || webm,
      sd: mp4 || webm,
      thumbnail: thumb && !String(thumb).startsWith('data:') ? thumb : null,
      duration: null,
      source: 'PornHub',
      hasAudio: true,
      play: 'proxy',
    });
  });

  return items;
}

module.exports = { search };
