// Call slips on the Publications page.
//
// Clicking a citation (or its "+" beside the year) unfolds a library call slip
// under it: the first page, title, every author, venue, the full abstract, and
// buttons to copy a clean BibTeX entry or the formatted citation. One slip is
// open at a time; the open slip is in the URL as #ref-<bibkey> (the id pandoc
// gives each entry), so a slip can be linked to directly. The data (built in
// layouts/_default/pubs.html from data/slips.json, publications.json and
// covers.json) is one JSON file, fetched the first time a slip is opened.
//
// Runs after the page's inline script, which has already wrapped each entry's
// citation in .pub-text and put the year in .pub-year.
(function () {
  var pubs = document.querySelector('.pubs[data-slips]');
  if (!pubs) return;
  var me = pubs.getAttribute('data-me') || '';
  var data = null, loading = null, open = null;

  function load() {
    if (data) return Promise.resolve(data);
    if (!loading) {
      loading = fetch(pubs.getAttribute('data-slips'))
        .then(function (r) { return r.json(); })
        .then(function (list) {
          data = {};
          list.forEach(function (e) { data[e.key] = e; });
          return data;
        });
    }
    return loading;
  }
  function keyOf(entry) { return entry.id.replace(/^ref-/, ''); }
  function make(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  // a "+" beside each year
  var entries = Array.prototype.slice.call(pubs.querySelectorAll('.csl-entry[id^="ref-"]'));
  entries.forEach(function (entry) {
    var year = entry.querySelector('.pub-year');
    var text = entry.querySelector('.pub-text');
    var b = make('button', 'pub-toggle', '+');
    b.type = 'button';
    b.setAttribute('aria-expanded', 'false');
    b.setAttribute('aria-controls', 'slip-' + keyOf(entry));
    b.setAttribute('aria-label', 'Open the call slip for ' + ((text && text.textContent.trim().slice(0, 80)) || 'this publication'));
    (year || entry).appendChild(b);
  });

  // the formatted citation as plain text, with link labels turned back into URLs
  function citation(entry) {
    var t = entry.querySelector('.pub-text').cloneNode(true);
    t.querySelectorAll('a.pub-link').forEach(function (a) { a.textContent = a.getAttribute('href'); });
    return t.textContent.replace(/\s+/g, ' ').trim();
  }

  function copy(btn, text) {
    var done = function () {
      var was = btn.textContent;
      btn.textContent = 'Copied';
      btn.classList.add('is-done');
      setTimeout(function () { btn.textContent = was; btn.classList.remove('is-done'); }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallback(text) && done(); });
    } else if (fallback(text)) {
      done();
    }
  }
  function fallback(text) {
    var ta = make('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    return ok;
  }

  function slip(entry, e) {
    var key = keyOf(entry);
    var s = make('div', 'pub-slip');
    s.id = 'slip-' + key;
    s.setAttribute('role', 'region');
    s.setAttribute('aria-label', 'Call slip: ' + (e.title || key));
    var sheet = make('div', 'slip-sheet');

    var head = make('p', 'slip-head');
    head.appendChild(make('span', '', 'Call slip'));
    head.appendChild(make('span', '', [e.label, e.year].filter(Boolean).join(' · ')));
    head.appendChild(make('span', 'slip-no', 'No. ' + key));
    sheet.appendChild(head);

    var grid = make('div', 'slip-grid');
    if (e.tile && e.tile.length) {
      var page = make('span', 'slip-page');
      page.style.setProperty('--tx', e.tile[0]);
      page.style.setProperty('--ty', e.tile[1]);
      page.setAttribute('aria-hidden', 'true');
      grid.appendChild(page);
    }
    var dl = make('dl', 'slip-fields');
    function field(label, value, cls) {
      if (!value) return;
      var row = make('div');
      row.appendChild(make('dt', '', label));
      var dd = make('dd', cls || '');
      if (typeof value === 'string') dd.textContent = value; else dd.appendChild(value);
      row.appendChild(dd);
      dl.appendChild(row);
    }
    field('Title', e.title, 'slip-title');
    if (e.authors && e.authors.length) {
      var names = document.createDocumentFragment();
      e.authors.forEach(function (a, i) {
        if (i) names.appendChild(document.createTextNode(i === e.authors.length - 1 ? ' and ' : ', '));
        if (a === me) names.appendChild(make('span', 'me', a)); else names.appendChild(document.createTextNode(a));
      });
      field(e.authors.length === 1 ? 'Author' : 'Authors', names);
    }
    field('In', e.venue);
    grid.appendChild(dl);
    sheet.appendChild(grid);

    if (e.abstract) sheet.appendChild(make('p', 'slip-abstract', e.abstract));

    var actions = make('div', 'slip-actions');
    if (e.bibtex) {
      var bib = make('button', '', 'Copy BibTeX');
      bib.type = 'button';
      bib.addEventListener('click', function () { copy(bib, e.bibtex); });
      actions.appendChild(bib);
    }
    var cite = make('button', '', 'Copy citation');
    cite.type = 'button';
    cite.addEventListener('click', function () { copy(cite, citation(entry)); });
    actions.appendChild(cite);
    if (e.url) {
      var a = make('a', 'slip-read', /\.pdf($|\?)/i.test(e.url) ? 'Read the PDF ↗' : 'Read it ↗');
      a.href = e.url; a.target = '_blank'; a.rel = 'noopener';
      actions.appendChild(a);
    }
    var close = make('button', 'slip-close', 'Close');
    close.type = 'button';
    close.addEventListener('click', function () { shut(true); });
    actions.appendChild(close);
    sheet.appendChild(actions);

    s.appendChild(sheet);
    return s;
  }

  function shut(focusBack) {
    if (!open) return;
    var entry = open.entry;
    open.slip.remove();
    entry.classList.remove('is-open');
    var t = entry.querySelector('.pub-toggle');
    if (t) { t.setAttribute('aria-expanded', 'false'); t.textContent = '+'; }
    open = null;
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    if (focusBack && t) t.focus();
  }

  function show(entry, scroll) {
    if (open && open.entry === entry) { shut(true); return; }
    shut(false);
    load().then(function (d) {
      var e = d[keyOf(entry)];
      if (!e) return;
      var s = slip(entry, e);
      entry.after(s);
      entry.classList.add('is-open');
      var t = entry.querySelector('.pub-toggle');
      if (t) { t.setAttribute('aria-expanded', 'true'); t.textContent = '−'; }
      open = { entry: entry, slip: s };
      history.replaceState(null, '', '#' + entry.id);
      if (scroll) entry.scrollIntoView({ block: 'start' });
    });
  }

  pubs.addEventListener('click', function (ev) {
    var entry = ev.target.closest('.csl-entry[id^="ref-"]');
    if (!entry) return;
    if (ev.target.closest('a')) return;                        // doi / pdf / link labels
    var sel = window.getSelection();
    if (sel && !sel.isCollapsed && entry.contains(sel.anchorNode)) return;   // copying text
    show(entry, false);
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && open) shut(true);
  });

  // filtering hides entries; a hidden entry takes its slip with it
  var input = document.querySelector('.pubs-filter input');
  if (input) input.addEventListener('input', function () { if (open && open.entry.hidden) shut(false); });

  // #ref-<key> opens that slip
  function fromHash() {
    if (!/^#ref-/.test(location.hash)) return;
    var entry = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (entry && entry.classList.contains('csl-entry') && (!open || open.entry !== entry)) show(entry, true);
  }
  window.addEventListener('hashchange', fromHash);
  fromHash();
})();
