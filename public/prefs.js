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
    dislikes: {},
    searches: [],
    performers: [],
    avClicks: [],
    calendar: {},
  });

  const SEARCH_STOP = new Set(
    [
      'a',
      'an',
      'the',
      'and',
      'or',
      'of',
      'in',
      'on',
      'with',
      'for',
      'to',
      'vs',
      'pov',
      'xxx',
      'porn',
      'sex',
      'video',
      'videos',
      'gif',
      'gifs',
      'clip',
      'free',
      'hd',
      'amateur',
      'milf',
      'pawg',
      'blonde',
      'brunette',
      'redhead',
      'asian',
      'latina',
      'ebony',
      'teen',
      'anal',
      'oral',
      'blowjob',
      'creampie',
      'cumshot',
      'doggystyle',
      'missionary',
      'riding',
      'onlyfans',
      'homemade',
      'hardcore',
      'threesome',
      'gangbang',
      'big',
      'ass',
      'tits',
      'boobs',
      'booty',
      'pussy',
      'cock',
      'dick',
      'bbc',
      'bwc',
      'hot',
      'sexy',
      'slut',
      'wife',
      'mom',
      'step',
      'new',
      'best',
      'top',
    ].map((s) => s.toLowerCase())
  );

  function normalizeQuery(q) {
    return String(q || '')
      .trim()
      .toLowerCase()
      .replace(/[_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .slice(0, 80);
  }

  function titleCase(q) {
    return String(q || '')
      .split(' ')
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
      .join(' ');
  }

  function extractPerformers(query) {
    const words = normalizeQuery(query)
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
    const names = [];
    for (let i = 0; i < words.length - 1; i++) {
      const a = words[i];
      const b = words[i + 1];
      if (SEARCH_STOP.has(a) || SEARCH_STOP.has(b)) continue;
      if (a.length < 3 || b.length < 2) continue;
      if (/^\d+$/.test(a) || /^\d+$/.test(b)) continue;
      names.push(`${a} ${b}`);
      if (i + 2 < words.length) {
        const c = words[i + 2];
        if (!SEARCH_STOP.has(c) && c.length >= 2 && !/^\d+$/.test(c)) {
          names.push(`${a} ${b} ${c}`);
        }
      }
    }
    if (
      words.length >= 2 &&
      words.length <= 3 &&
      words.every((w) => !SEARCH_STOP.has(w) && w.length >= 2)
    ) {
      names.unshift(words.join(' '));
    }
    return [...new Set(names)];
  }

  function namesFromItem(item) {
    const blobs = [item?.title, ...(item?.tags || [])].filter(Boolean);
    const names = [];
    for (const blob of blobs) names.push(...extractPerformers(blob));
    return [...new Set(names)];
  }

  function learnPerformers(state, names, weight, source) {
    if (!names.length) return;
    if (!Array.isArray(state.performers)) state.performers = [];
    for (const name of names) {
      bumpNamed(state.performers, name, weight, { source });
    }
    state.performers = state.performers.slice(0, 40);
  }

  function bumpNamed(list, key, weight, extra) {
    const found = list.find((x) => x.q === key);
    if (found) {
      found.count = (found.count || 1) + 1;
      found.ts = Date.now();
      found.weight = (found.weight || 0) + weight;
      Object.assign(found, extra || {});
    } else {
      list.unshift({
        q: key,
        count: 1,
        ts: Date.now(),
        weight,
        ...(extra || {}),
      });
    }
  }

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
    learnPerformers(state, namesFromItem(item), 4, 'like');
    delete state.skips[item.id];
    if (state.dislikes) delete state.dislikes[item.id];
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
    learnPerformers(state, namesFromItem(item), 5, 'bookmark');
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

  /** Fresh dislike store — does not reuse old accidental skips. */
  function dislike(item) {
    const state = load();
    if (!state.dislikes) state.dislikes = {};
    state.dislikes[item.id] = {
      ts: Date.now(),
      tags: item.tags || [],
      title: item.title || '',
    };
    bumpTags(state, item.tags, -4);
    const words = String(item.title || '')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 3 && w.length < 24 && !SEARCH_STOP.has(w));
    bumpTags(state, words.slice(0, 5), -2);
    state.likes = state.likes.filter((x) => x.id !== item.id);
    return save(state);
  }

  function isDisliked(id) {
    const state = load();
    return Boolean(state.dislikes && state.dislikes[id]);
  }

  function trackSearch(query, source = 'tubes') {
    const key = normalizeQuery(query);
    if (!key || key.length < 2) return load();
    const state = load();
    if (!Array.isArray(state.searches)) state.searches = [];
    if (!Array.isArray(state.performers)) state.performers = [];
    const weight = source === 'tubes' ? 5 : 2;
    bumpNamed(state.searches, key, weight, { source });
    state.searches = state.searches.slice(0, 80);
    const performers = extractPerformers(key);
    for (const name of performers) {
      bumpNamed(state.performers, name, weight + 3, { source });
    }
    state.performers = state.performers.slice(0, 40);
    bumpTags(state, performers.length ? performers : [key], weight);
    return save(state);
  }

  function topSearches(n = 12) {
    const state = load();
    const scored = [];
    for (const p of state.performers || []) {
      scored.push({
        tag: p.q,
        label: titleCase(p.q),
        weight: (p.weight || 0) + (p.count || 1) * 3,
        kind: 'performer',
        ts: p.ts || 0,
      });
    }
    for (const s of state.searches || []) {
      if (scored.some((x) => x.tag === s.q)) continue;
      scored.push({
        tag: s.q,
        label: titleCase(s.q),
        weight: s.weight || s.count || 1,
        kind: 'search',
        ts: s.ts || 0,
      });
    }
    return scored
      .filter((x) => x.weight > 0)
      .sort((a, b) => b.weight - a.weight || b.ts - a.ts)
      .slice(0, n);
  }

  /**
   * Unified search phrases for cross-feed recs: tube searches, gif
   * likes/bookmarks, clicked titles, minus disliked names.
   */
  function recommendationQueries(n = 4) {
    const seen = new Map();
    const now = Date.now();

    function add(q, weight, kind, ts) {
      const key = normalizeQuery(q);
      if (!key || key.length < 2) return;
      if (
        ['a', 'an', 'the', 'and', 'or', 'of', 'porn', 'sex', 'video', 'videos', 'gif', 'gifs'].includes(
          key
        )
      ) {
        return;
      }
      if (kind === 'performer' && SEARCH_STOP.has(key)) return;
      const prev = seen.get(key);
      if (prev) {
        prev.weight += weight;
        prev.ts = Math.max(prev.ts || 0, ts || 0);
        return;
      }
      seen.set(key, {
        tag: key,
        label: titleCase(key),
        weight,
        kind: kind || 'search',
        ts: ts || now,
      });
    }

    for (const s of topSearches(12)) {
      add(s.tag, s.weight || 1, s.kind, s.ts);
    }
    for (const t of topTags(8)) {
      add(t.tag, t.weight || 1, 'tag');
    }

    const state = load();
    for (const item of [...(state.likes || []), ...(state.bookmarks || [])]) {
      for (const name of namesFromItem(item)) add(name, 6, 'performer', item.ts);
      for (const t of (item.tags || []).slice(0, 4)) {
        const tag = normalizeQuery(t);
        if (!tag || tag.length < 3) continue;
        if (tag.split(' ').length >= 2) add(tag, 4, 'tag', item.ts);
        else add(tag, 2, 'tag', item.ts);
      }
    }
    for (const click of (state.avClicks || []).slice(0, 24)) {
      for (const name of extractPerformers(click.title)) {
        add(name, 3, 'performer', click.ts);
      }
    }
    for (const d of Object.values(state.dislikes || {})) {
      for (const name of namesFromItem(d)) add(name, -10, 'dislike', d.ts);
    }

    return [...seen.values()]
      .filter((x) => x.weight > 0)
      .sort((a, b) => b.weight - a.weight || (b.ts || 0) - (a.ts || 0))
      .slice(0, n);
  }

  function tasteBlurb() {
    const searches = topSearches(10);
    const stars = searches.filter((s) => s.kind === 'performer').slice(0, 8);
    const tags = topTags(8);
    const clicks = (load().avClicks || []).slice(0, 8);
    const likes = (load().likes || []).slice(0, 6);
    const lines = [];
    if (stars.length) {
      lines.push(`stars he searches: ${stars.map((s) => s.label).join(', ')}`);
    }
    if (searches.length) {
      lines.push(`recent tube/gif searches: ${searches.map((s) => s.tag).join(', ')}`);
    }
    if (tags.length) {
      lines.push(`liked tags: ${tags.map((t) => t.tag).join(', ')}`);
    }
    const titles = [
      ...clicks.map((c) => c.title).filter(Boolean),
      ...likes.map((l) => l.title).filter(Boolean),
    ].slice(0, 10);
    if (titles.length) {
      lines.push(
        `real titles he opened/liked (quote these, do not invent others): ${titles.join(' | ')}`
      );
    }
    if (!lines.length) return '';
    return `(${lines.join('. ')}. stay straight / cis-female only.)`;
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
      .filter((w) => w.length > 3 && w.length < 24 && !SEARCH_STOP.has(w));
    bumpTags(state, words.slice(0, 6), 1);
    const names = extractPerformers(item.title);
    if (names.length) {
      if (!Array.isArray(state.performers)) state.performers = [];
      for (const name of names) bumpNamed(state.performers, name, 2, { source: 'click' });
      state.performers = state.performers.slice(0, 40);
    }
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
    dislike,
    isDisliked,
    trackSearch,
    topSearches,
    extractPerformers,
    recommendationQueries,
    tasteBlurb,
    trackAvClick,
    logOrgasm,
    topTags,
    exportBookmarks,
    titleCase,
    loadChats,
    saveChats,
    newChat,
    getChat,
    setActiveChat,
    upsertChat,
    deleteChat,
  };
})(window);
