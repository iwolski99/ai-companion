/**
 * Straight-only content filter.
 * Used by AV Search and RedGifs so gay / bi / trans results stay out.
 *
 * RedGifs exposes `sexuality` as an array (e.g. ["straight"], ["trans"],
 * ["straight","trans"]). Presence of "straight" is NOT enough — trans can
 * be listed alongside it. We deny any non-straight sexuality value.
 *
 * Word-boundary matching avoids false hits like "bikini", "big", "rabbit".
 * Do not match bare "ts" in a blob — it hits "tits".
 */

const SEX_DENY = new Set([
  'trans',
  'gay',
  'bisexual',
  'bi',
  'lesbian',
  'homo',
  'homosexual',
]);

const TAG_DENY = new Set(
  [
    'gay',
    'gays',
    'gay porn',
    'homosexual',
    'twink',
    'twinks',
    'yaoi',
    'bara',
    'mlm',
    'bisexual',
    'bisexuals',
    'bisex',
    'lesbian',
    'lesbians',
    'trans',
    'transgender',
    'transsexual',
    'transsexuals',
    'trans woman',
    'trans women',
    'trans man',
    'trans men',
    'trans girl',
    'trans girls',
    'trans boy',
    'trans boys',
    'transgirl',
    'transgirls',
    'transwoman',
    'transwomen',
    'shemale',
    'shemales',
    'ladyboy',
    'ladyboys',
    't-girl',
    't-girls',
    'tgirl',
    'tgirls',
    'femboy',
    'femboys',
    'futanari',
    'futa',
    'dickgirl',
    'dickgirls',
    'trap',
    'traps',
    'ftm',
    'mtf',
    'crossdresser',
    'crossdress',
    'crossdressing',
    'newhalf',
    'transvestite',
    'tranny',
    'shemale porn',
    'trans porn',
  ].map((s) => s.toLowerCase())
);

const EXCLUDE_RE = new RegExp(
  [
    '\\bgays?\\b',
    '\\bgay[-_ ]?porn\\b',
    '\\bhomosexuals?\\b',
    '\\btwinks?\\b',
    '\\byaoi\\b',
    '\\bbara\\b',
    '\\bmlm\\b',
    '\\bmen[-_ ]fucking[-_ ]men\\b',
    '\\bbisexuals?\\b',
    '\\bbisex(?:ual)?\\b',
    '\\bbi[-_ ](curious|sexual|guy|male|men)\\b',
    '\\blesbians?\\b',
    '\\btrans(?:gender|sexual|woman|women|man|men|girl|girls|boy|boys)?\\b',
    '\\btrans[-_ ](?:girl|girls|woman|women|man|men|boy|boys|porn)\\b',
    '\\bshemales?\\b',
    '\\bladyboys?\\b',
    '\\bt-girls?\\b',
    '\\btgirls?\\b',
    '\\bfemboys?\\b',
    '\\bfutanari\\b',
    '\\bfuta\\b',
    '\\bdickgirls?\\b',
    '\\bcrossdress(?:er|ing)?\\b',
    '\\bnewhalf\\b',
    '\\btranny\\b',
    '\\bftm\\b',
    '\\bmtf\\b',
  ].join('|'),
  'i'
);

function normTag(tag) {
  return String(tag || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function isStraightText(raw) {
  if (!raw) return true;
  return !EXCLUDE_RE.test(String(raw));
}

function tagsAreStraight(tags) {
  if (!Array.isArray(tags)) return true;
  for (const tag of tags) {
    const n = normTag(tag);
    if (!n) continue;
    if (TAG_DENY.has(n)) return false;
    if (!isStraightText(n)) return false;
  }
  return true;
}

function sexualityIsStraight(sexuality) {
  const list = Array.isArray(sexuality)
    ? sexuality.map((s) => String(s).toLowerCase().trim()).filter(Boolean)
    : [];
  if (!list.length) return true; // unknown — fall through to tag filter
  if (list.some((s) => SEX_DENY.has(s))) return false;
  // Keep only cis-straight. "name" is a RedGifs junk value — ignore it.
  const meaningful = list.filter((s) => s !== 'name');
  if (!meaningful.length) return true;
  return meaningful.length === 1 && meaningful[0] === 'straight';
}

function isStraightVideo(item) {
  if (!item) return false;
  const blob = [item.title, item.url, item.source].filter(Boolean).join(' ');
  return isStraightText(blob);
}

function isStraightGif(gif) {
  if (!gif) return false;
  if (!sexualityIsStraight(gif.sexuality)) return false;
  if (!tagsAreStraight(gif.tags)) return false;
  if (Array.isArray(gif.niches) && !tagsAreStraight(gif.niches)) return false;
  const blob = [gif.id, gif.title, gif.userName, gif.description]
    .filter(Boolean)
    .join(' ');
  return isStraightText(blob);
}

function isBlockedQuery(q) {
  if (!q) return false;
  const n = normTag(q);
  if (TAG_DENY.has(n)) return true;
  return !isStraightText(n);
}

module.exports = {
  EXCLUDE_RE,
  isStraightText,
  isStraightVideo,
  isStraightGif,
  isBlockedQuery,
  sexualityIsStraight,
  tagsAreStraight,
};
