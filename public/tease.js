/**
 * Tease — endless mood feeds (gifs + tubes) with swipe-to-next in the player.
 */
(() => {
  const chipsEl = document.getElementById('tease-chips');
  const gifStatus = document.getElementById('tease-gif-status');
  const gifGrid = document.getElementById('tease-gifs');
  const tubeStatus = document.getElementById('tease-tube-status');
  const tubeGrid = document.getElementById('tease-tubes');
  const moreGifsBtn = document.getElementById('tease-more-gifs');
  const moreTubesBtn = document.getElementById('tease-more-tubes');
  const gifSentinel = document.getElementById('tease-gif-sentinel');
  const tubeSentinel = document.getElementById('tease-tube-sentinel');
  const modal = document.getElementById('rg-modal');
  const video = document.getElementById('rg-video');
  const iframe = document.getElementById('rg-iframe');
  const likeBtn = document.getElementById('rg-like');
  const saveBtn = document.getElementById('rg-save');
  const dislikeBtn = document.getElementById('rg-dislike');
  const openExt = document.getElementById('rg-open-ext');

  const MOODS = [
    { id: 'strip', label: 'Strip tease', tube: 'strip tease', gif: 'striptease' },
    { id: 'joi', label: 'JOI', tube: 'JOI tease', gif: 'JOI' },
    { id: 'clothed', label: 'Clothed', tube: 'clothed tease', gif: 'clothed tease' },
    { id: 'oil', label: 'Oil', tube: 'oil tease', gif: 'oiled' },
    { id: 'undress', label: 'Undressing', tube: 'undressing tease', gif: 'undressing' },
    { id: 'tryon', label: 'Try-on', tube: 'try on haul tease', gif: 'try on' },
  ];

  const HARDCORE =
    /\b(creampie|gangbang|bukkake|double penetration|\bdp\b|anal pounding|internal cumshot)\b/i;

  const GIF_ORDERS = ['trending', 'top', 'latest'];
  const gifCache = new Map();
  let currentGifId = '';
  let watchUrl = '';
  let mood = MOODS[0];

  let gifPage = 1;
  let gifOrderIndex = 0;
  let gifTasteIndex = 0;
  let gifLoading = false;
  const gifSeen = new Set();

  let tubePage = 1;
  let tubeTasteIndex = 0;
  let tubeLoading = false;
  const tubeSeen = new Set();

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function shuffle(items) {
    const a = (items || []).slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[j], a[i]] = [a[i], a[j]];
    }
    return a;
  }

  function usableTitle(title) {
    const t = String(title || '').trim();
    return t && !/^untitled$/i.test(t);
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
      return ids.length ? ids : ['xvideos', 'xnxx', 'xhamster', 'pornhub', 'youporn'];
    } catch {
      return ['xvideos', 'xnxx', 'xhamster', 'pornhub', 'youporn'];
    }
  }

  function tasteTags() {
    const recs = window.BuddyPrefs?.recommendationQueries?.(12) || [];
    const tags = window.BuddyPrefs?.topTags?.(8) || [];
    const seen = new Set();
    const out = [];
    for (const x of [...recs, ...tags]) {
      const tag = String(x.tag || x || '').trim();
      const key = tag.toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(tag);
    }
    return out;
  }

  function mixQuery(base, index) {
    const extras = tasteTags();
    if (!extras.length || index === 0) return base;
    const pick = extras[(index - 1) % extras.length];
    return `${base} ${pick}`.trim();
  }

  function mediaSrc(gif) {
    const url = gif.sd || gif.hd;
    if (!url) return '';
    if (gif.play === 'direct') return url;
    return `/api/gifmedia?url=${encodeURIComponent(url)}`;
  }

  function thumbSrc(gif) {
    if (!gif.thumbnail) return '';
    const src = String(gif.source || '').toLowerCase();
    if (src === 'redgifs' || src === 'gifreels' || gif.play === 'direct') {
      return gif.thumbnail;
    }
    return `/api/thumbnail?url=${encodeURIComponent(gif.thumbnail)}`;
  }

  function previewTag(gif) {
    const src = mediaSrc(gif);
    if (!src || gif.play === 'iframe') return '';
    return `<video class="rg-preview" data-preview muted loop playsinline preload="none" poster="${escapeHtml(gif.thumbnail || '')}" data-src="${escapeHtml(src)}" referrerpolicy="no-referrer"></video>`;
  }

  function cardHtml(gif) {
    if (!gif.id || window.BuddyPrefs?.isDisliked?.(gif.id)) return '';
    if (!usableTitle(gif.title) || !gif.thumbnail) return '';
    const prefs = window.BuddyPrefs?.load() || { likes: [], bookmarks: [] };
    const liked = prefs.likes.some((x) => x.id === gif.id);
    const saved = prefs.bookmarks.some((x) => x.id === gif.id);
    return `
      <article class="rg-card" data-id="${escapeHtml(gif.id)}">
        <button type="button" class="rg-thumb" data-play="${escapeHtml(gif.id)}">
          <img src="${escapeHtml(thumbSrc(gif))}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" />
          ${previewTag(gif)}
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

  function paintChips() {
    chipsEl.innerHTML = MOODS.map(
      (m) =>
        `<button type="button" class="chip-btn${m.id === mood.id ? ' is-on' : ''}" data-mood="${m.id}">${escapeHtml(m.label)}</button>`
    ).join('');
  }

  chipsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-mood]');
    if (!btn) return;
    mood = MOODS.find((m) => m.id === btn.dataset.mood) || MOODS[0];
    paintChips();
    resetFeeds();
    loadAll();
  });

  function closePlayer() {
    modal?.close();
    if (video) {
      video.pause();
      video.removeAttribute('src');
      video.load();
    }
    if (iframe) {
      iframe.hidden = true;
      iframe.src = '';
    }
    window.BuddyGifPreview?.resume();
  }

  function openPlayer(gif) {
    if (!gif) return;
    currentGifId = gif.id;
    watchUrl = gif.url || '';
    window.BuddyGifPreview?.pauseAll();
    if (gif.id) window.BuddyPrefs?.like({ ...gif, thumbnail: gif.thumbnail });
    const src = mediaSrc(gif);
    if (src && gif.play !== 'iframe') {
      iframe.hidden = true;
      iframe.src = '';
      video.hidden = false;
      video.src = src;
      video.play()?.catch(() => {});
    } else {
      video.hidden = true;
      video.removeAttribute('src');
      iframe.hidden = false;
      iframe.src = gif.embed || gif.url || '';
    }
    if (openExt) openExt.href = gif.url || '#';
    const prefs = window.BuddyPrefs?.load() || { likes: [], bookmarks: [] };
    likeBtn?.classList.toggle('is-on', prefs.likes.some((x) => x.id === gif.id));
    saveBtn?.classList.toggle('is-on', prefs.bookmarks.some((x) => x.id === gif.id));
    modal.showModal();
  }

  function playlistIds() {
    return [...gifGrid.querySelectorAll('.rg-card[data-id]')].map((el) => el.dataset.id);
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
    const gif = gifCache.get(nextIds[next]);
    if (gif) openPlayer(gif);
  }

  gifGrid.addEventListener('click', (e) => {
    const play = e.target.closest('[data-play]');
    if (play) {
      openPlayer(gifCache.get(play.dataset.play));
      return;
    }
    const like = e.target.closest('[data-like]');
    if (like) {
      const gif = gifCache.get(like.dataset.like);
      if (gif) window.BuddyPrefs.like(gif);
      like.classList.toggle('is-on');
      return;
    }
    const save = e.target.closest('[data-save]');
    if (save) {
      const gif = gifCache.get(save.dataset.save);
      if (gif) window.BuddyPrefs.bookmark(gif);
      save.classList.toggle('is-on');
      return;
    }
    const dislike = e.target.closest('[data-dislike]');
    if (dislike) {
      const gif = gifCache.get(dislike.dataset.dislike);
      if (gif) window.BuddyPrefs.dislike(gif);
      dislike.closest('.rg-card')?.remove();
      window.BuddyGifPreview?.scan(gifGrid);
    }
  });

  likeBtn?.addEventListener('click', () => {
    const gif = gifCache.get(currentGifId);
    if (gif) window.BuddyPrefs.like(gif);
    likeBtn.classList.add('is-on');
  });
  saveBtn?.addEventListener('click', () => {
    const gif = gifCache.get(currentGifId);
    if (gif) window.BuddyPrefs.bookmark(gif);
    saveBtn.classList.add('is-on');
  });
  dislikeBtn?.addEventListener('click', () => {
    const gif = gifCache.get(currentGifId);
    if (gif) window.BuddyPrefs.dislike(gif);
    closePlayer();
    gifGrid.querySelector(`[data-id="${currentGifId}"]`)?.remove();
  });
  document.getElementById('rg-close')?.addEventListener('click', closePlayer);
  modal?.addEventListener('close', () => window.BuddyGifPreview?.resume());
  modal?.addEventListener('click', (e) => {
    if (!e.target.closest('.player-stage')) closePlayer();
  });

  gifGrid.addEventListener(
    'error',
    (e) => {
      if (e.target.tagName === 'IMG') e.target.closest('.rg-card')?.remove();
    },
    true
  );
  tubeGrid.addEventListener(
    'error',
    (e) => {
      if (e.target.tagName === 'IMG') e.target.closest('a.card')?.remove();
    },
    true
  );

  function resetFeeds() {
    gifPage = 1;
    gifOrderIndex = 0;
    gifTasteIndex = 0;
    gifSeen.clear();
    tubePage = 1;
    tubeTasteIndex = 0;
    tubeSeen.clear();
    gifGrid.innerHTML = '';
    tubeGrid.innerHTML = '';
  }

  async function loadMoreGifs() {
    if (gifLoading) return false;
    gifLoading = true;
    if (moreGifsBtn) {
      moreGifsBtn.hidden = false;
      moreGifsBtn.disabled = true;
    }
    const first = !gifGrid.querySelector('.rg-card');
    if (first) {
      gifStatus.hidden = false;
      gifStatus.className = 'status loading';
      gifStatus.innerHTML = '<span class="spinner"></span>Loading tease clips…';
    }
    try {
      let added = 0;
      for (let attempt = 0; attempt < 8 && added < 8; attempt++) {
        const q = mixQuery(mood.gif, gifTasteIndex);
        const order = GIF_ORDERS[gifOrderIndex % GIF_ORDERS.length];
        const params = new URLSearchParams({
          action: 'search',
          q,
          source: 'all',
          order,
          page: String(gifPage),
          count: '24',
        });
        const res = await fetch(`/api/redgifs?${params}`);
        const data = await res.json().catch(() => ({}));
        const gifs = shuffle(data.gifs || []).filter((g) => {
          if (!g.id || gifSeen.has(g.id) || window.BuddyPrefs?.isDisliked?.(g.id)) return false;
          if (!usableTitle(g.title) || !g.thumbnail) return false;
          gifSeen.add(g.id);
          gifCache.set(g.id, g);
          return true;
        });
        gifPage += 1;
        gifTasteIndex += 1;
        if (gifPage % 3 === 0) gifOrderIndex += 1;
        if (!gifs.length) continue;
        gifGrid.insertAdjacentHTML('beforeend', gifs.map(cardHtml).join(''));
        window.BuddyGifPreview?.scan(gifGrid);
        added += gifs.length;
      }
      if (!gifGrid.querySelector('.rg-card')) {
        gifStatus.hidden = false;
        gifStatus.className = 'status empty';
        gifStatus.textContent = 'No tease clips for that mood. Try another chip.';
        return false;
      }
      gifStatus.hidden = true;
      return added > 0;
    } catch (err) {
      if (!gifGrid.querySelector('.rg-card')) {
        gifStatus.className = 'status error';
        gifStatus.textContent = err.message || String(err);
      }
      return false;
    } finally {
      gifLoading = false;
      if (moreGifsBtn) {
        moreGifsBtn.disabled = false;
        moreGifsBtn.hidden = false;
      }
      if (gifSentinel) gifSentinel.hidden = false;
    }
  }

  function tubeCardHtml(item) {
    const img = `<img src="${escapeHtml(item.thumbnail)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" />`;
    return `
      <a class="card" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">
        <div class="thumb-wrap">
          ${img}
          ${item.duration ? `<span class="badge">${escapeHtml(item.duration)}</span>` : ''}
          <span class="source-badge">${escapeHtml(item.source || '')}</span>
        </div>
        <div class="card-body">
          <h2 class="card-title">${escapeHtml(item.title)}</h2>
        </div>
      </a>`;
  }

  async function loadMoreTubes() {
    if (tubeLoading) return false;
    tubeLoading = true;
    if (moreTubesBtn) {
      moreTubesBtn.hidden = false;
      moreTubesBtn.disabled = true;
    }
    const first = !tubeGrid.querySelector('a.card');
    if (first) {
      tubeStatus.hidden = false;
      tubeStatus.className = 'status loading';
      tubeStatus.innerHTML = '<span class="spinner"></span>Loading tease tubes…';
    }
    try {
      let added = 0;
      for (let attempt = 0; attempt < 6 && added < 8; attempt++) {
        const q = mixQuery(mood.tube, tubeTasteIndex);
        const params = new URLSearchParams({
          q,
          sites: selectedSites().join(','),
          limit: '40',
          pages: '1',
          startPage: String(tubePage),
        });
        const pw = searchPassword();
        const headers = pw ? { 'X-Search-Password': pw } : {};
        const res = await fetch(`/api/search?${params}`, { headers });
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) {
          tubeStatus.hidden = false;
          tubeStatus.className = 'status error';
          tubeStatus.innerHTML =
            'Enter the search password on <a href="/">Tubes</a> once, then come back.';
          return false;
        }
        const items = shuffle(data.results || []).filter((v) => {
          const key = String(v.url || '').toLowerCase();
          if (!key || tubeSeen.has(key)) return false;
          if (!v.thumbnail || !usableTitle(v.title) || HARDCORE.test(v.title || '')) return false;
          tubeSeen.add(key);
          return true;
        });
        tubePage += 1;
        tubeTasteIndex += 1;
        if (!items.length) continue;
        tubeGrid.insertAdjacentHTML('beforeend', items.slice(0, 24).map(tubeCardHtml).join(''));
        added += items.length;
      }
      if (!tubeGrid.querySelector('a.card')) {
        tubeStatus.hidden = false;
        tubeStatus.className = 'status empty';
        tubeStatus.textContent = 'No tease tubes for that search.';
        return false;
      }
      tubeStatus.hidden = true;
      return added > 0;
    } catch (err) {
      if (!tubeGrid.querySelector('a.card')) {
        tubeStatus.className = 'status error';
        tubeStatus.textContent = err.message || String(err);
      }
      return false;
    } finally {
      tubeLoading = false;
      if (moreTubesBtn) {
        moreTubesBtn.disabled = false;
        moreTubesBtn.hidden = false;
      }
      if (tubeSentinel) tubeSentinel.hidden = false;
    }
  }

  function loadAll() {
    loadMoreGifs();
    loadMoreTubes();
  }

  moreGifsBtn?.addEventListener('click', () => loadMoreGifs());
  moreTubesBtn?.addEventListener('click', () => loadMoreTubes());

  if (gifSentinel && 'IntersectionObserver' in window) {
    new IntersectionObserver(
      (entries) => {
        if (entries.some((en) => en.isIntersecting) && gifGrid.querySelector('.rg-card')) {
          loadMoreGifs();
        }
      },
      { rootMargin: '900px' }
    ).observe(gifSentinel);
  }
  if (tubeSentinel && 'IntersectionObserver' in window) {
    new IntersectionObserver(
      (entries) => {
        if (entries.some((en) => en.isIntersecting) && tubeGrid.querySelector('a.card')) {
          loadMoreTubes();
        }
      },
      { rootMargin: '900px' }
    ).observe(tubeSentinel);
  }

  window.BuddyGifSkip?.bind({
    prevBtn: document.getElementById('rg-prev'),
    nextBtn: document.getElementById('rg-next'),
    prev: () => openAdjacent(-1),
    next: () => openAdjacent(1),
  });

  paintChips();
  loadAll();
})();
