# GoonHub — personal adult goon app (Netlify)

Private, personal-use web app: multi-site **tube search**, **RedGifs** discovery, local preference learning, and a simple orgasm **calendar**. Everything is straight-only (gay / bi / trans-coded results are filtered out).

> Personal use only. Be polite to upstream sites. Do not republish scraped content.

## What’s here

| Page | What it does |
|---|---|
| `/` Tubes | Existing AV Search across XVideos, XNXX, SpankBang, xHamster, PornHub, YouPorn, BDSMStreak (max 5 sites per query) |
| `/redgifs.html` | RedGifs tag search, chips, infinite grid, native player, likes / bookmarks |
| `/tease.html` | Strip tease / JOI / clothed tease gifs and tubes |
| `/foryou.html` | Ranked tube + gif picks from likes, searches, and seeded tastes |
| `/bookmarks.html` | Saved clips as autoplaying gif cards |
| `/chat.html` | Horny goon buddy via DeepSeek V4 Flash (DeepSeek API or OpenRouter) |
| `/calendar.html` | Local orgasm log by day |

Preference learning is **on-device** (`localStorage`) and, when you unlock with a profile key, **synced** through `/api/vault` so your phone and desktop share likes, chats, and recommendations. The key is not baked into the site — visitors without it see a lock screen.

A new Netlify site has its own empty blob store. The same profile key does **not** copy likes from an old account. If the old URL is still live, unlock with **Restore from old site** (or **Profile → From old site**). Otherwise export `buddy-profile.json` from a browser that still has the old origin, then import that file. For You also has a **Seed tastes** box if you only remember names and tags.

## Straight-only

Tubes and RedGifs keep cis-straight / M/F results only:

- RedGifs `sexuality` must be straight. Clips tagged `trans`, `gay`, `bisexual`, or `lesbian` (including `["straight","trans"]`) are dropped.
- Titles and tags are scanned for trans / gay / bi wording (`Trans girls`, `shemale`, etc.).
- Those queries return an empty list instead of mixed results.

## Chat (DeepSeek V4 Flash)

`POST /api/buddy` talks to **DeepSeek V4 Flash**.

Set **one** of these in Netlify → Environment variables:

| Variable | Purpose |
|---|---|
| `DEEPSEEK_API_KEY` | Official DeepSeek API (`https://api.deepseek.com`, model `deepseek-v4-flash`) |
| `OPENROUTER_API_KEY` | OpenRouter (`deepseek/deepseek-v4-flash-0731`) |
| `LLM_PROVIDER` | Optional: `deepseek` or `openrouter` (default: DeepSeek if both keys exist) |
| `LLM_MODEL` | Optional model override |

The buddy prompt is straight-only, filthy, and uses your liked tags as context. No key → Chat shows a config error.

## RedGifs

Serverless proxy at `/api/redgifs` (Netlify Function):

1. Obtains a short-lived guest token from `GET https://api.redgifs.com/v2/auth/temporary` (cached ~20 minutes on the function instance).
2. Proxies search: `GET /v2/gifs/search?type=g&tags=…&order=trending|top|latest`
3. Proxies tag lists for the chip row.

No RedGifs API key / env vars required. Thumbnails and embeds come from RedGifs CDN / `https://www.redgifs.com/ifr/{id}`.

## Deploy

Same as before: publish `public`, functions `netlify/functions`. Optional env:

| Variable | Purpose |
|---|---|
| `SITE_PASSWORD` | Gate search / thumbnail / redgifs / buddy |
| `PROFILE_PIN` | Optional hard lock. If set, only that key works. If unset, the first key you save a profile with becomes the only key. |
| `VAULT_SALT` | Optional extra salt for storing the vault (default is fine) |
| `CACHE_TTL_SECONDS` | AV Search cache TTL (default 180) |
| `DEEPSEEK_API_KEY` / `OPENROUTER_API_KEY` | Buddy chat |

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
  chat.html
  calendar.html
  prefs.js            shared local store
netlify/functions/
  search.js
  redgifs.js
  buddy.js
  thumbnail.js
  lib/straight.js     shared orientation filter
```
