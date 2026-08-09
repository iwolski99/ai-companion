/**
 * Site registry — add/remove scrapers here.
 * Each module exports: { id, name, search(query, opts) }
 */

const xvideos = require('./xvideos');
const xnxx = require('./xnxx');
const spankbang = require('./spankbang');
const xhamster = require('./xhamster');
const pornhub = require('./pornhub');

const ALL = [xvideos, xnxx, spankbang, xhamster, pornhub];

const byId = Object.fromEntries(ALL.map((s) => [s.id, s]));

module.exports = { ALL, byId };
