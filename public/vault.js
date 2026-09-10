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
    return Boolean(
      (prefs.likes && prefs.likes.length) ||
        (prefs.bookmarks && prefs.bookmarks.length) ||
        (prefs.searches && prefs.searches.length) ||
        (prefs.performers && prefs.performers.length) ||
        (prefs.avClicks && prefs.avClicks.length) ||
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
          Type the number for this profile. Same key on your phone loads likes,
          bookmarks, chats, and recommendations. Visitors without it see nothing.
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
        btn.disabled = true;
        status.textContent = 'Opening profile…';
        try {
          await unlock(value);
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
    if (document.getElementById('vault-lock-btn')) return;
    const nav = document.querySelector('header .nav');
    if (!nav) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'vault-lock-btn';
    btn.className = 'nav-link vault-lock';
    btn.textContent = 'Lock';
    btn.title = 'Lock this profile on this device';
    btn.addEventListener('click', () => {
      wipeLocalProfile();
      location.reload();
    });
    nav.appendChild(btn);
  }

  async function unlock(pin) {
    const remote = await api('GET', pin);
    const local = snapshot();
    const remoteHas = remote && !remote.empty && remote.prefs;
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
    lock() {
      wipeLocalProfile();
      location.reload();
    },
    isOpen() {
      return unlocked;
    },
  };
})(window);
