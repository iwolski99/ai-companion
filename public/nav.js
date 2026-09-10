/**
 * Shared GoonHub chrome: brand, hamburger, settings, sidebar.
 */
(function (global) {
  const LINKS = [
    { href: '/', match: ['/', '/index.html'], label: 'Tubes' },
    { href: '/redgifs.html', label: 'Gifs' },
    { href: '/tease.html', label: 'Tease' },
    { href: '/foryou.html', label: 'For You' },
    { href: '/bookmarks.html', label: 'Saved' },
    { href: '/chat.html', label: 'Chat' },
    { href: '/calendar.html', label: 'Calendar' },
  ];

  const GIF_SOURCES = [
    { id: 'redgifs', label: 'RedGifs' },
    { id: 'pornhub', label: 'PornHub GIFs' },
    { id: 'gifreels', label: 'GifReels' },
    { id: 'nsfwmonster', label: 'NSFWMonster' },
    { id: 'erome', label: 'Erome' },
    { id: 'fyptt', label: 'FYPTT' },
  ];

  const GIF_EXCLUDE_KEY = 'av_exclude_gif_sources';
  const FY_GIFS_FIRST_KEY = 'buddy_fy_gifs_first';
  const PERSONA_KEY = 'buddy_chat_persona';
  const DEFAULT_GIF_EXCLUDE = ['erome'];

  function path() {
    const p = location.pathname.replace(/\/+$/, '') || '/';
    return p === '/index.html' ? '/' : p;
  }

  function readList(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback.slice();
      if (raw === 'none' || raw === '') return [];
      return raw
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter((s) => s && s !== 'none');
    } catch {
      return fallback.slice();
    }
  }

  function writeList(key, ids) {
    try {
      localStorage.setItem(key, ids.length ? ids.join(',') : 'none');
    } catch {
      /* ignore */
    }
  }

  function gifExclude() {
    return readList(GIF_EXCLUDE_KEY, DEFAULT_GIF_EXCLUDE);
  }

  function fyGifsFirst() {
    try {
      return localStorage.getItem(FY_GIFS_FIRST_KEY) === '1';
    } catch {
      return false;
    }
  }

  function chatPersona() {
    try {
      return localStorage.getItem(PERSONA_KEY) === 'goonette' ? 'goonette' : 'pal';
    } catch {
      return 'pal';
    }
  }

  function normalizeGifSource(source) {
    return String(source || '')
      .toLowerCase()
      .replace(/\s+/g, '');
  }

  function filterGifs(gifs) {
    const ex = new Set(gifExclude());
    if (!ex.size) return gifs || [];
    return (gifs || []).filter((g) => !ex.has(normalizeGifSource(g.source)));
  }

  function applyGifExcludeParams(params) {
    const ex = gifExclude();
    if (ex.length) params.set('exclude', ex.join(','));
    return params;
  }

  function emitSettings() {
    window.dispatchEvent(new Event('buddy-settings'));
    window.BuddyVault?.schedulePush?.();
  }

  function closeMenu() {
    document.documentElement.classList.remove('drawer-open');
    document.getElementById('menu-toggle')?.setAttribute('aria-expanded', 'false');
  }

  function closeSettings() {
    document.documentElement.classList.remove('settings-open');
    document.getElementById('settings-toggle')?.setAttribute('aria-expanded', 'false');
  }

  function closeAll() {
    closeMenu();
    closeSettings();
  }

  function openMenu() {
    closeSettings();
    document.documentElement.classList.add('drawer-open');
    document.getElementById('menu-toggle')?.setAttribute('aria-expanded', 'true');
  }

  function openSettings() {
    closeMenu();
    paintSettings();
    document.documentElement.classList.add('settings-open');
    document.getElementById('settings-toggle')?.setAttribute('aria-expanded', 'true');
  }

  function checks(list, selected) {
    const on = new Set(selected);
    return list
      .map(
        (s) =>
          `<label class="settings-check"><input type="checkbox" data-ex="${s.id}" ${
            on.has(s.id) ? 'checked' : ''
          } /> ${s.label}</label>`
      )
      .join('');
  }

  function paintSettings() {
    const gifs = document.getElementById('settings-gif-ex');
    if (gifs) gifs.innerHTML = checks(GIF_SOURCES, gifExclude());
    const gifsFirst = fyGifsFirst();
    document.getElementById('fy-order-videos')?.classList.toggle('is-on', !gifsFirst);
    document.getElementById('fy-order-gifs')?.classList.toggle('is-on', gifsFirst);
    const persona = chatPersona();
    document.getElementById('set-persona-pal')?.classList.toggle('is-on', persona === 'pal');
    document.getElementById('set-persona-goonette')?.classList.toggle('is-on', persona === 'goonette');
  }

  function readChecks(root) {
    return [...(root?.querySelectorAll('input[data-ex]:checked') || [])].map((el) => el.dataset.ex);
  }

  function bindSettings(panel) {
    panel.addEventListener('change', (e) => {
      const input = e.target.closest('input[data-ex]');
      if (!input) return;
      const gifRoot = document.getElementById('settings-gif-ex');
      if (gifRoot?.contains(input)) {
        let ids = readChecks(gifRoot);
        if (ids.length >= GIF_SOURCES.length) {
          input.checked = false;
          ids = readChecks(gifRoot);
        }
        writeList(GIF_EXCLUDE_KEY, ids);
      }
      emitSettings();
    });
    panel.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-fy-order]');
      if (btn) {
        try {
          localStorage.setItem(FY_GIFS_FIRST_KEY, btn.dataset.fyOrder === 'gifs' ? '1' : '0');
        } catch {
          /* ignore */
        }
        paintSettings();
        emitSettings();
        return;
      }
      const persona = e.target.closest('[data-set-persona]');
      if (persona) {
        try {
          localStorage.setItem(PERSONA_KEY, persona.dataset.setPersona === 'goonette' ? 'goonette' : 'pal');
        } catch {
          /* ignore */
        }
        paintSettings();
        emitSettings();
      }
    });
  }

  function mount() {
    const row = document.querySelector('header.top .top-row');
    if (!row) return;

    const brand = row.querySelector('.brand h1');
    if (brand) brand.textContent = 'GoonHub';

    row.querySelector('.nav')?.classList.add('is-replaced');

    let actions = document.getElementById('header-actions');
    if (!actions) {
      actions = document.createElement('div');
      actions.id = 'header-actions';
      actions.className = 'header-actions';
      row.appendChild(actions);
    }

    if (!document.getElementById('settings-toggle')) {
      const gear = document.createElement('button');
      gear.type = 'button';
      gear.id = 'settings-toggle';
      gear.className = 'settings-toggle';
      gear.setAttribute('aria-label', 'Open settings');
      gear.setAttribute('aria-expanded', 'false');
      gear.setAttribute('aria-controls', 'app-settings');
      gear.innerHTML =
        '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.2 7.2 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.59.24-1.13.55-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.84a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94L2.83 14.5a.5.5 0 0 0-.12.64l1.92 3.32c.13.23.4.32.64.22l2.39-.96c.5.39 1.04.7 1.63.94l.36 2.54c.05.24.26.42.5.42h3.84c.24 0 .45-.18.5-.42l.36-2.54c.59-.24 1.13-.55 1.63-.94l2.39.96c.24.1.51 0 .64-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z"/></svg>';
      gear.addEventListener('click', () => {
        if (document.documentElement.classList.contains('settings-open')) closeSettings();
        else openSettings();
      });
      actions.appendChild(gear);
    }

    if (!document.getElementById('menu-toggle')) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.id = 'menu-toggle';
      btn.className = 'menu-toggle';
      btn.setAttribute('aria-label', 'Open menu');
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-controls', 'app-drawer');
      btn.innerHTML = '<span></span><span></span><span></span>';
      btn.addEventListener('click', () => {
        if (document.documentElement.classList.contains('drawer-open')) closeMenu();
        else openMenu();
      });
      actions.appendChild(btn);
    } else if (document.getElementById('menu-toggle').parentElement !== actions) {
      actions.appendChild(document.getElementById('menu-toggle'));
    }

    if (!document.getElementById('app-drawer')) {
      const here = path();
      const links = LINKS.map((l) => {
        const hrefs = l.match || [l.href];
        const on = hrefs.includes(here);
        return `<a class="drawer-link${on ? ' is-active' : ''}" href="${l.href}">${l.label}</a>`;
      }).join('');
      const aside = document.createElement('aside');
      aside.id = 'app-drawer';
      aside.className = 'app-drawer';
      aside.innerHTML = `
        <p class="drawer-kicker">GoonHub</p>
        <nav class="drawer-nav" aria-label="Main">${links}</nav>
        <div id="drawer-account"></div>
      `;
      const scrim = document.createElement('div');
      scrim.id = 'app-scrim';
      scrim.className = 'app-scrim';
      scrim.addEventListener('click', closeAll);
      document.body.appendChild(scrim);
      document.body.appendChild(aside);
    }

    if (!document.getElementById('app-settings')) {
      const panel = document.createElement('aside');
      panel.id = 'app-settings';
      panel.className = 'app-settings';
      panel.innerHTML = `
        <div class="settings-head">
          <p class="drawer-kicker">Settings</p>
          <button type="button" class="btn-ghost" id="settings-close">Close</button>
        </div>
        <section class="settings-block">
          <h2 class="settings-title">For You</h2>
          <p class="muted">Which feed sits on top.</p>
          <div class="chip-row">
            <button type="button" class="chip-btn" id="fy-order-videos" data-fy-order="videos">Videos first</button>
            <button type="button" class="chip-btn" id="fy-order-gifs" data-fy-order="gifs">Gifs first</button>
          </div>
        </section>
        <section class="settings-block">
          <h2 class="settings-title">Chat</h2>
          <p class="muted">Default voice for new chats.</p>
          <div class="chip-row">
            <button type="button" class="chip-btn" id="set-persona-pal" data-set-persona="pal">Gooner pal</button>
            <button type="button" class="chip-btn" id="set-persona-goonette" data-set-persona="goonette">Goonette</button>
          </div>
        </section>
        <section class="settings-block">
          <h2 class="settings-title">Skip gif sources</h2>
          <p class="muted">Left out of All / For You / Tease. Erome is off by default. You can still pick a skipped source on the Gifs page for a one-off search.</p>
          <div class="settings-checks" id="settings-gif-ex"></div>
        </section>
      `;
      document.body.appendChild(panel);
      panel.querySelector('#settings-close')?.addEventListener('click', closeSettings);
      bindSettings(panel);
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAll();
    });

    if (window.BuddyVault && typeof window.BuddyVault.injectProfileMenu === 'function') {
      window.BuddyVault.injectProfileMenu();
    }
  }

  global.BuddySettings = {
    gifExclude,
    fyGifsFirst,
    chatPersona,
    filterGifs,
    applyGifExcludeParams,
    GIF_SOURCES,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})(window);
