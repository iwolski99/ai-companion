/**
 * Up / down buttons in the gif player to step through the current grid.
 */
(function (global) {
  function bind(opts) {
    function go(fn) {
      if (typeof fn !== 'function') return;
      Promise.resolve(fn()).catch(() => {});
    }

    opts.prevBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      go(opts.prev);
    });
    opts.nextBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      go(opts.next);
    });
  }

  global.BuddyGifSkip = { bind };
})(window);
