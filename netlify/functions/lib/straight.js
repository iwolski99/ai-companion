/**
 * Straight-only content filter.
 * Used by AV Search and RedGifs so gay / bi / trans-male results stay out.
 *
 * Word-boundary matching avoids false hits like "bikini", "big", "rabbit".
 */

const EXCLUDE_RE = new RegExp(
  [
    '\\bgays?\\b',
    '\\bgay[-_]?porn\\b',
    '\\bhomosexuals?\\b',
    '\\btwinks?\\b',
    '\\byaoi\\b',
    '\\bbara\\b',
    '\\bmlm\\b',
    '\\bmen[-_ ]fucking[-_ ]men\\b',
    '\\bbisexuals?\\b',
    '\\bbisex(?:ual)?\\b',
    '\\bbi[-_ ](curious|sexual|guy|male|men)\\b',
    '\\btrans(?:gender|woman|women|man|men|girl|girls|boy|boys)?\\b',
    '\\bshemales?\\b',
    '\\bladyboys?\\b',
    '\\bt-?girls?\\b',
    '\\bfemboys?\\b',
    '\\bfutanari\\b',
    '\\bfuta\\b',
    '\\bdickgirls?\\b',
    '\\btraps?\\b',
    '\\bftm\\b',
    '\\bmtf\\b',
  ].join('|'),
  'i'
);

function isStraightText(raw) {
  if (!raw) return true;
  return !EXCLUDE_RE.test(String(raw));
}

function isStraightVideo(item) {
  if (!item) return false;
  const blob = [item.title, item.url, item.source].filter(Boolean).join(' ');
  return isStraightText(blob);
}

function isStraightGif(gif) {
  if (!gif) return false;
  const tags = Array.isArray(gif.tags) ? gif.tags.join(' ') : '';
  const blob = [gif.id, gif.title, gif.userName, tags].filter(Boolean).join(' ');
  return isStraightText(blob);
}

module.exports = { EXCLUDE_RE, isStraightText, isStraightVideo, isStraightGif };
