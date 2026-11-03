// Small site-wide behaviour: the "Large text" switch, the mobile menu, the
// playground's turning lead card, and the header's state over the homepage's
// dark archive (only with the older night heroes).
(function () {
  // Large text: scales every rem on the page; remembered per browser. The
  // class itself is set before first paint by an inline script in baseof.html.
  var root = document.documentElement;
  document.querySelectorAll('.large-text-toggle').forEach(function (btn) {
    btn.setAttribute('aria-pressed', root.classList.contains('large-text') ? 'true' : 'false');
    btn.addEventListener('click', function () {
      var on = root.classList.toggle('large-text');
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      try { localStorage.setItem('large-text', on ? '1' : '0'); } catch (e) {}
    });
  });

  var toggle = document.querySelector('.nav-toggle');
  var header = document.querySelector('.site-header');
  if (toggle && header) {
    toggle.addEventListener('click', function () {
      var open = header.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && header.classList.contains('nav-open')) {
        header.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  // Worlds: every few seconds the lead card is shelved at the end and the next
  // world takes its place. Holds still while the grid is pointed at, focused,
  // off screen or in a hidden tab, and never turns for reduced motion.
  var grid = document.querySelector('.worlds-grid');
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (grid && grid.children.length > 1 && !still) {
    var held = false, inView = !('IntersectionObserver' in window), turning = false;
    grid.addEventListener('pointerenter', function () { held = true; });
    grid.addEventListener('pointerleave', function () { held = false; });
    grid.addEventListener('focusin', function () { held = true; });
    grid.addEventListener('focusout', function (e) {
      if (!grid.contains(e.relatedTarget)) held = false;
    });
    if (!inView) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
      }, { threshold: 0.3 }).observe(grid);
    }
    setInterval(function () {
      if (held || !inView || document.hidden || turning) return;
      turning = true;
      grid.classList.add('is-turning');
      setTimeout(function () {
        var lead = grid.firstElementChild;
        lead.classList.remove('world--lead');
        grid.appendChild(lead);
        grid.firstElementChild.classList.add('world--lead');
        grid.classList.remove('is-turning');
        turning = false;
      }, 600);
    }, 9000);
  }

  // On the homepage the header sits over the night hero; once the hero has
  // scrolled away it switches to the paper treatment.
  var archive = document.getElementById('archive');
  if (archive && header && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      header.classList.toggle('site-header--night', entries[0].isIntersecting);
    }, { rootMargin: '-56px 0px 0px 0px' }).observe(archive);
  }
})();
