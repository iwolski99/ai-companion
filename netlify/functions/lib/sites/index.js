/**
 * Site registry — add/remove scrapers here.
 * Each module exports: { id, name, search(query, opts) }
 *
 * Searches are capped to MAX_SITES concurrent sources (see search.js).
 * DEFAULT_SITE_IDS are used when the client does not pass ?sites=.
 */

const xvideos = require('./xvideos');
const xnxx = require('./xnxx');
const spankbang = require('./spankbang');
const xhamster = require('./xhamster');
const pornhub = require('./pornhub');
const youporn = require('./youporn');
const bdsmstreak = require('./bdsmstreak');

const ALL = [
  xvideos,
  xnxx,
  spankbang,
  xhamster,
  pornhub,
  youporn,
  bdsmstreak,
];

const byId = Object.fromEntries(ALL.map((s) => [s.id, s]));

/** Max sites queried in a single search request. */
const MAX_SITES = 5;

/** Default selection when the client omits ?sites= */
const DEFAULT_SITE_IDS = [
  'xvideos',
  'xnxx',
  'xhamster',
  'pornhub',
  'youporn',
];

module.exports = { ALL, byId, MAX_SITES, DEFAULT_SITE_IDS };
