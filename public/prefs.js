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
  };
})(window);
