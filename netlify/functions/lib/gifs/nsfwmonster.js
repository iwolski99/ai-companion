/**
 * NSFWMonster (same stack as Hardgif) — Reddit-hosted looping clips.
 * Cards come from /backend.php with v.redd.it mp4 sources.
 */

const cheerio = require('cheerio');
const { fetchHtml } = require('../http');
const { isStraightText } = require('../straight');

const BASE = 'https://nsfwmonster.com';

function firstVideoSrc($video) {
  const sources = $video.find('source');
  for (let i = 0; i < sources.length; i++) {
    const el = sources.eq(i);
    const src = el.attr('data-src') || el.attr('src');
    if (src && /\.(mp4|webm)(\?|$)/i.test(src)) return src;
  }
  return $video.attr('data-src') || null;
}

async function search(query, page = 1) {
  const q = encodeURIComponent(query || 'amateur');
  const p = Math.max(1, Number(page) || 1);
  const url = `${BASE}/backend.php?p=${p}&device=pc&r=&sort=&period=&content=videos&sourced=0&search=${q}`;
  const res = await fetchHtml(url, {
    referer: `${BASE}/search/${query || 'amateur'}`,
    headers: {
      Cookie: 'age_ok=1; age_verified=1; agego_verified=1',
      'X-Requested-With': 'XMLHttpRequest',
    },
    timeoutMs: 9000,
  });
  if (!res.ok) throw new Error(`NSFWMonster HTTP ${res.status}`);

  const $ = cheerio.load(res.html);
  const items = [];
  const seen = new Set();

  $('.item, .card').each((_, el) => {
    const $el = $(el);
    const $video = $el.find('video').first();
    if (!$video.length) return;
    const src = firstVideoSrc($video);
    if (!src) return;

    const postId =
      $video.attr('data-post-id') ||
      $el.attr('data-post-id') ||
      ($el.find('a.video_href').attr('href') || '').split('/').pop();
    if (!postId || seen.has(postId)) return;

    const title =
      ($video.attr('data-title') || $video.attr('title') || $el.find('.title').text() || '').trim() ||
      `Clip ${postId}`;
    if (!isStraightText(title)) return;

    seen.add(postId);
    const thumb = $video.attr('data-poster') || $video.attr('poster') || null;
    const watch = `${BASE}/post/${postId}`;
    items.push({
      id: `nsfwmonster-${postId}`,
      title,
      tags: [],
      url: watch,
      embed: watch,
      hd: src,
      sd: src,
      thumbnail: thumb && !String(thumb).startsWith('data:') && thumb !== '/pic/p.png' ? thumb : null,
      duration: null,
      source: 'NSFWMonster',
      hasAudio: /CMAF|AUDIO/i.test(src),
      play: 'proxy',
    });
  });

  return items;
}

module.exports = { search };
