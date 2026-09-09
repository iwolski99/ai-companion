# Buddy — personal adult goon app (Netlify)

Private, personal-use web app: multi-site **tube search**, **RedGifs** discovery, local preference learning, and a simple orgasm **calendar**. Everything is straight-only (gay / bi / trans-coded results are filtered out).

> Personal use only. Be polite to upstream sites. Do not republish scraped content.

## What’s here

| Page | What it does |
|---|---|
| `/` Tubes | Existing AV Search across XVideos, XNXX, SpankBang, xHamster, PornHub, YouPorn, BDSMStreak (max 5 sites per query) |
| `/redgifs.html` | RedGifs tag search, chips, infinite grid, iframe player, likes / bookmarks / skips |
| `/foryou.html` | Ranked feed from tags you’ve reinforced + bookmark export |
| `/calendar.html` | Local orgasm log by day |

Preference learning is **on-device** (`localStorage`). Likes, bookmarks, skips, tube clicks, and calendar entries never leave the browser unless you export JSON.

## Straight-only

Both Tubes and RedGifs drop gay / bi / trans-coded titles and tags (word-boundary matching so “bikini” / “big” are kept). RedGifs filtering also inspects GIF tags from the API.

## RedGifs

Serverless proxy at `/api/redgifs` (Netlify Function):

1. Obtains a short-lived guest token from `GET https://api.redgifs.com/v2/auth/temporary` (cached ~20 minutes on the function instance).
2. Proxies search: `GET /v2/gifs/search?type=g&tags=…&order=trending|top|latest`
3. Proxies tag lists for the chip row.

No RedGifs API key / env vars required. Thumbnails and embeds come from RedGifs CDN / `https://www.redgifs.com/ifr/{id}`.

## Future: LLM scene recs

Yes — that’s a natural next step. The local store already has:

- weighted tags
- liked / bookmarked RedGifs
- tube click history
- calendar logs

A later function can send a **summary of those tags** (not raw video files) to an LLM and return suggested tube queries or RedGifs tags. Nothing in the current deploy calls an LLM.

## Deploy

Same as before: publish `public`, functions `netlify/functions`. Optional env:

| Variable | Purpose |
|---|---|
| `SITE_PASSWORD` | Gate search / thumbnail / redgifs |
| `CACHE_TTL_SECONDS` | AV Search cache TTL (default 180) |

```bash
npm install
npx netlify dev
```

## Layout

```
public/
  index.html          Tubes (AV Search)
  redgifs.html
  foryou.html
  calendar.html
  prefs.js            shared local store
netlify/functions/
  search.js
  redgifs.js
  thumbnail.js
  lib/straight.js     shared orientation filter
```
