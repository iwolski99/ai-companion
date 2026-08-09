/**
 * Frontend for AV Search — calls /api/search and renders result cards.
 */

(() => {
  const MAX_SITES = 5;
  const form = document.getElementById('search-form');
  const qInput = document.getElementById('q');
  const sortSelect = document.getElementById('sort');
  const passwordInput = document.getElementById('password');
  const proxyThumbs = document.getElementById('proxy-thumbs');
  const searchBtn = document.getElementById('search-btn');
  const statusEl = document.getElementById('status');
  const metaEl = document.getElementById('meta');
  const resultsEl = document.getElementById('results');
  const siteCountEl = document.getElementById('site-count');
  const siteInputs = [...form.querySelectorAll('input[name="site"]')];

  /** @type {any[]} */
  let lastResults = [];

  // Restore saved prefs for convenience on personal devices
  try {
    const saved = localStorage.getItem('av_search_password');
    if (saved) passwordInput.value = saved;
    const proxy = localStorage.getItem('av_proxy_thumbs');
    if (proxy === '1') proxyThumbs.checked = true;
    const savedSites = localStorage.getItem('av_selected_sites');
    if (savedSites) {
      const set = new Set(
        savedSites
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, MAX_SITES)
      );
      if (set.size) {
        siteInputs.forEach((input) => {
          input.checked = set.has(input.value);
        });
      }
    }
  } catch {
    /* ignore */
  }

  function selectedSites() {
    return siteInputs.filter((el) => el.checked).map((el) => el.value);
  }

  function syncSiteLimit() {
    const selected = selectedSites();
    const atMax = selected.length >= MAX_SITES;
    if (siteCountEl) {
      siteCountEl.textContent = `${selected.length}/${MAX_SITES}`;
    }
    siteInputs.forEach((input) => {
      const lock = atMax && !input.checked;
      input.disabled = lock;
      input.closest('label')?.classList.toggle('is-locked', lock);
    });
    try {
      localStorage.setItem('av_selected_sites', selected.join(','));
    } catch {
      /* ignore */
    }
  }

  siteInputs.forEach((input) => {
    input.addEventListener('change', () => {
      const checked = siteInputs.filter((el) => el.checked);
      if (checked.length > MAX_SITES) {
        input.checked = false;
      }
      syncSiteLimit();
    });
  });
  syncSiteLimit();

  passwordInput.addEventListener('change', () => {
    try {
      if (passwordInput.value) {
        localStorage.setItem('av_search_password', passwordInput.value);
      } else {
        localStorage.removeItem('av_search_password');
      }
    } catch {
      /* ignore */
    }
  });

  proxyThumbs.addEventListener('change', () => {
    try {
      localStorage.setItem('av_proxy_thumbs', proxyThumbs.checked ? '1' : '0');
    } catch {
      /* ignore */
    }
    if (lastResults.length) renderResults(sortResults(lastResults, sortSelect.value));
  });

  sortSelect.addEventListener('change', () => {
    if (lastResults.length) renderResults(sortResults(lastResults, sortSelect.value));
  });

  function setStatus(kind, html) {
    statusEl.hidden = false;
    statusEl.className = `status ${kind || ''}`.trim();
    statusEl.innerHTML = html;
  }

  function clearStatus() {
    statusEl.hidden = true;
    statusEl.textContent = '';
  }

  function formatViews(n) {
    if (n == null || !Number.isFinite(n)) return null;
    if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}K`;
    return String(n);
  }

  function parseDurationSeconds(raw) {
    if (!raw) return 0;
    const s = String(raw).trim();
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(s)) {
      const parts = s.split(':').map(Number);
      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
      return parts[0] * 60 + parts[1];
    }
    const h = s.match(/(\d+)\s*h/i);
    const m = s.match(/(\d+)\s*m/i);
    const sec = s.match(/(\d+)\s*s/i);
    let total = 0;
    if (h) total += Number(h[1]) * 3600;
    if (m) total += Number(m[1]) * 60;
    if (sec) total += Number(sec[1]);
    if (total) return total;
    const minOnly = s.match(/(\d+)/);
    return minOnly ? Number(minOnly[1]) * 60 : 0;
  }

  function sortResults(items, mode) {
    const copy = items.slice();
    if (mode === 'source') {
      copy.sort(
        (a, b) =>
          String(a.source).localeCompare(String(b.source)) ||
          (a.rank ?? 0) - (b.rank ?? 0)
      );
    } else if (mode === 'duration') {
      copy.sort(
        (a, b) => parseDurationSeconds(b.duration) - parseDurationSeconds(a.duration)
      );
    } else if (mode === 'views') {
      copy.sort((a, b) => (b.views || 0) - (a.views || 0));
    }
    return copy;
  }

  function thumbUrl(url) {
    if (!url) return '';
    if (!proxyThumbs.checked) return url;
    const params = new URLSearchParams({ url });
    if (passwordInput.value) params.set('password', passwordInput.value);
    return `/api/thumbnail?${params.toString()}`;
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderMeta(meta, tookMs, cached) {
    if (!meta || !meta.sites) {
      metaEl.hidden = true;
      metaEl.innerHTML = '';
      return;
    }
    const chips = Object.entries(meta.sites).map(([id, info]) => {
      const cls = info.ok ? 'ok' : 'fail';
      const detail = info.ok
        ? `${info.count}`
        : escapeHtml(info.error || 'error');
      return `<span class="chip ${cls}" title="${escapeHtml(
        info.error || info.name || id
      )}">${escapeHtml(info.name || id)} · ${detail}</span>`;
    });
    chips.push(
      `<span class="chip">${tookMs}ms${cached ? ' · cached' : ''}</span>`
    );
    metaEl.hidden = false;
    metaEl.innerHTML = chips.join('');
  }

  function renderResults(items) {
    if (!items.length) {
      resultsEl.innerHTML = '';
      return;
    }

    resultsEl.innerHTML = items
      .map((item) => {
        const views = formatViews(item.views);
        const rating = item.rating ? escapeHtml(item.rating) : null;
        const metaBits = [
          views ? `${views} views` : null,
          rating,
          item.uploaded ? escapeHtml(item.uploaded) : null,
        ]
          .filter(Boolean)
          .map((x) => `<span>${x}</span>`)
          .join('');

        const img = item.thumbnail
          ? `<img src="${escapeHtml(thumbUrl(item.thumbnail))}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" />`
          : `<img alt="" />`;

        return `
          <a class="card" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">
            <div class="thumb-wrap">
              ${img}
              ${
                item.duration
                  ? `<span class="badge">${escapeHtml(item.duration)}</span>`
                  : ''
              }
              <span class="source-badge">${escapeHtml(item.source)}</span>
            </div>
            <div class="card-body">
              <h2 class="card-title">${escapeHtml(item.title)}</h2>
              ${metaBits ? `<div class="card-meta">${metaBits}</div>` : ''}
            </div>
          </a>
        `;
      })
      .join('');
  }

  async function runSearch(query) {
    const sites = selectedSites();
    if (!sites.length) {
      setStatus('error', 'Select at least one source site.');
      return;
    }
    if (sites.length > MAX_SITES) {
      setStatus('error', `Select at most ${MAX_SITES} sites per search.`);
      return;
    }

    searchBtn.disabled = true;
    setStatus('loading', '<span class="spinner"></span>Searching selected sites…');
    metaEl.hidden = true;
    resultsEl.innerHTML = '';
    lastResults = [];

    const params = new URLSearchParams({
      q: query,
      sites: sites.join(','),
      limit: '20',
    });
    if (passwordInput.value) params.set('password', passwordInput.value);

    try {
      const res = await fetch(`/api/search?${params.toString()}`, {
        method: 'GET',
        headers: passwordInput.value
          ? { 'X-Search-Password': passwordInput.value }
          : {},
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        setStatus(
          'error',
          'Password required or incorrect. Set it under Filters &amp; options.'
        );
        return;
      }

      if (!res.ok) {
        setStatus(
          'error',
          escapeHtml(data.message || data.error || `Request failed (${res.status})`)
        );
        return;
      }

      lastResults = Array.isArray(data.results) ? data.results : [];
      renderMeta(data.meta, data.tookMs, data.cached);

      if (!lastResults.length) {
        setStatus(
          'empty',
          'No results found. Try another query, or some sites may be blocking this network.'
        );
        renderResults([]);
        return;
      }

      clearStatus();
      renderResults(sortResults(lastResults, sortSelect.value));
    } catch (err) {
      setStatus(
        'error',
        `Network error: ${escapeHtml(err.message || String(err))}`
      );
    } finally {
      searchBtn.disabled = false;
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = qInput.value.trim();
    if (!q) return;
    runSearch(q);
  });

  const bootQ = new URLSearchParams(location.search).get('q');
  if (bootQ) {
    qInput.value = bootQ;
    runSearch(bootQ.trim());
  }
})();
