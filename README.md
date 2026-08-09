# AV Search — Personal Multi-Site Video Search (Netlify)

A private, personal-use search UI that queries adult video sites in parallel via a single Netlify Function (max **5 sites per search**). Included scrapers: **XVideos**, **XNXX**, **SpankBang**, **xHamster**, **PornHub**, **YouPorn**, and **BDSMStreak**. No official APIs — HTML search pages are fetched and parsed with Cheerio.

> For personal use only. Be polite to upstream sites (realistic User-Agent, one page per site per query, short timeouts). Do not hammer or republish scraped content.

## Project layout

```
.
├── netlify.toml                 # publish dir, functions, redirects
├── package.json
├── .env.example                 # optional password + cache TTL
├── public/                      # static frontend
│   ├── index.html
│   ├── styles.css
│   └── app.js
└── netlify/functions/
    ├── search.js                # main parallel search endpoint
    ├── thumbnail.js             # optional thumbnail proxy
    └── lib/
        ├── http.js              # fetch helpers + normalization
        ├── cache.js             # in-memory + Netlify Blobs cache
        ├── auth.js              # optional SITE_PASSWORD gate
        └── sites/               # one scraper module per site
            ├── index.js
            ├── xvideos.js
            ├── xnxx.js
            ├── spankbang.js
            ├── xhamster.js
            └── pornhub.js
```

## Quick start (local)

1. Install the [Netlify CLI](https://docs.netlify.com/cli/get-started/) (or use the project devDependency):

```bash
npm install
npx netlify login   # once
npx netlify dev
```

2. Open the URL Netlify prints (usually `http://localhost:8888`).
3. Search from the UI. The frontend calls `/api/search`, which redirects to `/.netlify/functions/search`.

### Optional local env

Copy `.env.example` to `.env` in this folder:

```bash
cp .env.example .env
```

| Variable | Purpose |
|---|---|
| `SITE_PASSWORD` | If set, search/thumbnail require this password (`X-Search-Password` header or `?password=`) |
| `CACHE_TTL_SECONDS` | Cache window for identical queries (default `180` = 3 minutes) |

## Deploy to Netlify

### Option A — Netlify UI

1. In Netlify: **Add new site → Import an existing project** (this repo).
2. Leave **Base directory** empty — the app lives at the repo root.
3. Confirm:
   - **Publish directory**: `public`
   - **Functions directory**: `netlify/functions`
   - Build command: `npm install` (already in `netlify.toml`)
4. (Optional) Site settings → Environment variables:
   - `SITE_PASSWORD` — private gate
   - `CACHE_TTL_SECONDS` — e.g. `180`
5. Deploy. Your site serves the SPA; `/api/search` and `/api/thumbnail` hit Functions.

### Option B — CLI

```bash
npm install
npx netlify deploy --prod
```

Follow prompts to link a site. Ensure publish dir is `public` and functions dir is `netlify/functions`.

## API

### `GET /api/search?q=query`

| Param | Description |
|---|---|
| `q` / `query` | Search string (required) |
| `sites` | Comma-separated ids (max **5**): `xvideos,xnxx,spankbang,xhamster,pornhub,youporn,bdsmstreak` |
| `limit` | Per-site cap (default 20, max 40) |
| `password` | Required when `SITE_PASSWORD` is set |
| `nocache` | `1` to bypass cache |

**Response shape**

```json
{
  "query": "example",
  "cached": false,
  "tookMs": 3200,
  "count": 80,
  "results": [
    {
      "title": "...",
      "url": "https://...",
      "thumbnail": "https://...",
      "duration": "12:34",
      "source": "XVideos",
      "views": 12345,
      "rating": null,
      "uploaded": null,
      "rank": 0
    }
  ],
  "meta": {
    "sites": {
      "xvideos": { "ok": true, "name": "XVideos", "count": 20 },
      "pornhub": { "ok": false, "name": "PornHub", "count": 0, "error": "HTTP 403" }
    }
  }
}
```

Sites are fetched with `Promise.allSettled` — one failure returns partial results plus per-site error notes.

### `GET /api/thumbnail?url=...`

Proxies an image when a CDN blocks hotlinking. Enable **Proxy thumbnails** in the UI filters.

## Frontend features

- Dark OLED-friendly UI, mobile-first layout, large tap targets
- Source filters, sort (relevance / source / duration / views)
- Loading, empty, and error states
- Lazy-loaded thumbnails; cards open the original video page in a new tab
- Optional password field (stored in `localStorage` on the device)

## Updating scrapers

Each file under `netlify/functions/lib/sites/` documents the CSS selectors it relies on. When a site redesigns:

1. Open the site’s public search page in a browser.
2. Inspect a result card and update the selectors/comments in that site’s module.
3. Redeploy. No frontend change needed.

To add a site: create a module exporting `{ id, name, search }`, then register it in `lib/sites/index.js`.

## Notes & limits

- Netlify free-tier function time is limited — scrapers use ~7s timeouts and run in parallel; aim for &lt; 8–9s total when upstreams are healthy.
- Some hosts may block or age-gate datacenter IPs:
  - **SpankBang** often returns a Cloudflare challenge from Netlify / cloud IPs. The scraper stays enabled and succeeds when the network is allowed; otherwise you’ll see a clear error in `meta.sites.spankbang`.
  - **PornHub** may occasionally age-gate or challenge; failures are reported per-site without breaking the whole search.
- Cache uses in-memory Map on warm instances and Netlify Blobs when available.
- This project does not store, host, or re-encode video files — it only links to public pages.

## License

Private / personal use. You are responsible for complying with upstream terms and local laws.
