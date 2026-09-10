/**
 * Saved bookmarks as an autoplaying gif grid.
 */
(() => {
  const grid = document.getElementById('bm-grid');
  const empty = document.getElementById('bm-empty');
  const modal = document.getElementById('rg-modal');
  const video = document.getElementById('rg-video');
  const iframe = document.getElementById('rg-iframe');
  const saveBtn = document.getElementById('rg-save');
  const openExt = document.getElementById('rg-open-ext');
  const cache = new Map();
  let currentId = '';

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function asGif(bm) {
    return {
      id: bm.id,
      title: bm.title || bm.id,
      tags: bm.tags || [],
      thumbnail: bm.thumbnail || bm.thumb || '',
      url: bm.url || '',
      embed: bm.embed || '',
      sd: bm.sd || null,
      hd: bm.hd || null,
      play: bm.play || (bm.sd || bm.hd ? 'proxy' : 'iframe'),
      source: bm.source || '',
    };
  }

  function mediaSrc(gif) {
    const url = gif.sd || gif.hd;
    if (!url) return '';
    if (gif.play === 'direct') return url;
    return `/api/gifmedia?url=${encodeURIComponent(url)}`;
  }

  function previewTag(gif) {
    const src = mediaSrc(gif);
    if (!src || gif.play === 'iframe') return '';
    return `<video class="rg-preview" data-preview muted loop playsinline preload="none" poster="${escapeHtml(gif.thumbnail || '')}" data-src="${escapeHtml(src)}" referrerpolicy="no-referrer"></video>`;
  }

  function cardHtml(gif) {
    if (!gif.id) return '';
    const thumb = gif.thumbnail
      ? `<img src="${escapeHtml(gif.thumbnail)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" />`
      : '';
    return `
      <article class="rg-card" data-id="${escapeHtml(gif.id)}">
        <button type="button" class="rg-thumb" data-play="${escapeHtml(gif.id)}">
          ${thumb}
          ${previewTag(gif)}
        </button>
        <div class="rg-body">
          <p class="card-title">${escapeHtml(gif.title || '')}</p>
          <div class="rg-actions">
            <button type="button" class="icon-btn is-on" data-save="${escapeHtml(gif.id)}" aria-label="Remove bookmark">★</button>
          </div>
        </div>
      </article>
    `;
  }

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
    currentId = gif.id;
    window.BuddyGifPreview?.pauseAll();
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
    modal.showModal();
  }

  async function hydrate(bm) {
    const gif = asGif(bm);
    if (gif.sd || gif.hd || gif.play === 'iframe') return gif;
    if (!gif.id) return gif;
    try {
      const res = await fetch(`/api/redgifs?action=gif&id=${encodeURIComponent(gif.id)}`);
      const data = await res.json().catch(() => ({}));
      if (data.gif && (data.gif.sd || data.gif.hd)) {
        return { ...gif, ...data.gif, thumbnail: data.gif.thumbnail || gif.thumbnail };
      }
    } catch {
      /* keep local */
    }
    return gif;
  }

  async function render() {
    const raw = window.BuddyPrefs.load().bookmarks || [];
    if (!raw.length) {
      empty.hidden = false;
      grid.innerHTML = '';
      return;
    }
    empty.hidden = true;
    const gifs = await Promise.all(raw.map((bm) => hydrate(bm)));
    for (const gif of gifs) cache.set(gif.id, gif);
    grid.innerHTML = gifs.map(cardHtml).join('');
    window.BuddyGifPreview?.scan(grid);
  }

  grid.addEventListener('click', (e) => {
    const play = e.target.closest('[data-play]');
    if (play) {
      openPlayer(cache.get(play.dataset.play));
      return;
    }
    const save = e.target.closest('[data-save]');
    if (save) {
      window.BuddyPrefs.unbookmark(save.dataset.save);
      save.closest('.rg-card')?.remove();
      if (!grid.querySelector('.rg-card') && empty) empty.hidden = false;
      window.BuddyGifPreview?.scan(grid);
    }
  });

  saveBtn?.addEventListener('click', () => {
    if (!currentId) return;
    window.BuddyPrefs.unbookmark(currentId);
    closePlayer();
    grid.querySelector(`[data-id="${currentId}"]`)?.remove();
    if (!grid.querySelector('.rg-card') && empty) empty.hidden = false;
  });
  document.getElementById('rg-close')?.addEventListener('click', closePlayer);
  modal?.addEventListener('close', () => window.BuddyGifPreview?.resume());
  modal?.addEventListener('click', (e) => {
    if (!e.target.closest('.player-stage')) closePlayer();
  });
  grid.addEventListener(
    'error',
    (e) => {
      if (e.target.tagName === 'IMG') e.target.closest('.rg-card')?.remove();
    },
    true
  );

  document.getElementById('export-bm')?.addEventListener('click', () => {
    window.BuddyPrefs.exportBookmarks();
  });

  function playlistIds() {
    return [...grid.querySelectorAll('.rg-card[data-id]')].map((el) => el.dataset.id);
  }

  function openAdjacent(dir) {
    const ids = playlistIds();
    if (!ids.length) return;
    let idx = ids.indexOf(currentId);
    if (idx < 0) idx = 0;
    let next = idx + dir;
    if (next >= ids.length) next = 0;
    if (next < 0) next = ids.length - 1;
    openPlayer(cache.get(ids[next]));
  }

  window.BuddyGifSkip?.bind({
    prevBtn: document.getElementById('rg-prev'),
    nextBtn: document.getElementById('rg-next'),
    prev: () => openAdjacent(-1),
    next: () => openAdjacent(1),
  });

  render();
})();
