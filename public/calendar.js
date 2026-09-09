(() => {
  const label = document.getElementById('cal-label');
  const grid = document.getElementById('cal-grid');
  const editor = document.getElementById('cal-editor');
  const dayLabel = document.getElementById('cal-day-label');
  const countEl = document.getElementById('cal-count');
  const noteEl = document.getElementById('cal-note');

  let view = new Date();
  view.setDate(1);
  let selected = null;

  function keyFromDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function render() {
    const year = view.getFullYear();
    const month = view.getMonth();
    label.textContent = view.toLocaleString(undefined, {
      month: 'long',
      year: 'numeric',
    });
    const start = new Date(year, month, 1);
    const startPad = start.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const logs = window.BuddyPrefs.load().calendar || {};

    const cells = [];
    for (let i = 0; i < startPad; i++) cells.push('<div class="cal-cell is-empty"></div>');
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const key = keyFromDate(d);
      const entry = logs[key];
      const count = entry?.count || 0;
      cells.push(
        `<button type="button" class="cal-cell ${count ? 'has-log' : ''} ${
          selected === key ? 'is-selected' : ''
        }" data-key="${key}">
          <span class="cal-num">${day}</span>
          ${count ? `<span class="cal-count">${count}</span>` : ''}
        </button>`
      );
    }
    grid.innerHTML = cells.join('');
  }

  function openDay(key) {
    selected = key;
    const entry = (window.BuddyPrefs.load().calendar || {})[key] || {
      count: 1,
      note: '',
    };
    dayLabel.textContent = key;
    countEl.value = entry.count || 1;
    noteEl.value = entry.note || '';
    editor.hidden = false;
    render();
  }

  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-key]');
    if (btn) openDay(btn.dataset.key);
  });

  document.getElementById('cal-prev').addEventListener('click', () => {
    view.setMonth(view.getMonth() - 1);
    render();
  });
  document.getElementById('cal-next').addEventListener('click', () => {
    view.setMonth(view.getMonth() + 1);
    render();
  });
  document.getElementById('cal-save').addEventListener('click', () => {
    if (!selected) return;
    window.BuddyPrefs.logOrgasm(selected, {
      count: Math.max(0, Number(countEl.value) || 0),
      note: noteEl.value.trim(),
    });
    render();
  });

  render();
})();
