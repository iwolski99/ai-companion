(() => {
  const log = document.getElementById('chat-log');
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send');
  const hint = document.getElementById('chat-hint');

  const history = [];

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function addBubble(role, text) {
    const div = document.createElement('div');
    div.className = `bubble bubble-${role}`;
    div.innerHTML = `<p>${escapeHtml(text).replace(/\n/g, '<br />')}</p>`;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }

  function prefsBlurb() {
    const tags = (window.BuddyPrefs?.topTags(8) || [])
      .map((t) => t.tag)
      .join(', ');
    if (!tags) return '';
    return `(My liked tags so far: ${tags}. Stay straight / cis-female only.)`;
  }

  addBubble(
    'assistant',
    'Hey. I’m Buddy — horny, nosy, and here for it. Tell me what you want to edge to and I’ll talk you through it or throw you search ideas.'
  );

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    addBubble('user', text);
    history.push({ role: 'user', content: text });

    const payload = {
      messages: history.slice(),
    };
    const blurb = prefsBlurb();
    if (blurb && payload.messages.length === 1) {
      payload.messages[0] = {
        role: 'user',
        content: `${text}\n\n${blurb}`,
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
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.message || data.error || `Request failed (${res.status})`;
        addBubble('assistant', msg);
        hint.textContent = msg;
        return;
      }
      const reply = data.reply || '…';
      history.push({ role: 'assistant', content: reply });
      addBubble('assistant', reply);
      if (data.provider) {
        hint.textContent = `${data.provider} · ${data.model || 'DeepSeek V4 Flash'}`;
      }
    } catch (err) {
      addBubble('assistant', err.message || String(err));
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
})();
