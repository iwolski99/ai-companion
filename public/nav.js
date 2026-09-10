/**
 * Shared GoonHub chrome: brand, hamburger, sidebar with every page.
 */
(function () {
  const LINKS = [
    { href: '/', match: ['/', '/index.html'], label: 'Tubes' },
    { href: '/redgifs.html', label: 'Gifs' },
    { href: '/tease.html', label: 'Tease' },
    { href: '/foryou.html', label: 'For You' },
    { href: '/bookmarks.html', label: 'Saved' },
    { href: '/chat.html', label: 'Chat' },
    { href: '/calendar.html', label: 'Calendar' },
  ];

  function path() {
    const p = location.pathname.replace(/\/+$/, '') || '/';
    return p === '/index.html' ? '/' : p;
  }

  function close() {
    document.documentElement.classList.remove('drawer-open');
    document.getElementById('menu-toggle')?.setAttribute('aria-expanded', 'false');
  }

  function open() {
    document.documentElement.classList.add('drawer-open');
    document.getElementById('menu-toggle')?.setAttribute('aria-expanded', 'true');
  }

  function mount() {
    const row = document.querySelector('header.top .top-row');
    if (!row) return;

    const brand = row.querySelector('.brand h1');
    if (brand) brand.textContent = 'GoonHub';

    row.querySelector('.nav')?.classList.add('is-replaced');

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
        if (document.documentElement.classList.contains('drawer-open')) close();
        else open();
      });
      row.appendChild(btn);
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
      scrim.addEventListener('click', close);
      document.body.appendChild(scrim);
      document.body.appendChild(aside);
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });

    if (window.BuddyVault && typeof window.BuddyVault.injectProfileMenu === 'function') {
      window.BuddyVault.injectProfileMenu();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
