/**
 * RedGifs page — search, chips, infinite grid, modal embed, local prefs.
 */
(() => {
  const form = document.getElementById('rg-form');
  const qInput = document.getElementById('rg-q');
  const orderEl = document.getElementById('rg-order');
  const chipsEl = document.getElementById('rg-chips');
  const statusEl = document.getElementById('rg-status');
  const gridEl = document.getElementById('rg-grid');
  const sentinel = document.getElementById('rg-sentinel');
  const searchBtn = document.getElementById('rg-search-btn');
  const modal = document.getElementById('rg-modal');
  const video = document.getElementById('rg-video');
  const pauseBtn = document.getElementById('rg-pause');
  const openExt = document.getElementById('rg-open-ext');

  const selectedTags = new Set();
  let page = 1;
  let loading = false;
  let done = false;
  let lastQuery = '';
  let lastOrder = 'trending';
  let watchUrl = '';
  let landing = null;

  const LANDING_TAGS = [
    'pawg',
    'amateur',
    'big ass',
    'blonde',
    'milf',
    'creampie',
    'onlyfans',
    'riding',
    'blowjob',
    'cumshot',
  ];

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function shuffle(items) {
    const a = items.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function setStatus(kind, html) {
    statusEl.hidden = false;
    statusEl.className = `status ${kind || ''}`.trim();
    statusEl.innerHTML = html;
  }

  function clearStatus() {
    statusEl.hidden = true;
    statusEl.textContent = '';
  }

  function queryFromUi() {
    const typed = qInput.value.trim();
    const tags = [...selectedTags];
    if (typed && tags.length) return `${typed} ${tags.join(' ')}`.trim();
    if (typed) return typed;
    if (tags.length) return tags.join(',');
    if (landing) return landing.q;
    return 'pawg';
  }

  function startLandingFeed() {
    const learned = (window.BuddyPrefs?.topTags(6) || []).map((t) => t.tag);
    const pool = [...new Set([...learned, ...LANDING_TAGS])];
    landing = {
      q: pick(pool) || 'pawg',
      order: pick(['trending', 'top', 'latest']),
      page: pick([1, 2, 3]),
    };
    orderEl.value = landing.order;
    page = landing.page;
    qInput.placeholder = `Showing ${landing.q} · ${landing.order}`;
  }

  async function loadTags() {
    try {
      const res = await fetch('/api/redgifs?action=tags');
      const data = await res.json();
      const learned = (window.BuddyPrefs?.topTags(6) || []).map((t) => t.tag);
      const tags = [...new Set([...(data.tags || []), ...learned])].slice(0, 20);
      chipsEl.innerHTML = tags
        .map(
          (tag) =>
            `<button type="button" class="chip-btn" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`
        )
        .join('');
    } catch {
      chipsEl.innerHTML = '';
    }
  }

  chipsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-tag]');
    if (!btn) return;
    const tag = btn.dataset.tag;
    if (selectedTags.has(tag)) selectedTags.delete(tag);
    else selectedTags.add(tag);
    btn.classList.toggle('is-on', selectedTags.has(tag));
    landing = null;
    resetAndSearch();
  });

  function cardHtml(gif) {
    const prefs = window.BuddyPrefs?.load() || { likes: [], bookmarks: [], skips: {} };
    if (prefs.skips && prefs.skips[gif.id]) return '';
    const liked = prefs.likes.some((x) => x.id === gif.id);
    const saved = prefs.bookmarks.some((x) => x.id === gif.id);
    const dur = gif.duration ? `${Math.round(gif.duration)}s` : '';
    return `
      <article class="rg-card" data-id="${escapeHtml(gif.id)}">
        <button type="button" class="rg-thumb" data-play="${escapeHtml(gif.id)}" data-url="${escapeHtml(gif.url)}" data-hd="${escapeHtml(gif.hd || '')}" data-sd="${escapeHtml(gif.sd || '')}">
          ${
            gif.thumbnail
              ? `<img src="${escapeHtml(gif.thumbnail)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" />`
              : ''
          }
          ${dur ? `<span class="badge">${escapeHtml(dur)}</span>` : ''}
        </button>
        <div class="rg-body">
          <p class="card-title">${escapeHtml(gif.title)}</p>
          <div class="rg-actions">
            <button type="button" class="icon-btn ${liked ? 'is-on' : ''}" data-like="${escapeHtml(gif.id)}" aria-label="Like">♥</button>
            <button type="button" class="icon-btn ${saved ? 'is-on' : ''}" data-save="${escapeHtml(gif.id)}" aria-label="Bookmark">★</button>
            <button type="button" class="icon-btn" data-skip="${escapeHtml(gif.id)}" aria-label="Skip">✕</button>
          </div>
        </div>
      </article>
    `;
  }

  const gifCache = new Map();

  async function fetchPage(reset) {
    if (loading || done) return;
    loading = true;
    if (reset) setStatus('loading', '<span class="spinner"></span>Loading RedGifs…');
    searchBtn.disabled = true;

    const q = queryFromUi();
    const order = orderEl.value;
    const params = new URLSearchParams({
      action: 'search',
      q,
      order,
      page: String(page),
      count: '40',
    });

    try {
      const res = await fetch(`/api/redgifs?${params}`);
      const data = await res.json();
      if (!res.ok) {
        setStatus('error', escapeHtml(data.message || data.error || 'RedGifs failed'));
        done = true;
        return;
      }
      const gifs = shuffle(Array.isArray(data.gifs) ? data.gifs : []);
      gifs.forEach((g) => gifCache.set(g.id, g));

      if (reset && !gifs.length) {
        setStatus('empty', 'No straight results for that search. Try another tag.');
        gridEl.innerHTML = '';
        return;
      }
      clearStatus();
      const html = gifs.map(cardHtml).join('');
      if (reset) gridEl.innerHTML = html;
      else gridEl.insertAdjacentHTML('beforeend', html);

      if (gifs.length < 8) done = true;
      else page += 1;
      sentinel.hidden = done;
    } catch (err) {
      setStatus('error', `Network error: ${escapeHtml(err.message || err)}`);
      done = true;
    } finally {
      loading = false;
      searchBtn.disabled = false;
    }
  }

  function resetAndSearch() {
    page = landing ? landing.page : 1;
    done = false;
    lastQuery = queryFromUi();
    lastOrder = orderEl.value;
    gridEl.innerHTML = '';
    sentinel.hidden = false;
    fetchPage(true);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    landing = null;
    resetAndSearch();
  });
  orderEl.addEventListener('change', () => {
    landing = null;
    resetAndSearch();
  });

  document.getElementById('rg-export').addEventListener('click', () => {
    window.BuddyPrefs?.exportBookmarks();
  });

  function syncPauseBtn() {
    if (!pauseBtn) return;
    pauseBtn.textContent = video.paused ? 'Play' : 'Pause';
  }

  function stopVideo() {
    video.pause();
    video.removeAttribute('src');
    video.load();
    syncPauseBtn();
  }

  function openPlayer(play) {
    const id = play.dataset.play;
    const gif = gifCache.get(id) || {};
    const src = gif.hd || gif.sd || play.dataset.hd || play.dataset.sd;
    if (!src) return;
    watchUrl = gif.url || play.dataset.url || `https://www.redgifs.com/watch/${id}`;
    openExt.href = watchUrl;
    video.poster = gif.thumbnail || '';
    video.src = src;
    video.muted = false;
    video.defaultMuted = false;
    video.volume = 1;
    video.loop = true;
    modal.showModal();
    const playAttempt = video.play();
    if (playAttempt && typeof playAttempt.catch === 'function') {
      playAttempt.catch(() => {
        video.muted = false;
        video.volume = 1;
        video.play().catch(() => {});
      });
    }
    syncPauseBtn();
    if (gif.id) window.BuddyPrefs?.like({ ...gif, thumbnail: gif.thumbnail });
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
    const skipBtn = e.target.closest('[data-skip]');
    if (skipBtn) {
      const gif = gifCache.get(skipBtn.dataset.skip);
      if (gif) window.BuddyPrefs.skip(gif);
      skipBtn.closest('.rg-card')?.remove();
    }
  });

  function closePlayer() {
    stopVideo();
    if (modal.open) modal.close();
    watchUrl = '';
  }

  pauseBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (video.paused) {
      video.muted = false;
      video.play().catch(() => {});
    } else {
      video.pause();
    }
    syncPauseBtn();
  });
  video.addEventListener('play', syncPauseBtn);
  video.addEventListener('pause', syncPauseBtn);

  document.getElementById('rg-close').addEventListener('click', (e) => {
    e.stopPropagation();
    closePlayer();
  });
  modal.addEventListener('close', stopVideo);
  // Backdrop click closes; clicks on the video or chrome stay in the player.
  modal.addEventListener('click', (e) => {
    if (!e.target.closest('.player-stage')) closePlayer();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.open) closePlayer();
  });

  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) fetchPage(false);
  });
  io.observe(sentinel);

  const bootQ = new URLSearchParams(location.search).get('q');
  if (bootQ) {
    qInput.value = bootQ;
  } else {
    startLandingFeed();
  }
  loadTags().then(resetAndSearch);
})();
