(() => {
  const GREETINGS = {
    pal: 'fuck, you came back. i’m already stroking. tell me what you’re looking at and i’ll talk you stupid.',
    goonette:
      'mmm there you are. i already started without you. sit down. i’m going to take my time with you.',
  };

  const log = document.getElementById('chat-log');
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send');
  const hint = document.getElementById('chat-hint');
  const listEl = document.getElementById('chat-list');
  const sidebar = document.getElementById('chat-sidebar');
  const scrim = document.getElementById('chat-scrim');
  const menuBtn = document.getElementById('chat-menu');

  let activeId = null;

  function personaId() {
    try {
      return localStorage.getItem('buddy_chat_persona') === 'goonette'
        ? 'goonette'
        : 'pal';
    } catch {
      return 'pal';
    }
  }

  function greetingFor(id) {
    return GREETINGS[id] || GREETINGS.pal;
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function closeDrawer() {
    sidebar.classList.remove('is-open');
    scrim.hidden = true;
  }

  function openDrawer() {
    sidebar.classList.add('is-open');
    scrim.hidden = false;
  }

  function titleFromMessages(messages) {
    const firstUser = (messages || []).find((m) => m.role === 'user');
    if (!firstUser) return 'New chat';
    return firstUser.content.replace(/\s+/g, ' ').slice(0, 42);
  }

  function renderList() {
    const { chats, activeId: cur } = window.BuddyPrefs.loadChats();
    listEl.innerHTML = chats
      .map((c) => {
        const title = escapeHtml(c.title || 'New chat');
        const on = c.id === cur ? 'is-active' : '';
        return `<li>
          <button type="button" class="chat-item ${on}" data-open="${c.id}">${title}</button>
          <button type="button" class="chat-del" data-del="${c.id}" aria-label="Delete chat">✕</button>
        </li>`;
      })
      .join('');
  }

  function renderLog(messages) {
    log.innerHTML = '';
    (messages || []).forEach((m) => {
      const div = document.createElement('div');
      div.className = `bubble bubble-${m.role === 'user' ? 'user' : 'assistant'}`;
      div.innerHTML = `<p>${escapeHtml(m.content).replace(/\n/g, '<br />')}</p>`;
      log.appendChild(div);
    });
    log.scrollTop = log.scrollHeight;
  }

  function loadActive(id) {
    const chat = window.BuddyPrefs.getChat(id);
    if (!chat) return;
    activeId = chat.id;
    window.BuddyPrefs.setActiveChat(chat.id);
    renderLog(chat.messages);
    renderList();
    closeDrawer();
  }

  function ensureChat() {
    const state = window.BuddyPrefs.loadChats();
    if (state.activeId && window.BuddyPrefs.getChat(state.activeId)) {
      loadActive(state.activeId);
      return;
    }
    if (state.chats[0]) {
      loadActive(state.chats[0].id);
      return;
    }
    const { chat } = window.BuddyPrefs.newChat(greetingFor(personaId()));
    window.BuddyPrefs.upsertChat(chat.id, { persona: personaId() });
    loadActive(chat.id);
  }

  function prefsBlurb() {
    if (window.BuddyPrefs?.tasteBlurb) return window.BuddyPrefs.tasteBlurb();
    const tags = (window.BuddyPrefs.topTags(8) || []).map((t) => t.tag).join(', ');
    if (!tags) return '';
    return `(liked tags: ${tags}. stay straight / cis-female only.)`;
  }

  document.getElementById('chat-new').addEventListener('click', () => {
    const { chat } = window.BuddyPrefs.newChat(greetingFor(personaId()));
    window.BuddyPrefs.upsertChat(chat.id, { persona: personaId() });
    loadActive(chat.id);
  });

  listEl.addEventListener('click', (e) => {
    const open = e.target.closest('[data-open]');
    if (open) {
      loadActive(open.dataset.open);
      return;
    }
    const del = e.target.closest('[data-del]');
    if (del) {
      e.stopPropagation();
      window.BuddyPrefs.deleteChat(del.dataset.del);
      const state = window.BuddyPrefs.loadChats();
      if (state.activeId) loadActive(state.activeId);
      else {
        const { chat } = window.BuddyPrefs.newChat(greetingFor(personaId()));
        window.BuddyPrefs.upsertChat(chat.id, { persona: personaId() });
        loadActive(chat.id);
      }
    }
  });

  menuBtn.addEventListener('click', openDrawer);
  scrim.addEventListener('click', closeDrawer);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || !activeId) return;
    input.value = '';

    const chat = window.BuddyPrefs.getChat(activeId);
    const messages = [...(chat.messages || []), { role: 'user', content: text, ts: Date.now() }];
    window.BuddyPrefs.upsertChat(activeId, {
      messages,
      title: titleFromMessages(messages),
    });
    renderLog(messages);
    renderList();

    const apiMessages = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, content: m.content }));
    const firstUser = apiMessages.findIndex((m) => m.role === 'user');
    const blurb = prefsBlurb();
    if (blurb && firstUser >= 0) {
      apiMessages[firstUser] = {
        role: 'user',
        content: `${apiMessages[firstUser].content}\n\n${blurb}`,
      };
    }

    sendBtn.disabled = true;
    try {
      const headers = { 'Content-Type': 'application/json' };
      try {
        const pw = localStorage.getItem('av_search_password');
        if (pw) headers['X-Search-Password'] = pw;
      } catch {
        /* ignore */
      }
      const res = await fetch('/api/buddy', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: apiMessages,
          persona: (chat && chat.persona) || personaId(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.message || data.error || `Request failed (${res.status})`;
        const failed = [
          ...messages,
          { role: 'assistant', content: msg, ts: Date.now() },
        ];
        window.BuddyPrefs.upsertChat(activeId, { messages: failed });
        renderLog(failed);
        hint.hidden = false;
        hint.textContent = msg;
        hint.classList.add('is-on');
        return;
      }
      const reply = data.reply || '…';
      const next = [
        ...messages,
        { role: 'assistant', content: reply, ts: Date.now() },
      ];
      window.BuddyPrefs.upsertChat(activeId, { messages: next });
      renderLog(next);
      renderList();
      if (data.provider) {
        hint.hidden = true;
        hint.classList.remove('is-on');
      }
    } catch (err) {
      hint.hidden = false;
      hint.classList.add('is-on');
      hint.textContent = err.message || String(err);
    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit();
    }
  });

  window.addEventListener('buddy-settings', () => {
    const next = personaId();
    if (!activeId) return;
    const chat = window.BuddyPrefs.getChat(activeId);
    if (!chat) return;
    const msgs = chat.messages || [];
    const onlyGreeting =
      msgs.length <= 1 && msgs.every((m) => m.role === 'assistant');
    const patch = { persona: next };
    if (onlyGreeting) {
      patch.messages = [
        { role: 'assistant', content: greetingFor(next), ts: Date.now() },
      ];
    }
    window.BuddyPrefs.upsertChat(activeId, patch);
    if (onlyGreeting) renderLog(patch.messages);
  });
  ensureChat();
})();
