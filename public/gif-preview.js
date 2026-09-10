/**
 * Mute-loop previews in gif grids. Only clips on screen play, capped
 * so a long feed does not spin up dozens of decoders.
 */
(function (global) {
  const MAX_PLAYING = 6;
  const observed = new Set();
  const visible = new Map();
  let holdForModal = false;
  let holdForTab = false;

  function blocked() {
    return holdForModal || holdForTab;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const video = entry.target;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.2) {
          visible.set(video, entry.intersectionRatio);
        } else {
          visible.delete(video);
        }
      }
      reconcile();
    },
    { threshold: [0, 0.2, 0.4, 0.7, 1], rootMargin: '80px 0px' }
  );

  function start(video) {
    if (blocked()) return;
    const src = video.dataset.src;
    if (!src) return;
    if (video.getAttribute('src') !== src) {
      video.src = src;
    }
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.loop = true;
    const play = video.play();
    if (play && typeof play.catch === 'function') play.catch(() => {});
    video.closest('.rg-thumb')?.classList.add('is-playing');
  }

  function stop(video, unload) {
    video.pause();
    video.closest('.rg-thumb')?.classList.remove('is-playing');
    if (unload) {
      video.removeAttribute('src');
      video.load();
    }
  }

  function reconcile() {
    const ranked = [...visible.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([video]) => video);
    const keep = new Set(blocked() ? [] : ranked.slice(0, MAX_PLAYING));

    for (const video of observed) {
      if (keep.has(video)) {
        if (video.paused || video.getAttribute('src') !== video.dataset.src) {
          start(video);
        }
      } else {
        stop(video, !visible.has(video));
      }
    }
  }

  function scan(root) {
    if (!root) return;
    root.querySelectorAll('video[data-preview]').forEach((video) => {
      if (observed.has(video)) return;
      observed.add(video);
      io.observe(video);
    });
    for (const video of [...observed]) {
      if (!video.isConnected) {
        io.unobserve(video);
        observed.delete(video);
        visible.delete(video);
      }
    }
    reconcile();
  }

  function pauseAll() {
    holdForModal = true;
    reconcile();
  }

  function resume() {
    holdForModal = false;
    reconcile();
  }

  document.addEventListener('visibilitychange', () => {
    holdForTab = document.hidden;
    reconcile();
  });

  global.BuddyGifPreview = { scan, pauseAll, resume };
})(window);
