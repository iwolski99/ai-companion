(() => {
  const tagsEl = document.getElementById('taste-tags');
  const emptyEl = document.getElementById('taste-empty');
  const statusEl = document.getElementById('fy-status');
  const gridEl = document.getElementById('fy-grid');
  const picksEl = document.getElementById('fy-picks');
  const picksStatusEl = document.getElementById('fy-picks-status');
  const picksQueriesEl = document.getElementById('fy-picks-queries');
  const chipsToggle = document.getElementById('fy-toggle-chips');
  const modal = document.getElementById('rg-modal');
  const video = document.getElementById('rg-video');
  const iframe = document.getElementById('rg-iframe');
  const likeBtnEl = document.getElementById('rg-like');
  const saveBtnEl = document.getElementById('rg-save');
  const dislikeBtnEl = document.getElementById('rg-dislike');
  const openExt = document.getElementById('rg-open-ext');

  const DEFAULT_SITES = ['xvideos', 'xnxx', 'xhamster', 'pornhub', 'youporn'];
  const FALLBACKS = ['pawg', 'amateur', 'blonde', 'milf', 'onlyfans', 'creampie'];
  const MIX_TAGS = 6;
  const PER_TAG = 4;
  const CHIPS_KEY = 'buddy_fy_hide_chips';
  const gifCache = new Map();
  let currentGifId = '';
  let watchUrl = '';
  const moreTubesBtn = document.getElementById('fy-more-tubes');
  const moreGifsBtn = document.getElementById('fy-more-gifs');
  const tubeSentinel = document.getElementById('fy-tube-sentinel');
  const gifSentinel = document.getElementById('fy-gif-sentinel');

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
      const picked = ids.length ? ids : DEFAULT_SITES;
      return window.BuddySettings?.filterTubeSites
        ? window.BuddySettings.filterTubeSites(picked)
        : picked;
    } catch {
      return window.BuddySettings?.filterTubeSites
        ? window.BuddySettings.filterTubeSites(DEFAULT_SITES)
        : DEFAULT_SITES;
    }
  }

  function chipsHidden() {
    try {
      return localStorage.getItem(CHIPS_KEY) === '1';
    } catch {
      return false;
    }
  }

  function applyChipsHidden(hidden) {
    document.body.classList.toggle('fy-chips-hidden', hidden);
    if (chipsToggle) {
      chipsToggle.textContent = hidden ? 'Show chips' : 'Hide chips';
      chipsToggle.setAttribute('aria-pressed', hidden ? 'true' : 'false');
    }
    try {
      localStorage.setItem(CHIPS_KEY, hidden ? '1' : '0');
    } catch {
      /* ignore */
    }
  }

  applyChipsHidden(chipsHidden());
  chipsToggle?.addEventListener('click', () => {
    applyChipsHidden(!document.body.classList.contains('fy-chips-hidden'));
  });

  function applyFyOrder() {
    const tubes = document.getElementById('fy-tubes-panel');
    const gifs = document.getElementById('fy-gifs-panel');
    if (!tubes || !gifs || !tubes.parentElement) return;
    if (window.BuddySettings?.fyGifsFirst?.()) {
      tubes.parentElement.insertBefore(gifs, tubes);
    } else {
      tubes.parentElement.insertBefore(tubes, gifs);
    }
  }
  applyFyOrder();
  window.addEventListener('buddy-settings', applyFyOrder);

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

  function mediaSrc(gif) {
    const url = gif.sd || gif.hd;
    if (!url) return '';
    if (gif.play === 'direct') return url;
    return `/api/gifmedia?url=${encodeURIComponent(url)}`;
  }

  function shuffle(items) {
    const a = (items || []).slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[j], a[i]] = [a[i], a[j]];
    }
    return a;
  }

  function usableVideo(item) {
    const title = String(item?.title || '').trim();
    return Boolean(
      item &&
        item.url &&
        item.thumbnail &&
        title &&
        !/^untitled$/i.test(title)
    );
  }

  function tastePool() {
    const recs =
      window.BuddyPrefs.recommendationQueries?.(16) ||
      window.BuddyPrefs.topSearches(16) ||
      [];
    const tags = window.BuddyPrefs.topTags(16) || [];
    const seen = new Set();
    const pool = [];
    for (const x of [...recs, ...tags]) {
      const tag = String(x.tag || '').trim();
      const key = tag.toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      pool.push({
        tag,
        label: x.label || tag,
        kind: x.kind,
        weight: x.weight,
      });
    }
    for (const tag of FALLBACKS) {
      if (seen.has(tag)) continue;
      seen.add(tag);
      pool.push({ tag, label: tag, kind: 'search' });
    }
    return shuffle(pool);
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
      kind: s.kind,
    })),
    ...fallbackTags.filter((t) => !recs.some((s) => s.tag === t.tag)),
  ].slice(0, 12);

  if (!taste.length) {
    emptyEl.hidden = false;
  } else {
    tagsEl.innerHTML = taste
      .map((t) => {
        const kind =
          t.kind === 'studio' ? ' · studio' : t.kind === 'performer' ? '' : '';
        return `
      <span class="taste-chip">
        <span class="taste-chip-label">${escapeHtml(t.label || t.tag)}${escapeHtml(
          kind
        )}${t.weight ? ` · ${Math.round(t.weight)}` : ''}</span>
        <a href="/?q=${encodeURIComponent(t.tag)}">Tubes</a>
        <a href="/redgifs.html?q=${encodeURIComponent(t.tag)}">Gifs</a>
      </span>`;
      })
      .join('');
  }

  function renderTubeCards(items, append) {
    const html = items
      .map((item) => {
        const views = formatViews(item.views);
        const metaBits = [
          views ? `${views} views` : null,
          item.rating ? escapeHtml(item.rating) : null,
          item.studio ? escapeHtml(item.studio) : null,
          item.uploaded ? escapeHtml(item.uploaded) : null,
        ]
          .filter(Boolean)
          .map((x) => `<span>${x}</span>`)
          .join('');
        const img = item.thumbnail
          ? `<img src="${escapeHtml(thumbUrl(item.thumbnail))}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" />`
          : '';
        if (!img) return '';
        const title = String(item.title || '').trim();
        if (!title || /^untitled$/i.test(title)) return '';
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
    if (append) picksEl.insertAdjacentHTML('beforeend', html);
    else picksEl.innerHTML = html;
  }

  async function searchTubes(query, startPage) {
    const params = new URLSearchParams({
      q: query,
      sites: selectedSites().join(','),
      limit: '40',
      pages: '1',
      startPage: String(startPage || 1),
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

  let tubePool = tastePool();
  let tubeCursor = 0;
  const tubePageByTag = new Map();
  const tubeSeen = new Set();
  let tubeItems = [];
  let tubeLoading = false;

  function takeNextTags(count) {
    const n = Math.min(count, Math.max(1, tubePool.length));
    const queries = [];
    for (let i = 0; i < n; i++) {
      queries.push(tubePool[tubeCursor % tubePool.length]);
      tubeCursor += 1;
      if (tubeCursor % tubePool.length === 0) tubePool = shuffle(tubePool);
    }
    return queries;
  }

  async function loadMoreTubes() {
    if (tubeLoading) return false;
    tubeLoading = true;
    moreTubesBtn.hidden = false;
    moreTubesBtn.disabled = true;
    try {
      const mixed = [];
      for (let round = 0; round < 2 && mixed.length < MIX_TAGS * 2; round++) {
        const picked = takeNextTags(MIX_TAGS);
        const batches = await Promise.all(
          picked.map(async (q) => {
            const page = tubePageByTag.get(q.tag) || 1;
            tubePageByTag.set(q.tag, page + 1);
            try {
              const results = await searchTubes(q.tag, page);
              return { q, results };
            } catch (err) {
              if (err.code === 'password') throw err;
              return { q, results: [] };
            }
          })
        );
        for (const { q, results } of batches) {
          const fresh = shuffle(results.filter(usableVideo)).filter((v) => {
            const key = String(v.url || '').toLowerCase();
            return key && !tubeSeen.has(key);
          });
          for (const v of fresh.slice(0, PER_TAG)) {
            tubeSeen.add(String(v.url).toLowerCase());
            mixed.push({ ...v, _recQuery: q.label || q.tag });
          }
        }
      }
      const batch = shuffle(mixed);
      if (!batch.length) return false;
      tubeItems = tubeItems.concat(batch);
      renderTubeCards(batch, true);
      return true;
    } finally {
      tubeLoading = false;
      moreTubesBtn.disabled = false;
      moreTubesBtn.hidden = false;
      if (tubeSentinel) tubeSentinel.hidden = false;
    }
  }

  async function loadTubePicks() {
    if (!tubePool.length) {
      picksStatusEl.hidden = false;
      picksStatusEl.className = 'status empty';
      picksStatusEl.textContent =
        'Like a few gifs or search Tubes first — picks are built from those names.';
      return;
    }

    picksQueriesEl.innerHTML = tubePool
      .slice(0, 8)
      .map(
        (q) =>
          `<a class="chip-btn is-on" href="/?q=${encodeURIComponent(q.tag)}">${escapeHtml(
            q.label || q.tag
          )}${q.kind === 'studio' ? ' · studio' : ''} → Tubes</a>`
      )
      .join('');

    picksStatusEl.hidden = false;
    picksStatusEl.className = 'status loading';
    picksStatusEl.innerHTML =
      '<span class="spinner"></span>Finding tube picks for your names…';
    picksEl.innerHTML = '';

    try {
      const ok = await loadMoreTubes();
      if (!ok && !tubeItems.length) {
        picksStatusEl.className = 'status empty';
        picksStatusEl.textContent = 'No tube picks yet — try a search on Tubes, then refresh.';
        return;
      }
      picksStatusEl.hidden = true;
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

  picksEl.addEventListener('click', (e) => {
    const card = e.target.closest('a.card');
    if (!card) return;
    const url = card.getAttribute('href');
    const item = tubeItems.find((r) => r.url === url);
    if (item && window.BuddyPrefs?.trackAvClick) {
      window.BuddyPrefs.trackAvClick(item);
    }
  });
  moreTubesBtn?.addEventListener('click', () => loadMoreTubes());

  function previewTag(gif) {
    const src = mediaSrc(gif);
    if (!src || gif.play === 'iframe') return '';
    return `<video class="rg-preview" data-preview muted loop playsinline preload="none" poster="${escapeHtml(gif.thumbnail || '')}" data-src="${escapeHtml(src)}" referrerpolicy="no-referrer"></video>`;
  }

  function cardHtml(gif) {
    if (window.BuddyPrefs?.isDisliked?.(gif.id)) return '';
    if (!gif.thumbnail) return '';
    const title = String(gif.title || '').trim();
    if (!title || /^untitled$/i.test(title)) return '';
    const prefs = window.BuddyPrefs?.load() || { likes: [], bookmarks: [] };
    const liked = prefs.likes.some((x) => x.id === gif.id);
    const saved = prefs.bookmarks.some((x) => x.id === gif.id);
    const dur = gif.duration ? `${Math.round(gif.duration)}s` : '';
    const srcLabel = gif.source
      ? `<span class="source-badge">${escapeHtml(gif.source)}</span>`
      : '';
    const sound = gif.hasAudio ? `<span class="sound-badge">sound</span>` : '';
    return `
      <article class="rg-card" data-id="${escapeHtml(gif.id)}">
        <button type="button" class="rg-thumb" data-play="${escapeHtml(gif.id)}" data-url="${escapeHtml(gif.url)}" data-embed="${escapeHtml(gif.embed || gif.url || '')}">
          ${
            gif.thumbnail
              ? `<img src="${escapeHtml(gifThumb(gif))}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" />`
              : ''
          }
          ${previewTag(gif)}
          ${dur ? `<span class="badge">${escapeHtml(dur)}</span>` : ''}
          ${srcLabel}
          ${sound}
        </button>
        <div class="rg-body">
          <p class="card-title">${escapeHtml(gif.title)}</p>
          <div class="rg-actions">
            <button type="button" class="icon-btn ${liked ? 'is-on' : ''}" data-like="${escapeHtml(gif.id)}" aria-label="Like">♥</button>
            <button type="button" class="icon-btn ${saved ? 'is-on' : ''}" data-save="${escapeHtml(gif.id)}" aria-label="Bookmark">★</button>
            <button type="button" class="icon-btn icon-btn-dislike" data-dislike="${escapeHtml(gif.id)}" aria-label="Dislike">✕</button>
          </div>
        </div>
      </article>
    `;
  }

  function syncPlayerActions() {
    const gif = gifCache.get(currentGifId);
    const prefs = window.BuddyPrefs?.load() || { likes: [], bookmarks: [] };
    likeBtnEl?.classList.toggle(
      'is-on',
      Boolean(gif && prefs.likes.some((x) => x.id === gif.id))
    );
    saveBtnEl?.classList.toggle(
      'is-on',
      Boolean(gif && prefs.bookmarks.some((x) => x.id === gif.id))
    );
  }

  function clearVideo() {
    video.pause();
    video.removeAttribute('src');
    video.load();
  }

  function showNative() {
    iframe.hidden = true;
    iframe.src = '';
    video.hidden = false;
  }

  function showIframe(src) {
    clearVideo();
    video.hidden = true;
    iframe.hidden = false;
    iframe.src = src;
  }

  function openPlayer(play) {
    const id = play.dataset.play;
    const gif = gifCache.get(id) || {};
    const media = gif.sd || gif.hd;
    const embed =
      gif.embed ||
      play.dataset.embed ||
      (String(id).startsWith('erome-')
        ? play.dataset.url
        : media
          ? ''
          : `https://www.redgifs.com/ifr/${id}`);
    currentGifId = id;
    watchUrl = gif.url || play.dataset.url || embed || '';
    openExt.href = watchUrl;
    syncPlayerActions();

    const useIframe = gif.play === 'iframe' || (!media && embed);
    if (useIframe) {
      if (!embed) return;
      showIframe(embed);
    } else if (media) {
      showNative();
      video.poster = gif.thumbnail || '';
      video.referrerPolicy = 'no-referrer';
      video.src = mediaSrc(gif);
      video.muted = false;
      video.defaultMuted = false;
      video.volume = 1;
      video.loop = true;
      const playAttempt = video.play();
      if (playAttempt && typeof playAttempt.catch === 'function') {
        playAttempt.catch(() => {});
      }
      video.addEventListener(
        'error',
        () => {
          if (gif.embed && /redgifs/i.test(String(gif.source || id))) {
            showIframe(gif.embed);
          }
        },
        { once: true }
      );
    } else {
      return;
    }

    modal.showModal();
    window.BuddyGifPreview?.pauseAll();
    if (gif.id) window.BuddyPrefs?.like({ ...gif, thumbnail: gif.thumbnail });
  }

  function closePlayer() {
    clearVideo();
    iframe.src = '';
    currentGifId = '';
    watchUrl = '';
    if (modal.open) modal.close();
    window.BuddyGifPreview?.resume();
  }

  gridEl.addEventListener('click', (e) => {
    const play = e.target.closest('[data-play]');
    if (play) {
      openPlayer(play);
      return;
    }
    const likeBtn = e.target.closest('[data-like]');
    if (likeBtn) {
      const gif = gifCache.get(likeBtn.dataset.like);
      if (gif) {
        window.BuddyPrefs.like(gif);
        likeBtn.classList.add('is-on');
      }
      return;
    }
    const saveBtn = e.target.closest('[data-save]');
    if (saveBtn) {
      const gif = gifCache.get(saveBtn.dataset.save);
      if (gif) {
        window.BuddyPrefs.bookmark(gif);
        saveBtn.classList.add('is-on');
      }
      return;
    }
    const dislikeBtn = e.target.closest('[data-dislike]');
    if (dislikeBtn) {
      const gif = gifCache.get(dislikeBtn.dataset.dislike);
      if (gif) window.BuddyPrefs.dislike(gif);
      dislikeBtn.closest('.rg-card')?.remove();
      window.BuddyGifPreview?.scan(gridEl);
    }
  });

  likeBtnEl?.addEventListener('click', (e) => {
    e.stopPropagation();
    const gif = gifCache.get(currentGifId);
    if (!gif) return;
    window.BuddyPrefs.like(gif);
    likeBtnEl.classList.add('is-on');
  });
  saveBtnEl?.addEventListener('click', (e) => {
    e.stopPropagation();
    const gif = gifCache.get(currentGifId);
    if (!gif) return;
    window.BuddyPrefs.bookmark(gif);
    saveBtnEl.classList.add('is-on');
  });
  dislikeBtnEl?.addEventListener('click', (e) => {
    e.stopPropagation();
    const gif = gifCache.get(currentGifId);
    if (!gif) return;
    window.BuddyPrefs.dislike(gif);
    document.querySelectorAll('.rg-card').forEach((el) => {
      if (el.dataset.id === gif.id) el.remove();
    });
    window.BuddyGifPreview?.scan(gridEl);
    closePlayer();
  });
  document.getElementById('rg-close')?.addEventListener('click', (e) => {
    e.stopPropagation();
    closePlayer();
  });
  modal?.addEventListener('close', () => {
    clearVideo();
    iframe.src = '';
    currentGifId = '';
    window.BuddyGifPreview?.resume();
  });
  modal?.addEventListener('click', (e) => {
    if (!e.target.closest('.player-stage')) closePlayer();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal?.open) closePlayer();
  });

  function playlistIds() {
    return [...gridEl.querySelectorAll('.rg-card[data-id]')].map((el) => el.dataset.id);
  }

  async function openAdjacent(dir) {
    const ids = playlistIds();
    if (!ids.length) return;
    let idx = ids.indexOf(currentGifId);
    if (idx < 0) idx = 0;
    if (dir > 0 && idx >= ids.length - 2) {
      await loadMoreGifs();
    }
    const nextIds = playlistIds();
    let next = idx + dir;
    if (next >= nextIds.length) next = 0;
    if (next < 0) next = nextIds.length - 1;
    const id = nextIds[next];
    const btn = gridEl.querySelector(`[data-play="${id}"]`);
    if (btn) openPlayer(btn);
  }

  let gifPool = tastePool();
  let gifCursor = 0;
  const gifPageByTag = new Map();
  const gifOrders = shuffle(['trending', 'top', 'latest']);
  let gifLoading = false;

  function takeNextGifTags(count) {
    const n = Math.min(count, Math.max(1, gifPool.length));
    const queries = [];
    for (let i = 0; i < n; i++) {
      queries.push(gifPool[gifCursor % gifPool.length] || { tag: '' });
      gifCursor += 1;
      if (gifCursor % gifPool.length === 0) gifPool = shuffle(gifPool);
    }
    return queries;
  }

  async function loadMoreGifs() {
    if (gifLoading) return false;
    gifLoading = true;
    moreGifsBtn.hidden = false;
    moreGifsBtn.disabled = true;
    try {
      const mixed = [];
      for (let round = 0; round < 2 && mixed.length < MIX_TAGS * 2; round++) {
        const picked = takeNextGifTags(MIX_TAGS);
        const batches = await Promise.all(
          picked.map(async (q, i) => {
            const page = gifPageByTag.get(q.tag) || 1;
            gifPageByTag.set(q.tag, page + 1);
            const order = gifOrders[(gifCursor + i) % gifOrders.length] || 'trending';
            const params = new URLSearchParams({
              action: 'search',
              q: q.tag || '',
              source: 'all',
              order,
              page: String(page),
              count: '24',
            });
            window.BuddySettings?.applyGifExcludeParams?.(params);
            try {
              const res = await fetch(`/api/redgifs?${params}`);
              const data = await res.json().catch(() => ({}));
              return { q, gifs: window.BuddySettings?.filterGifs?.(data.gifs || []) || data.gifs || [] };
            } catch {
              return { q, gifs: [] };
            }
          })
        );
        for (const { q, gifs } of batches) {
          const fresh = shuffle(gifs).filter((g) => {
            if (!g.id || gifCache.has(g.id) || window.BuddyPrefs.isDisliked?.(g.id)) {
              return false;
            }
            const title = String(g.title || '').trim();
            return Boolean(g.thumbnail && title && !/^untitled$/i.test(title));
          });
          for (const g of fresh.slice(0, PER_TAG)) {
            gifCache.set(g.id, g);
            mixed.push(g);
          }
        }
      }
      const batch = shuffle(mixed);
      if (!batch.length) return false;
      gridEl.insertAdjacentHTML('beforeend', batch.map(cardHtml).join(''));
      window.BuddyGifPreview?.scan(gridEl);
      return true;
    } finally {
      gifLoading = false;
      moreGifsBtn.disabled = false;
      moreGifsBtn.hidden = false;
      if (gifSentinel) gifSentinel.hidden = false;
    }
  }

  async function loadGifFeed() {
    statusEl.hidden = false;
    statusEl.className = 'status loading';
    statusEl.innerHTML = '<span class="spinner"></span>Building a gif feed from your tags…';
    gridEl.innerHTML = '';
    try {
      const ok = await loadMoreGifs();
      if (!ok && !gridEl.querySelector('.rg-card')) {
        statusEl.className = 'status empty';
        statusEl.textContent = 'No feed yet — like a few clips on Gifs first.';
        return;
      }
      statusEl.hidden = true;
    } catch (err) {
      statusEl.className = 'status error';
      statusEl.textContent = err.message || String(err);
    }
  }

  moreGifsBtn?.addEventListener('click', () => loadMoreGifs());

  if (tubeSentinel && 'IntersectionObserver' in window) {
    new IntersectionObserver(
      (entries) => {
        if (entries.some((en) => en.isIntersecting) && tubeItems.length) loadMoreTubes();
      },
      { rootMargin: '900px' }
    ).observe(tubeSentinel);
  }
  if (gifSentinel && 'IntersectionObserver' in window) {
    new IntersectionObserver(
      (entries) => {
        if (entries.some((en) => en.isIntersecting) && gridEl.querySelector('.rg-card')) {
          loadMoreGifs();
        }
      },
      { rootMargin: '900px' }
    ).observe(gifSentinel);
  }

  window.BuddyGifSkip?.bind({
    prevBtn: document.getElementById('rg-prev'),
    nextBtn: document.getElementById('rg-next'),
    prev: () => openAdjacent(-1),
    next: () => openAdjacent(1),
  });

  const seedInput = document.getElementById('fy-seed-input');
  const seedBtn = document.getElementById('fy-seed-btn');
  const seedStatus = document.getElementById('fy-seed-status');
  seedBtn?.addEventListener('click', () => {
    const raw = seedInput?.value || '';
    const lines = String(raw)
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 2);
    if (!lines.length) {
      if (seedStatus) {
        seedStatus.hidden = false;
        seedStatus.textContent = 'Paste at least one name or tag first.';
      }
      return;
    }
    window.BuddyPrefs.importTasteLines(raw);
    location.reload();
  });

  loadTubePicks();
  loadGifFeed();
})();
