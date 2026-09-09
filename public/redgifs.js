/**
 * Gifs page — multi-source search with a native <video> player (sound + controls).
 * RedGifs / PornHub / Reddit clips go through /api/gifmedia so their CDNs
 * see a real site Referer instead of this app.
 */
(() => {
  const form = document.getElementById('rg-form');
  const qInput = document.getElementById('rg-q');
  const orderEl = document.getElementById('rg-order');
  const sourceEl = document.getElementById('rg-source');
  const chipsEl = document.getElementById('rg-chips');
  const statusEl = document.getElementById('rg-status');
  const gridEl = document.getElementById('rg-grid');
  const sentinel = document.getElementById('rg-sentinel');
  const searchBtn = document.getElementById('rg-search-btn');
  const modal = document.getElementById('rg-modal');
  const video = document.getElementById('rg-video');
  const iframe = document.getElementById('rg-iframe');
  const likeBtnEl = document.getElementById('rg-like');
  const saveBtnEl = document.getElementById('rg-save');
  const openExt = document.getElementById('rg-open-ext');

  const selectedTags = new Set();
  let page = 1;
  let loading = false;
  let done = false;
  let landing = null;
  let currentGifId = '';
  let watchUrl = '';

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
      [a[j], a[i]] = [a[i], a[j]];
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

  function currentSource() {
    return (sourceEl?.value || 'all').toLowerCase();
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
      page: 1,
    };
    orderEl.value = landing.order;
    page = 1;
    qInput.placeholder = `Showing ${landing.q} · ${landing.order}`;
  }

  function thumbSrc(gif) {
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
    const prefs = window.BuddyPrefs?.load() || { likes: [], bookmarks: [] };
    const liked = prefs.likes.some((x) => x.id === gif.id);
    const saved = prefs.bookmarks.some((x) => x.id === gif.id);
    const dur = gif.duration ? `${Math.round(gif.duration)}s` : '';
    const srcLabel = gif.source ? `<span class="source-badge">${escapeHtml(gif.source)}</span>` : '';
    const sound = gif.hasAudio ? `<span class="sound-badge">sound</span>` : '';
    return `
      <article class="rg-card" data-id="${escapeHtml(gif.id)}">
        <button type="button" class="rg-thumb" data-play="${escapeHtml(gif.id)}" data-url="${escapeHtml(gif.url)}" data-embed="${escapeHtml(gif.embed || gif.url || '')}">
          ${
            gif.thumbnail
              ? `<img src="${escapeHtml(thumbSrc(gif))}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" />`
              : ''
          }
          ${dur ? `<span class="badge">${escapeHtml(dur)}</span>` : ''}
          ${srcLabel}
          ${sound}
        </button>
        <div class="rg-body">
          <p class="card-title">${escapeHtml(gif.title)}</p>
          <div class="rg-actions">
            <button type="button" class="icon-btn ${liked ? 'is-on' : ''}" data-like="${escapeHtml(gif.id)}" aria-label="Like">♥</button>
            <button type="button" class="icon-btn ${saved ? 'is-on' : ''}" data-save="${escapeHtml(gif.id)}" aria-label="Bookmark">★</button>
          </div>
        </div>
      </article>
    `;
  }

  const gifCache = new Map();

  async function fetchPage(reset) {
    if (loading || done) return;
    const source = currentSource();
    const q = queryFromUi();

    if (source === 'fyptt') {
      loading = false;
      done = true;
      sentinel.hidden = true;
      gridEl.innerHTML = '';
      const href = `https://fyptt.to/?s=${encodeURIComponent(q || 'amateur')}`;
      setStatus(
        'empty',
        `FYPTT blocks datacenter search (Cloudflare). Open results on their site: <a href="${escapeHtml(href)}" target="_blank" rel="noopener">Search “${escapeHtml(q || 'amateur')}” on FYPTT</a>`
      );
      return;
    }

    loading = true;
    if (reset) setStatus('loading', '<span class="spinner"></span>Loading clips…');
    searchBtn.disabled = true;

    const params = new URLSearchParams({
      action: 'search',
      q,
      source,
      order: orderEl.value,
      page: String(page),
      count: '40',
    });

    try {
      const res = await fetch(`/api/redgifs?${params}`);
      const data = await res.json();
      if (!res.ok) {
        setStatus('error', escapeHtml(data.message || data.error || 'Search failed'));
        done = true;
        return;
      }
      const gifs = shuffle(Array.isArray(data.gifs) ? data.gifs : []);
      gifs.forEach((g) => gifCache.set(g.id, g));

      if (reset && !gifs.length) {
        setStatus('empty', 'No straight results for that search. Try another tag or source.');
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
    page = 1;
    done = false;
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
  sourceEl?.addEventListener('change', () => {
    landing = null;
    resetAndSearch();
  });

  document.getElementById('rg-export').addEventListener('click', () => {
    window.BuddyPrefs?.exportBookmarks();
  });

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
    }
  });

  function closePlayer() {
    clearVideo();
    iframe.src = '';
    currentGifId = '';
    watchUrl = '';
    if (modal.open) modal.close();
  }

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

  document.getElementById('rg-close').addEventListener('click', (e) => {
    e.stopPropagation();
    closePlayer();
  });
  modal.addEventListener('close', () => {
    clearVideo();
    iframe.src = '';
    currentGifId = '';
  });
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
