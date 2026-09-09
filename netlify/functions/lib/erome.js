/**
 * Erome search — albums with video, used as a RedGifs alternative.
 * Playback stays on Erome's page (iframe) so their CDN allows audio.
 */

const cheerio = require('cheerio');
const { fetchHtml, absolutize } = require('./http');
const { isStraightText } = require('./straight');

const BASE = 'https://www.erome.com';

async function search(query, page = 1) {
  const q = encodeURIComponent(query || 'amateur');
  const url =
    page > 1
      ? `${BASE}/search?q=${q}&page=${page}`
      : `${BASE}/search?q=${q}`;
  const res = await fetchHtml(url, { referer: BASE + '/' });
  if (!res.ok) throw new Error(`Erome HTTP ${res.status}`);

  const $ = cheerio.load(res.html);
  const albums = [];
  const seen = new Set();

  $('.album').each((_, el) => {
    const $el = $(el);
    if (!$el.find('.album-videos').length) return;

    const href = $el.find('a.album-link').attr('href');
    const title = ($el.find('a.album-title').text() || '').trim();
    if (!href || !title) return;
    if (!isStraightText(title)) return;

    const abs = absolutize(href, BASE);
    if (!abs || seen.has(abs)) return;
    seen.add(abs);

    const $img = $el.find('img.album-thumbnail.active').first().length
      ? $el.find('img.album-thumbnail.active').first()
      : $el.find('img.album-thumbnail').first();
    const thumb =
      $img.attr('src') ||
      $img.attr('data-rotate-src') ||
      null;

    const id = abs.split('/').filter(Boolean).pop();
    albums.push({
      id: `erome-${id}`,
      title,
      tags: [],
      url: abs,
      embed: abs,
      thumbnail: thumb && !String(thumb).startsWith('data:') ? thumb : null,
      source: 'Erome',
      hasAudio: true,
      play: 'iframe',
    });
  });

  return albums;
}

module.exports = { search };
