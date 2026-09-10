/**
 * Swipe down (or wheel down) in the gif player to open the next clip.
 */
(function (global) {
  function bind(opts) {
    const layer = opts.layer;
    const modal = opts.modal;
    if (!layer || !modal) return;

    let startY = 0;
    let startX = 0;
    let tracking = false;
    let lastFire = 0;

    function gated(fn) {
      const now = Date.now();
      if (now - lastFire < 480) return;
      lastFire = now;
      Promise.resolve(fn()).catch(() => {});
    }

    layer.addEventListener('pointerdown', (e) => {
      if (!modal.open) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      tracking = true;
      startY = e.clientY;
      startX = e.clientX;
      try {
        layer.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    });

    function endPointer(e) {
      if (!tracking) return;
      tracking = false;
      const dy = e.clientY - startY;
      const dx = e.clientX - startX;
      if (Math.abs(dy) < 64 || Math.abs(dy) < Math.abs(dx) * 1.2) return;
      if (dy > 0) gated(opts.next);
      else gated(opts.prev);
    }

    layer.addEventListener('pointerup', endPointer);
    layer.addEventListener('pointercancel', () => {
      tracking = false;
    });

    layer.addEventListener(
      'wheel',
      (e) => {
        if (!modal.open) return;
        if (Math.abs(e.deltaY) < 28) return;
        if (e.deltaY > 0) gated(opts.next);
        else gated(opts.prev);
      },
      { passive: true }
    );

    document.addEventListener('keydown', (e) => {
      if (!modal.open) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        gated(opts.next);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        gated(opts.prev);
      }
    });
  }

  global.BuddyGifSwipe = { bind };
})(window);
