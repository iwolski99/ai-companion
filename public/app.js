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
  const pagerTop = document.getElementById('pager-top');
  const pagerBottom = document.getElementById('pager-bottom');
  const siteCountEl = document.getElementById('site-count');
  const siteInputs = [...form.querySelectorAll('input[name="site"]')];

  const PAGE_SIZE = 32;
  const FIRST_PAGES = 1;
  const FILL_PAGES = 2;
  const TARGET_SOURCE_END = 9;
  const PER_SITE_LIMIT = 360;
  /** @type {any[]} */
  let lastResults = [];
  let currentPage = 1;
  let lastQuery = '';
  let hasMore = false;
  let nextStartPage = 1;
  let moreLoading = false;
  let lastMeta = null;
  let lastTookMs = 0;

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
    if (lastResults.length) showPage();
  });

  sortSelect.addEventListener('change', () => {
    currentPage = 1;
    if (lastResults.length) showPage();
  });

  resultsEl.addEventListener('click', (e) => {
    const card = e.target.closest('a.card');
    if (!card) return;
    const url = card.getAttribute('href');
    const item = lastResults.find((r) => r.url === url);
    if (item && window.BuddyPrefs) window.BuddyPrefs.trackAvClick(item);
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

  function mergeSiteMeta(prev, incoming) {
    const sites = { ...(prev?.sites || {}) };
    if (!incoming?.sites) return { sites };
    for (const [id, info] of Object.entries(incoming.sites)) {
      const old = sites[id];
      if (!old) {
        sites[id] = { ...info };
        continue;
      }
      sites[id] = {
        ...old,
        ...info,
        ok: Boolean(old.ok || info.ok),
        count: (Number(old.count) || 0) + (info.ok ? Number(info.count) || 0 : 0),
        error: info.ok ? old.error : info.error || old.error,
      };
    }
    return { sites };
  }

  function renderPager(total, page) {
    const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const pagers = [pagerTop, pagerBottom].filter(Boolean);
    const show = pageCount > 1 || hasMore;
    if (!show) {
      pagers.forEach((el) => {
        el.hidden = true;
        el.innerHTML = '';
      });
      return;
    }

    const canNext = page < pageCount || hasMore;
    const buttons = [];
    buttons.push(
      `<button type="button" class="pager-btn" data-page="${page - 1}" ${
        page <= 1 ? 'disabled' : ''
      }>Prev</button>`
    );
    const windowSize = 7;
    let start = Math.max(1, page - 3);
    let end = Math.min(pageCount, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);
    if (start > 1) {
      buttons.push(`<button type="button" class="pager-btn" data-page="1">1</button>`);
      if (start > 2) buttons.push(`<span class="pager-gap">…</span>`);
    }
    for (let n = start; n <= end; n++) {
      buttons.push(
        `<button type="button" class="pager-btn ${
          n === page ? 'is-active' : ''
        }" data-page="${n}">${n}</button>`
      );
    }
    if (end < pageCount) {
      if (end < pageCount - 1) buttons.push(`<span class="pager-gap">…</span>`);
      buttons.push(
        `<button type="button" class="pager-btn" data-page="${pageCount}">${pageCount}</button>`
      );
    }
    buttons.push(
      `<button type="button" class="pager-btn" data-page="${page + 1}" ${
        canNext ? '' : 'disabled'
      }>${moreLoading ? '…' : 'Next'}</button>`
    );
    const html = `<span class="pager-label">${total}${
      hasMore ? '+' : ''
    } videos</span>${buttons.join('')}`;
    pagers.forEach((el) => {
      el.hidden = false;
      el.innerHTML = html;
    });
  }

  function showPage() {
    const sorted = sortResults(lastResults, sortSelect.value);
    const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE) || 1);
    if (!(hasMore && currentPage > pageCount)) {
      currentPage = Math.min(Math.max(1, currentPage), pageCount);
    }
    const start = (currentPage - 1) * PAGE_SIZE;
    renderResults(sorted.slice(start, start + PAGE_SIZE));
    renderPager(sorted.length, currentPage);
  }

  function authHeaders() {
    return passwordInput.value
      ? { 'X-Search-Password': passwordInput.value }
      : {};
  }

  function usableVideo(item) {
    if (!item || !item.url) return false;
    const title = String(item.title || '').trim();
    if (!title || /^untitled$/i.test(title)) return false;
    if (!item.thumbnail) return false;
    return true;
  }

  function searchParams(query, startPage, pages) {
    const params = new URLSearchParams({
      q: query,
      sites: selectedSites().join(','),
      limit: String(PER_SITE_LIMIT),
      pages: String(pages || FIRST_PAGES),
      startPage: String(startPage),
    });
    if (passwordInput.value) params.set('password', passwordInput.value);
    return params;
  }

  function mergeUnique(existing, incoming) {
    const seen = new Set(existing.map((v) => v.url));
    const extra = (incoming || [])
      .filter(usableVideo)
      .filter((v) => v.url && !seen.has(v.url));
    return existing.concat(extra);
  }

  async function fetchBatch(query, startPage, pages) {
    const res = await fetch(`/api/search?${searchParams(query, startPage, pages)}`, {
      method: 'GET',
      headers: authHeaders(),
    });
    const data = await res.json().catch(() => ({}));
    return { res, data };
  }

  async function loadMore({ silent = false, pages = FILL_PAGES } = {}) {
    if (moreLoading || !lastQuery) return false;
    if (!hasMore && nextStartPage >= TARGET_SOURCE_END) return false;
    moreLoading = true;
    renderPager(lastResults.length, currentPage);
    if (!silent) {
      setStatus('loading', '<span class="spinner"></span>Loading more videos…');
    }
    try {
      const { res, data } = await fetchBatch(lastQuery, nextStartPage, pages);
      if (!res.ok) {
        hasMore = false;
        if (!silent) {
          setStatus(
            'error',
            escapeHtml(data.message || data.error || `Request failed (${res.status})`)
          );
        }
        return false;
      }
      const incoming = Array.isArray(data.results) ? data.results : [];
      const before = lastResults.length;
      lastResults = mergeUnique(lastResults, incoming);
      lastMeta = mergeSiteMeta(lastMeta, data.meta);
      lastTookMs = data.tookMs || lastTookMs;
      nextStartPage = Number(data.nextStartPage) || nextStartPage + pages;
      hasMore = lastResults.length > before && nextStartPage < TARGET_SOURCE_END;
      renderMeta(lastMeta, lastTookMs, data.cached);
      if (!silent) clearStatus();
      return lastResults.length > before;
    } catch (err) {
      if (!silent) {
        setStatus(
          'error',
          `Network error: ${escapeHtml(err.message || String(err))}`
        );
      }
      return false;
    } finally {
      moreLoading = false;
      showPage();
    }
  }

  async function prefetchRest(query) {
    while (lastQuery === query && nextStartPage < TARGET_SOURCE_END) {
      const added = await loadMore({ silent: true, pages: FILL_PAGES });
      if (!added) break;
    }
  }

  async function onPagerClick(e) {
    const btn = e.target.closest('[data-page]');
    if (!btn || btn.disabled) return;
    const next = Number(btn.dataset.page);
    if (!Number.isFinite(next) || next < 1) return;
    const loadedPages = Math.max(1, Math.ceil(lastResults.length / PAGE_SIZE));
    if (next > loadedPages) {
      while (moreLoading) {
        await new Promise((r) => setTimeout(r, 40));
      }
      if (Math.ceil(lastResults.length / PAGE_SIZE) < next) {
        const ok = await loadMore({ silent: false, pages: FILL_PAGES });
        if (!ok) return;
      }
    }
    currentPage = next;
    showPage();
    resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  pagerTop?.addEventListener('click', onPagerClick);
  pagerBottom?.addEventListener('click', onPagerClick);

  function renderResults(items) {
    const visible = items.filter(usableVideo);
    if (!visible.length) {
      resultsEl.innerHTML = '';
      return;
    }

    resultsEl.innerHTML = visible
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
          : '';
        if (!img) return '';

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

  async function runSearch(query, { remember = false } = {}) {
    const sites = selectedSites();
    if (!sites.length) {
      setStatus('error', 'Select at least one source site.');
      return;
    }
    if (sites.length > MAX_SITES) {
      setStatus('error', `Select at most ${MAX_SITES} sites per search.`);
      return;
    }

    if (remember && window.BuddyPrefs?.trackSearch) {
      window.BuddyPrefs.trackSearch(query, 'tubes');
      fillSearchHistory();
    }

    searchBtn.disabled = true;
    setStatus('loading', '<span class="spinner"></span>First page…');
    metaEl.hidden = true;
    resultsEl.innerHTML = '';
    lastResults = [];
    lastQuery = query;
    lastMeta = null;
    lastTookMs = 0;
    hasMore = false;
    nextStartPage = 1;
    moreLoading = false;
    currentPage = 1;
    pagerTop && (pagerTop.hidden = true);
    pagerBottom && (pagerBottom.hidden = true);

    try {
      const { res, data } = await fetchBatch(query, 1, FIRST_PAGES);

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

      lastResults = (Array.isArray(data.results) ? data.results : []).filter(usableVideo);
      lastMeta = data.meta || null;
      lastTookMs = data.tookMs || 0;
      nextStartPage = Number(data.nextStartPage) || 1 + FIRST_PAGES;
      hasMore = nextStartPage < TARGET_SOURCE_END;
      renderMeta(lastMeta, lastTookMs, data.cached);

      if (!lastResults.length) {
        setStatus(
          'empty',
          'No results found. Try another query, or some sites may be blocking this network.'
        );
        renderResults([]);
        renderPager(0, 1);
        return;
      }

      clearStatus();
      currentPage = 1;
      showPage();
      prefetchRest(query);
    } catch (err) {
      setStatus(
        'error',
        `Network error: ${escapeHtml(err.message || String(err))}`
      );
    } finally {
      searchBtn.disabled = false;
    }
  }

  function fillSearchHistory() {
    const list = document.getElementById('q-history');
    if (!list || !window.BuddyPrefs?.topSearches) return;
    const items = window.BuddyPrefs.topSearches(16);
    list.innerHTML = items
      .map((s) => `<option value="${escapeHtml(s.tag)}"></option>`)
      .join('');
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = qInput.value.trim();
    if (!q) return;
    runSearch(q, { remember: true });
  });

  fillSearchHistory();

  resultsEl.addEventListener(
    'error',
    (e) => {
      if (e.target && e.target.tagName === 'IMG') {
        e.target.closest('a.card')?.remove();
      }
    },
    true
  );

  const bootQ = new URLSearchParams(location.search).get('q');
  if (bootQ) {
    qInput.value = bootQ;
    runSearch(bootQ.trim(), { remember: true });
  } else {
    const learnedSearches = (
      window.BuddyPrefs?.recommendationQueries?.(4) ||
      window.BuddyPrefs?.topSearches(4) ||
      []
    ).map((t) => t.tag);
    const learned = (window.BuddyPrefs?.topTags(4) || []).map((t) => t.tag);
    const fallbacks = ['pawg', 'amateur', 'big ass', 'blonde', 'milf'];
    const pool = [...new Set([...learnedSearches, ...learned, ...fallbacks])];
    const pick = pool[Math.floor(Math.random() * Math.min(pool.length, 5))] || 'pawg';
    qInput.value = pick;
    runSearch(pick);
  }
})();
