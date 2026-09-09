(() => {
  const tagsEl = document.getElementById('taste-tags');
  const emptyEl = document.getElementById('taste-empty');
  const statusEl = document.getElementById('fy-status');
  const gridEl = document.getElementById('fy-grid');
  const bmEl = document.getElementById('bm-list');
  const picksEl = document.getElementById('fy-picks');
  const picksStatusEl = document.getElementById('fy-picks-status');
  const picksQueriesEl = document.getElementById('fy-picks-queries');

  const DEFAULT_SITES = ['xvideos', 'xnxx', 'xhamster', 'pornhub', 'youporn'];
  const PICK_COUNT = 12;

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatViews(n) {
    if (n == null || !Number.isFinite(n)) return null;
    if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}K`;
    return String(n);
  }

  function searchPassword() {
    try {
      return localStorage.getItem('av_search_password') || '';
    } catch {
      return '';
    }
  }

  function selectedSites() {
    try {
      const raw = localStorage.getItem('av_selected_sites') || '';
      const ids = raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 5);
      return ids.length ? ids : DEFAULT_SITES;
    } catch {
      return DEFAULT_SITES;
    }
  }

  function thumbUrl(url) {
    if (!url) return '';
    const params = new URLSearchParams({ url });
    const pw = searchPassword();
    if (pw) params.set('password', pw);
    return `/api/thumbnail?${params.toString()}`;
  }

  function gifThumb(gif) {
    if (!gif.thumbnail) return '';
    const src = String(gif.source || '').toLowerCase();
    if (src === 'redgifs' || src === 'gifreels' || gif.play === 'direct') {
      return gif.thumbnail;
    }
    return `/api/thumbnail?url=${encodeURIComponent(gif.thumbnail)}`;
  }

  const recs =
    window.BuddyPrefs.recommendationQueries?.(6) ||
    window.BuddyPrefs.topSearches(6) ||
    [];
  const fallbackTags = window.BuddyPrefs.topTags(12);
  const taste = [
    ...recs.map((s) => ({
      tag: s.tag,
      label: s.label || s.tag,
      weight: s.weight,
    })),
    ...fallbackTags.filter((t) => !recs.some((s) => s.tag === t.tag)),
  ].slice(0, 12);

  if (!taste.length) {
    emptyEl.hidden = false;
  } else {
    tagsEl.innerHTML = taste
      .map(
        (t) => `
      <span class="taste-chip">
        <span class="taste-chip-label">${escapeHtml(t.label || t.tag)}${
          t.weight ? ` · ${Math.round(t.weight)}` : ''
        }</span>
        <a href="/?q=${encodeURIComponent(t.tag)}">Tubes</a>
        <a href="/redgifs.html?q=${encodeURIComponent(t.tag)}">Gifs</a>
      </span>`
      )
      .join('');
  }

  function recScore(video, queryIndex) {
    const views = Number(video.views) || 0;
    const viewPart = Math.log10(views + 1);
    const queryBoost = queryIndex === 0 ? 1.6 : queryIndex === 1 ? 1.25 : 1;
    const rankPart = 1 / (1 + (Number(video.rank) || 0) / 18);
    return viewPart * queryBoost + rankPart * 2;
  }

  function renderTubeCards(items) {
    picksEl.innerHTML = items
      .map((item) => {
        const views = formatViews(item.views);
        const metaBits = [
          views ? `${views} views` : null,
          item.rating ? escapeHtml(item.rating) : null,
          item.uploaded ? escapeHtml(item.uploaded) : null,
        ]
          .filter(Boolean)
          .map((x) => `<span>${x}</span>`)
          .join('');
        const img = item.thumbnail
          ? `<img src="${escapeHtml(thumbUrl(item.thumbnail))}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" />`
          : `<img alt="" />`;
        const why = item._recQuery
          ? `<p class="fy-why">Because you liked ${escapeHtml(item._recQuery)}</p>`
          : '';
        return `
          <a class="card" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" data-rec-url="${escapeHtml(item.url)}">
            <div class="thumb-wrap">
              ${img}
              ${
                item.duration
                  ? `<span class="badge">${escapeHtml(item.duration)}</span>`
                  : ''
              }
              <span class="source-badge">${escapeHtml(item.source || '')}</span>
            </div>
            <div class="card-body">
              <h2 class="card-title">${escapeHtml(item.title)}</h2>
              ${why}
              ${metaBits ? `<div class="card-meta">${metaBits}</div>` : ''}
            </div>
          </a>`;
      })
      .join('');
  }

  async function searchTubes(query) {
    const params = new URLSearchParams({
      q: query,
      sites: selectedSites().join(','),
      limit: '24',
      pages: '1',
      startPage: '1',
    });
    const headers = {};
    const pw = searchPassword();
    if (pw) headers['X-Search-Password'] = pw;
    const res = await fetch(`/api/search?${params}`, { headers });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      const err = new Error('password');
      err.code = 'password';
      throw err;
    }
    if (!res.ok) {
      throw new Error(data.message || data.error || `Search failed (${res.status})`);
    }
    return Array.isArray(data.results) ? data.results : [];
  }

  async function loadTubePicks() {
    const queries = recs.slice(0, 3);
    if (!queries.length) {
      picksStatusEl.hidden = false;
      picksStatusEl.className = 'status empty';
      picksStatusEl.textContent =
        'Like a few gifs or search Tubes first — picks are built from those names.';
      return;
    }

    picksQueriesEl.innerHTML = queries
      .map(
        (q) =>
          `<a class="chip-btn is-on" href="/?q=${encodeURIComponent(q.tag)}">${escapeHtml(
            q.label || q.tag
          )} → Tubes</a>`
      )
      .join('');

    picksStatusEl.hidden = false;
    picksStatusEl.className = 'status loading';
    picksStatusEl.innerHTML =
      '<span class="spinner"></span>Finding high-view tube picks for your names…';

    try {
      const batches = await Promise.all(
        queries.map(async (q, i) => {
          const results = await searchTubes(q.tag);
          return results.map((v) => ({
            ...v,
            _recQuery: q.label || q.tag,
            _queryIndex: i,
          }));
        })
      );
      const seen = new Set();
      const merged = [];
      for (const batch of batches) {
        const ranked = batch
          .slice()
          .sort((a, b) => recScore(b, a._queryIndex) - recScore(a, a._queryIndex));
        for (const video of ranked.slice(0, 8)) {
          const key = String(video.url || '').toLowerCase();
          if (!key || seen.has(key)) continue;
          seen.add(key);
          merged.push(video);
        }
      }
      merged.sort(
        (a, b) => recScore(b, b._queryIndex) - recScore(a, a._queryIndex)
      );
      const picks = merged.slice(0, PICK_COUNT);
      if (!picks.length) {
        picksStatusEl.className = 'status empty';
        picksStatusEl.textContent = 'No tube picks yet — try a search on Tubes, then refresh.';
        return;
      }
      picksStatusEl.hidden = true;
      renderTubeCards(picks);
      picksEl.addEventListener('click', (e) => {
        const card = e.target.closest('a.card');
        if (!card) return;
        const url = card.getAttribute('href');
        const item = picks.find((r) => r.url === url);
        if (item && window.BuddyPrefs?.trackAvClick) {
          window.BuddyPrefs.trackAvClick(item);
        }
      });
    } catch (err) {
      picksStatusEl.className = 'status error';
      if (err.code === 'password') {
        picksStatusEl.innerHTML =
          'Enter the search password on <a href="/">Tubes</a> once, then come back for picks.';
      } else {
        picksStatusEl.textContent = err.message || String(err);
      }
    }
  }

  async function loadGifFeed() {
    const queries = (recs.length ? recs : fallbackTags).slice(0, 2);
    statusEl.hidden = false;
    statusEl.className = 'status loading';
    statusEl.innerHTML = '<span class="spinner"></span>Building a gif feed from your tags…';
    try {
      const batches = await Promise.all(
        (queries.length ? queries : [{ tag: '' }]).map(async (q) => {
          const params = new URLSearchParams({
            action: 'search',
            q: q.tag || '',
            source: 'redgifs',
            order: 'trending',
            page: '1',
            count: '16',
          });
          const res = await fetch(`/api/redgifs?${params}`);
          const data = await res.json();
          return data.gifs || [];
        })
      );
      const seen = new Set();
      const gifs = [];
      for (const batch of batches) {
        for (const g of batch) {
          if (!g.id || seen.has(g.id) || window.BuddyPrefs.isDisliked?.(g.id)) continue;
          seen.add(g.id);
          gifs.push(g);
        }
      }
      if (!gifs.length) {
        statusEl.className = 'status empty';
        statusEl.textContent = 'No feed yet — like a few clips on Gifs first.';
        return;
      }
      statusEl.hidden = true;
      gridEl.innerHTML = gifs
        .slice(0, 24)
        .map((g) => {
          const thumb = gifThumb(g);
          return `
        <a class="rg-card" href="${escapeHtml(g.url)}" target="_blank" rel="noopener">
          <div class="rg-thumb">
            ${
              thumb
                ? `<img src="${escapeHtml(thumb)}" alt="" loading="lazy" referrerpolicy="no-referrer" />`
                : ''
            }
          </div>
          <div class="rg-body"><p class="card-title">${escapeHtml(g.title)}</p></div>
        </a>`;
        })
        .join('');
    } catch (err) {
      statusEl.className = 'status error';
      statusEl.textContent = err.message || String(err);
    }
  }

  const bms = window.BuddyPrefs.load().bookmarks || [];
  bmEl.innerHTML = bms.length
    ? bms
        .slice(0, 40)
        .map(
          (b) =>
            `<a class="bm-row" href="${escapeHtml(b.url)}" target="_blank" rel="noopener">${escapeHtml(b.title || b.id)}</a>`
        )
        .join('')
    : '<p class="muted">No bookmarks yet.</p>';

  document.getElementById('export-bm').addEventListener('click', () => {
    window.BuddyPrefs.exportBookmarks();
  });

  loadTubePicks();
  loadGifFeed();
})();
