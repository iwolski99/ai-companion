(() => {
  const tagsEl = document.getElementById('taste-tags');
  const emptyEl = document.getElementById('taste-empty');
  const statusEl = document.getElementById('fy-status');
  const gridEl = document.getElementById('fy-grid');
  const bmEl = document.getElementById('bm-list');

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  const top = window.BuddyPrefs.topTags(12);
  if (!top.length) {
    emptyEl.hidden = false;
  } else {
    tagsEl.innerHTML = top
      .map(
        (t) =>
          `<a class="chip-btn is-on" href="/redgifs.html?q=${encodeURIComponent(t.tag)}">${escapeHtml(t.tag)} · ${t.weight}</a>`
      )
      .join('');
  }

  async function loadFeed() {
    const q = top
      .slice(0, 3)
      .map((t) => t.tag)
      .join(',');
    statusEl.hidden = false;
    statusEl.className = 'status loading';
    statusEl.innerHTML = '<span class="spinner"></span>Building a feed from your tags…';
    try {
      const params = new URLSearchParams({
        action: 'search',
        q: q || '',
        source: 'redgifs',
        order: 'trending',
        page: '1',
        count: '24',
      });
      const res = await fetch(`/api/redgifs?${params}`);
      const data = await res.json();
      const gifs = data.gifs || [];
      if (!gifs.length) {
        statusEl.className = 'status empty';
        statusEl.textContent = 'No feed yet — like a few clips on Gifs first.';
        return;
      }
      statusEl.hidden = true;
      gridEl.innerHTML = gifs
        .map(
          (g) => `
        <a class="rg-card" href="${escapeHtml(g.url)}" target="_blank" rel="noopener">
          <div class="rg-thumb">
            ${g.thumbnail ? `<img src="${escapeHtml(g.thumbnail)}" alt="" loading="lazy" referrerpolicy="no-referrer" />` : ''}
          </div>
          <div class="rg-body"><p class="card-title">${escapeHtml(g.title)}</p></div>
        </a>`
        )
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

  loadFeed();
})();
