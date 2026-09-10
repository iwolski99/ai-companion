/**
 * Tease — strip / JOI / clothed feeds. First tube page shows immediately.
 */
(() => {
  const chipsEl = document.getElementById('tease-chips');
  const gifStatus = document.getElementById('tease-gif-status');
  const gifGrid = document.getElementById('tease-gifs');
  const tubeStatus = document.getElementById('tease-tube-status');
  const tubeGrid = document.getElementById('tease-tubes');
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

  const gifCache = new Map();
  let currentGifId = '';
  let watchUrl = '';
  let mood = MOODS[0];

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
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

  async function loadGifs() {
    gifStatus.hidden = false;
    gifStatus.className = 'status loading';
    gifStatus.innerHTML = '<span class="spinner"></span>Loading tease clips…';
    gifGrid.innerHTML = '';
    try {
      const params = new URLSearchParams({
        action: 'search',
        q: mood.gif,
        source: 'all',
        order: 'trending',
        page: '1',
        count: '24',
      });
      const res = await fetch(`/api/redgifs?${params}`);
      const data = await res.json().catch(() => ({}));
      const gifs = (data.gifs || []).filter(
        (g) => g.id && usableTitle(g.title) && g.thumbnail && !window.BuddyPrefs?.isDisliked?.(g.id)
      );
      gifs.forEach((g) => gifCache.set(g.id, g));
      if (!gifs.length) {
        gifStatus.className = 'status empty';
        gifStatus.textContent = 'No tease clips for that mood. Try another chip.';
        return;
      }
      gifStatus.hidden = true;
      gifGrid.innerHTML = gifs.map(cardHtml).join('');
      window.BuddyGifPreview?.scan(gifGrid);
    } catch (err) {
      gifStatus.className = 'status error';
      gifStatus.textContent = err.message || String(err);
    }
  }

  async function loadTubes() {
    tubeStatus.hidden = false;
    tubeStatus.className = 'status loading';
    tubeStatus.innerHTML = '<span class="spinner"></span>First page of tease tubes…';
    tubeGrid.innerHTML = '';
    try {
      const params = new URLSearchParams({
        q: mood.tube,
        sites: selectedSites().join(','),
        limit: '40',
        pages: '1',
        startPage: '1',
      });
      const pw = searchPassword();
      const headers = pw ? { 'X-Search-Password': pw } : {};
      const res = await fetch(`/api/search?${params}`, { headers });
      const data = await res.json().catch(() => ({}));
      const items = (data.results || []).filter(
        (v) =>
          v.url &&
          v.thumbnail &&
          usableTitle(v.title) &&
          !HARDCORE.test(v.title || '')
      );
      if (!items.length) {
        tubeStatus.className = 'status empty';
        tubeStatus.textContent = 'No tease tubes for that search.';
        return;
      }
      tubeStatus.hidden = true;
      tubeGrid.innerHTML = items
        .slice(0, 24)
        .map((item) => {
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
        })
        .join('');
    } catch (err) {
      tubeStatus.className = 'status error';
      tubeStatus.textContent = err.message || String(err);
    }
  }

  function loadAll() {
    loadGifs();
    loadTubes();
  }

  paintChips();
  loadAll();
})();
