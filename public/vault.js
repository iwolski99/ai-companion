/**
 * Profile key gate + sync. Prefs/chats live on the server under a PIN.
 * Random visitors see a lock screen, not your likes.
 */
(function (global) {
  const PIN_KEY = 'buddy_vault_pin';
  const META_KEY = 'buddy_vault_meta';
  const PREFS_KEY = 'buddy_prefs_v1';
  const CHAT_KEY = 'buddy_chats_v1';
  const SETTING_KEYS = [
    'av_search_password',
    'av_selected_sites',
    'av_proxy_thumbs',
    'buddy_fy_hide_chips',
  ];

  document.documentElement.classList.add('vault-pending');

  let pushTimer = null;
  let unlocked = false;

  function getPin() {
    try {
      return localStorage.getItem(PIN_KEY) || '';
    } catch {
      return '';
    }
  }

  function setPin(pin) {
    try {
      if (pin) localStorage.setItem(PIN_KEY, pin);
      else localStorage.removeItem(PIN_KEY);
    } catch {
      /* ignore */
    }
  }

  function readSettings() {
    const settings = {};
    for (const key of SETTING_KEYS) {
      try {
        settings[key] = localStorage.getItem(key) || '';
      } catch {
        settings[key] = '';
      }
    }
    return settings;
  }

  function writeSettings(settings) {
    if (!settings) return;
    for (const key of SETTING_KEYS) {
      try {
        const val = settings[key];
        if (val) localStorage.setItem(key, val);
        else localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
    }
  }

  function parseJson(raw, fallback) {
    if (!raw) return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function snapshot() {
    let prefs = null;
    let chats = null;
    try {
      prefs = parseJson(localStorage.getItem(PREFS_KEY), null);
      chats = parseJson(localStorage.getItem(CHAT_KEY), null);
    } catch {
      /* ignore */
    }
    const meta = parseJson(
      (() => {
        try {
          return localStorage.getItem(META_KEY);
        } catch {
          return null;
        }
      })(),
      {}
    );
    return {
      prefs,
      chats,
      settings: readSettings(),
      updatedAt: Number(meta.updatedAt) || 0,
    };
  }

  function localHasData(snap) {
    const prefs = snap.prefs || {};
    const chats = snap.chats || {};
    const tags = prefs.tags && typeof prefs.tags === 'object' ? prefs.tags : {};
    const dislikes =
      prefs.dislikes && typeof prefs.dislikes === 'object' ? prefs.dislikes : {};
    return Boolean(
      (prefs.likes && prefs.likes.length) ||
        (prefs.bookmarks && prefs.bookmarks.length) ||
        (prefs.searches && prefs.searches.length) ||
        (prefs.performers && prefs.performers.length) ||
        (prefs.studios && prefs.studios.length) ||
        (prefs.avClicks && prefs.avClicks.length) ||
        Object.keys(tags).length ||
        Object.keys(dislikes).length ||
        (prefs.calendar && Object.keys(prefs.calendar).length) ||
        (chats.chats && chats.chats.length)
    );
  }

  function applyPayload(data) {
    if (!data) return;
    try {
      if (data.prefs && typeof data.prefs === 'object') {
        localStorage.setItem(PREFS_KEY, JSON.stringify(data.prefs));
      }
      if (data.chats && typeof data.chats === 'object') {
        localStorage.setItem(CHAT_KEY, JSON.stringify(data.chats));
      }
      writeSettings(data.settings);
      localStorage.setItem(
        META_KEY,
        JSON.stringify({ updatedAt: Number(data.updatedAt) || Date.now() })
      );
    } catch {
      /* quota */
    }
  }

  function wipeLocalProfile() {
    try {
      localStorage.removeItem(PREFS_KEY);
      localStorage.removeItem(CHAT_KEY);
      localStorage.removeItem(META_KEY);
      localStorage.removeItem(PIN_KEY);
      for (const key of SETTING_KEYS) localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }

  async function api(method, pin, body) {
    const headers = { 'X-Profile-Pin': pin };
    const opts = { method, headers };
    if (body) {
      headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    const res = await fetch('/api/vault', opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.message || data.error || 'Vault error');
      err.status = res.status;
      throw err;
    }
    return data;
  }

  function markOpen() {
    unlocked = true;
    document.documentElement.classList.remove('vault-pending', 'vault-locked');
    document.documentElement.classList.add('vault-open');
    const gate = document.getElementById('vault-gate');
    if (gate) gate.remove();
    injectLockButton();
  }

  function payloadHasData(data) {
    if (!data || data.empty) return false;
    return localHasData({
      prefs: data.prefs || {},
      chats: data.chats || {},
    });
  }

  function parseBackup(obj) {
    if (typeof obj === 'string') {
      obj = JSON.parse(obj);
    }
    if (!obj || typeof obj !== 'object') {
      throw new Error('Not a Buddy profile file.');
    }
    if (Array.isArray(obj)) {
      return {
        prefs: { bookmarks: obj, likes: [], tags: {}, searches: [], performers: [] },
        chats: { activeId: null, chats: [] },
        settings: {},
        updatedAt: Date.now(),
      };
    }
    if (obj.buddyProfile === 1 || obj.prefs || obj.chats) {
      return {
        prefs: obj.prefs && typeof obj.prefs === 'object' ? obj.prefs : {},
        chats: obj.chats && typeof obj.chats === 'object' ? obj.chats : { activeId: null, chats: [] },
        settings: obj.settings && typeof obj.settings === 'object' ? obj.settings : {},
        updatedAt: Date.now(),
      };
    }
    if (obj.likes || obj.bookmarks || obj.searches || obj.performers || obj.calendar) {
      return {
        prefs: obj,
        chats: { activeId: null, chats: [] },
        settings: {},
        updatedAt: Date.now(),
      };
    }
    throw new Error('Not a Buddy profile file.');
  }

  async function fetchRemoteVault(originRaw, pin) {
    let origin;
    try {
      const href = /:\/\//.test(originRaw) ? originRaw : `https://${originRaw}`;
      origin = new URL(href).origin;
    } catch {
      throw new Error('That old site URL looks invalid.');
    }
    const res = await fetch(`${origin}/api/vault`, {
      headers: { 'X-Profile-Pin': pin },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        data.message || 'Could not read the old vault. Is that Netlify site still live?'
      );
    }
    if (!payloadHasData(data)) {
      throw new Error(
        'Old site opened but the vault there is empty. On that old URL, use Export profile from this browser, then import the file here.'
      );
    }
    return data;
  }

  function exportProfile() {
    const body = {
      buddyProfile: 1,
      exportedAt: new Date().toISOString(),
      ...collectPushBody(),
    };
    const blob = new Blob([JSON.stringify(body, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'buddy-profile.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function applyIncoming(pin, incoming) {
    const payload = {
      prefs: incoming.prefs || {},
      chats: incoming.chats || { activeId: null, chats: [] },
      settings: incoming.settings || {},
      updatedAt: Date.now(),
    };
    applyPayload(payload);
    try {
      await api('PUT', pin, payload);
    } catch {
      /* keep local even if this site's vault is still empty */
    }
    try {
      localStorage.setItem(META_KEY, JSON.stringify({ updatedAt: payload.updatedAt }));
    } catch {
      /* ignore */
    }
  }

  async function restoreFromOldSite(origin, pin) {
    const incoming = await fetchRemoteVault(origin, pin);
    await applyIncoming(pin, incoming);
    return incoming;
  }

  function showGate(message) {
    document.documentElement.classList.remove('vault-pending', 'vault-open');
    document.documentElement.classList.add('vault-locked');
    if (document.getElementById('vault-gate')) {
      const status = document.getElementById('vault-gate-status');
      if (status && message) status.textContent = message;
      return;
    }
    const gate = document.createElement('div');
    gate.id = 'vault-gate';
    gate.innerHTML = `
      <form id="vault-form" class="vault-card" autocomplete="off">
        <p class="vault-kicker">Buddy</p>
        <h1>Profile key</h1>
        <p class="vault-copy">
          Type the key for this profile. A new Netlify account starts with an empty vault —
          restore from your old site URL or a backup file below.
        </p>
        <label class="sr-only" for="vault-pin">Profile key</label>
        <input
          id="vault-pin"
          name="pin"
          type="password"
          inputmode="numeric"
          pattern="[0-9A-Za-z]+"
          minlength="4"
          maxlength="32"
          placeholder="Profile key"
          required
          autofocus
        />
        <button type="submit" class="btn-primary" id="vault-submit">Unlock</button>
        <details class="vault-restore">
          <summary>Restore from old site or backup</summary>
          <label class="vault-restore-label">
            Old Buddy URL
            <input id="vault-old-url" type="url" inputmode="url" placeholder="https://your-old-site.netlify.app" />
          </label>
          <label class="vault-restore-label">
            Or backup JSON
            <input id="vault-file" type="file" accept="application/json,.json" />
          </label>
        </details>
        <p class="vault-status" id="vault-gate-status">${message ? String(message) : ''}</p>
      </form>
    `;
    const mount = () => {
      if (!document.body) return;
      document.body.appendChild(gate);
      const form = document.getElementById('vault-form');
      const input = document.getElementById('vault-pin');
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const value = (input.value || '').trim();
        if (value.length < 4) return;
        const btn = document.getElementById('vault-submit');
        const status = document.getElementById('vault-gate-status');
        const file = document.getElementById('vault-file')?.files?.[0];
        const oldUrl = (document.getElementById('vault-old-url')?.value || '').trim();
        btn.disabled = true;
        status.textContent = 'Opening profile…';
        try {
          const extra = {};
          if (file) {
            extra.payload = parseBackup(await file.text());
          } else if (oldUrl) {
            extra.oldOrigin = oldUrl;
          }
          await unlock(value, extra);
        } catch (err) {
          status.textContent = err.message || String(err);
          btn.disabled = false;
        }
      });
      input.focus();
    };
    if (document.body) mount();
    else document.addEventListener('DOMContentLoaded', mount);
  }

  function injectLockButton() {
    if (document.getElementById('vault-profile-menu')) return;
    const host =
      document.querySelector('header .top-row') ||
      document.querySelector('header .nav');
    if (!host) return;
    const wrap = document.createElement('details');
    wrap.id = 'vault-profile-menu';
    wrap.className = 'vault-menu';
    wrap.innerHTML = `
      <summary class="nav-link">Profile</summary>
      <div class="vault-menu-pop">
        <button type="button" id="vault-export-btn">Export profile</button>
        <label class="vault-menu-file">Import JSON<input id="vault-import-file" type="file" accept="application/json,.json" /></label>
        <button type="button" id="vault-from-old-btn">From old site…</button>
        <button type="button" id="vault-lock-btn">Lock</button>
      </div>
    `;
    host.appendChild(wrap);
    document.getElementById('vault-export-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      exportProfile();
      wrap.open = false;
    });
    document.getElementById('vault-import-file')?.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      e.target.value = '';
      if (!file) return;
      const pin = getPin();
      if (!pin) return;
      try {
        const payload = parseBackup(await file.text());
        await applyIncoming(pin, payload);
        location.reload();
      } catch (err) {
        alert(err.message || String(err));
      }
    });
    document.getElementById('vault-from-old-btn')?.addEventListener('click', async () => {
      const origin = prompt('Paste your old Buddy Netlify URL');
      if (!origin) return;
      const pin = getPin();
      if (!pin) return;
      try {
        const incoming = await fetchRemoteVault(origin, pin);
        await applyIncoming(pin, incoming);
        location.reload();
      } catch (err) {
        alert(err.message || String(err));
      }
    });
    document.getElementById('vault-lock-btn')?.addEventListener('click', () => {
      wipeLocalProfile();
      location.reload();
    });
  }

  async function unlock(pin, extra = {}) {
    let incoming = extra.payload || null;
    if (!incoming && extra.oldOrigin) {
      incoming = await fetchRemoteVault(extra.oldOrigin, pin);
    }

    const remote = await api('GET', pin);
    const local = snapshot();

    if (incoming && payloadHasData(incoming)) {
      await applyIncoming(pin, incoming);
      setPin(pin);
      location.reload();
      return;
    }

    const remoteHas = payloadHasData(remote);
    if (remoteHas) {
      const remoteTs = Number(remote.updatedAt) || 0;
      const localTs = local.updatedAt || 0;
      if (localHasData(local) && localTs > remoteTs) {
        const pushed = {
          ...local,
          updatedAt: Date.now(),
        };
        await api('PUT', pin, pushed);
        try {
          localStorage.setItem(META_KEY, JSON.stringify({ updatedAt: pushed.updatedAt }));
        } catch {
          /* ignore */
        }
      } else {
        applyPayload(remote);
      }
    } else if (localHasData(local)) {
      const pushed = { ...local, updatedAt: Date.now() };
      await api('PUT', pin, pushed);
      try {
        localStorage.setItem(META_KEY, JSON.stringify({ updatedAt: pushed.updatedAt }));
      } catch {
        /* ignore */
      }
    }
    setPin(pin);
    location.reload();
  }

  async function bootRemembered(pin) {
    try {
      const remote = await api('GET', pin);
      const local = snapshot();
      if (remote && !remote.empty && remote.prefs) {
        const remoteTs = Number(remote.updatedAt) || 0;
        const localTs = local.updatedAt || 0;
        if (remoteTs > localTs) {
          applyPayload(remote);
          location.reload();
          return;
        }
      } else if (localHasData(local)) {
        schedulePush(0);
      }
      markOpen();
    } catch (err) {
      if (err.status === 401) {
        wipeLocalProfile();
        showGate('Wrong key. Try again.');
        return;
      }
      if (localHasData(snapshot())) {
        markOpen();
        return;
      }
      showGate(err.message || 'Could not reach profile store.');
    }
  }

  function collectPushBody() {
    const snap = snapshot();
    return {
      prefs: snap.prefs || {},
      chats: snap.chats || { activeId: null, chats: [] },
      settings: snap.settings,
      updatedAt: Date.now(),
    };
  }

  function schedulePush(delay = 1200) {
    const pin = getPin();
    if (!pin) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(async () => {
      try {
        const body = collectPushBody();
        await api('PUT', pin, body);
        try {
          localStorage.setItem(META_KEY, JSON.stringify({ updatedAt: body.updatedAt }));
        } catch {
          /* ignore */
        }
      } catch {
        /* offline — keep local */
      }
    }, delay);
  }

  function wrapPrefs() {
    const prefs = global.BuddyPrefs;
    if (!prefs || prefs.__vaultWrapped) return;
    prefs.__vaultWrapped = true;
    ['save', 'saveChats'].forEach((name) => {
      const orig = prefs[name];
      if (typeof orig !== 'function') return;
      prefs[name] = function vaultWrapped() {
        const result = orig.apply(this, arguments);
        schedulePush();
        return result;
      };
    });
  }

  const remembered = getPin();
  if (remembered) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => bootRemembered(remembered));
    } else {
      bootRemembered(remembered);
    }
  } else {
    showGate();
  }

  document.addEventListener('DOMContentLoaded', () => {
    wrapPrefs();
    if (unlocked) injectLockButton();
    document.addEventListener('change', (e) => {
      const el = e.target;
      if (!el) return;
      if (
        el.id === 'password' ||
        el.id === 'proxy-thumbs' ||
        el.id === 'fy-toggle-chips' ||
        el.name === 'site'
      ) {
        schedulePush();
      }
    });
  });

  global.BuddyVault = {
    schedulePush,
    exportProfile,
    restoreFromOldSite,
    applyIncoming,
    lock() {
      wipeLocalProfile();
      location.reload();
    },
    isOpen() {
      return unlocked;
    },
  };
})(window);
