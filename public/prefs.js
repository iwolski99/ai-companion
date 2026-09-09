/**
 * Local preference store — likes, bookmarks, skips, tag weights, calendar.
 * Privacy-first: everything stays in this browser's localStorage.
 */
(function (global) {
  const KEY = 'buddy_prefs_v1';

  const empty = () => ({
    tags: {},
    likes: [],
    bookmarks: [],
    skips: {},
    avClicks: [],
    calendar: {},
  });

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return empty();
      return { ...empty(), ...JSON.parse(raw) };
    } catch {
      return empty();
    }
  }

  function save(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* quota — ignore */
    }
    return state;
  }

  function bumpTags(state, tags, delta) {
    if (!Array.isArray(tags)) return;
    for (const tag of tags) {
      const key = String(tag || '')
        .trim()
        .toLowerCase();
      if (!key) continue;
      state.tags[key] = (state.tags[key] || 0) + delta;
    }
  }

  function like(item) {
    const state = load();
    if (!state.likes.some((x) => x.id === item.id)) {
      state.likes.unshift({
        id: item.id,
        title: item.title,
        tags: item.tags || [],
        thumb: item.thumbnail || item.thumb,
        url: item.url,
        ts: Date.now(),
      });
      state.likes = state.likes.slice(0, 200);
    }
    bumpTags(state, item.tags, 2);
    delete state.skips[item.id];
    return save(state);
  }

  function unlike(id) {
    const state = load();
    const found = state.likes.find((x) => x.id === id);
    if (found) bumpTags(state, found.tags, -2);
    state.likes = state.likes.filter((x) => x.id !== id);
    return save(state);
  }

  function bookmark(item) {
    const state = load();
    if (!state.bookmarks.some((x) => x.id === item.id)) {
      state.bookmarks.unshift({
        id: item.id,
        title: item.title,
        tags: item.tags || [],
        thumb: item.thumbnail || item.thumb,
        url: item.url,
        embed: item.embed || null,
        ts: Date.now(),
      });
      state.bookmarks = state.bookmarks.slice(0, 400);
    }
    bumpTags(state, item.tags, 3);
    return save(state);
  }

  function unbookmark(id) {
    const state = load();
    const found = state.bookmarks.find((x) => x.id === id);
    if (found) bumpTags(state, found.tags, -3);
    state.bookmarks = state.bookmarks.filter((x) => x.id !== id);
    return save(state);
  }

  function skip(item) {
    const state = load();
    state.skips[item.id] = Date.now();
    bumpTags(state, item.tags, -1);
    return save(state);
  }

  function trackAvClick(item) {
    const state = load();
    state.avClicks.unshift({
      title: item.title,
      source: item.source,
      url: item.url,
      ts: Date.now(),
    });
    state.avClicks = state.avClicks.slice(0, 150);
    const words = String(item.title || '')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 3 && w.length < 24);
    bumpTags(state, words.slice(0, 6), 1);
    return save(state);
  }

  function logOrgasm(dateKey, patch) {
    const state = load();
    const cur = state.calendar[dateKey] || { count: 0, note: '', tags: [] };
    state.calendar[dateKey] = { ...cur, ...patch };
    return save(state);
  }

  function topTags(n = 8) {
    const state = load();
    return Object.entries(state.tags)
      .filter(([, w]) => w > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([tag, weight]) => ({ tag, weight }));
  }

  function exportBookmarks() {
    const blob = new Blob([JSON.stringify(load().bookmarks, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'buddy-bookmarks.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  const CHAT_KEY = 'buddy_chats_v1';

  function emptyChats() {
    return { activeId: null, chats: [] };
  }

  function loadChats() {
    try {
      const raw = localStorage.getItem(CHAT_KEY);
      if (!raw) return emptyChats();
      const data = JSON.parse(raw);
      return {
        activeId: data.activeId || null,
        chats: Array.isArray(data.chats) ? data.chats : [],
      };
    } catch {
      return emptyChats();
    }
  }

  function saveChats(state) {
    try {
      localStorage.setItem(CHAT_KEY, JSON.stringify(state));
    } catch {
      /* quota */
    }
    return state;
  }

  function newChat(greeting) {
    const state = loadChats();
    const id = `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const chat = {
      id,
      title: 'New chat',
      messages: greeting
        ? [{ role: 'assistant', content: greeting, ts: Date.now() }]
        : [],
      updatedAt: Date.now(),
    };
    state.chats.unshift(chat);
    state.activeId = id;
    return { state: saveChats(state), chat };
  }

  function getChat(id) {
    return loadChats().chats.find((c) => c.id === id) || null;
  }

  function setActiveChat(id) {
    const state = loadChats();
    if (state.chats.some((c) => c.id === id)) {
      state.activeId = id;
      saveChats(state);
    }
    return state;
  }

  function upsertChat(id, patch) {
    const state = loadChats();
    const chat = state.chats.find((c) => c.id === id);
    if (!chat) return state;
    Object.assign(chat, patch, { updatedAt: Date.now() });
    state.chats.sort((a, b) => b.updatedAt - a.updatedAt);
    return saveChats(state);
  }

  function deleteChat(id) {
    const state = loadChats();
    state.chats = state.chats.filter((c) => c.id !== id);
    if (state.activeId === id) {
      state.activeId = state.chats[0]?.id || null;
    }
    return saveChats(state);
  }

  global.BuddyPrefs = {
    load,
    save,
    like,
    unlike,
    bookmark,
    unbookmark,
    skip,
    trackAvClick,
    logOrgasm,
    topTags,
    exportBookmarks,
    loadChats,
    saveChats,
    newChat,
    getChat,
    setActiveChat,
    upsertChat,
    deleteChat,
  };
})(window);
