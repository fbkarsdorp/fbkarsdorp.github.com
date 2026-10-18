// Small site-wide behaviour: the mobile menu, and the header's state over the
// homepage's dark archive.
(function () {
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

  // World plates: a small pool of lamplight follows the pointer.
  document.querySelectorAll('.world').forEach(function (card) {
    var plate = card.querySelector('.world-plate');
    if (!plate) return;
    card.addEventListener('pointermove', function (e) {
      var r = plate.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  // On the homepage the header sits over the night hero; once the hero has
  // scrolled away it switches to the paper treatment.
  var archive = document.getElementById('archive');
  if (archive && header && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      header.classList.toggle('site-header--night', entries[0].isIntersecting);
    }, { rootMargin: '-56px 0px 0px 0px' }).observe(archive);
  }
})();
