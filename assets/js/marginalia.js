// Marginalia: the reader's own highlighter.
//
// In a Fragment, selecting text inside a plain paragraph, list item or quote
// shows a small "Mark" button at the end of the selection; a mark is the
// site's yellow highlighter over that text, with a small dated note in the
// right margin on wide screens. Hovering (or tapping) a mark shows a × to
// remove it, with "Undo" for a few seconds. On the homepage, the hero lists what this
// reader has marked (".mg-reading", hidden until there is something).
//
// Marks live only in this browser (localStorage, key "marginalia:v1") and are
// never sent anywhere. A mark is stored as its block's position among the
// markable blocks plus character offsets and the exact text; if a post is
// edited and the text no longer matches, the mark is dropped, never moved.
// Text inside MathJax output, code and tables is never markable, and marks are
// restored only after MathJax has typeset the page, so offsets stay stable.
(function () {
  var KEY = 'marginalia:v1';
  var BLOCKS = 'p, li, blockquote';
  // Containers a markable block may sit in, between it and .prose. Anything
  // else (a demo's own <div>, a table) rules the block out.
  var CHAIN = { UL: 1, OL: 1, LI: 1, BLOCKQUOTE: 1, FIGURE: 1, FIGCAPTION: 1 };
  var SKIP = 'mjx-container, script, style, code, pre, table';

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  function save(all) {
    try { localStorage.setItem(KEY, JSON.stringify(all)); } catch (e) {}
  }
  function day(t) {
    return new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  // ---------- homepage: "Your reading" ----------
  var reading = document.querySelector('.mg-reading');
  if (reading) {
    var all = load(), pages = [], passages = 0;
    Object.keys(all).forEach(function (path) {
      var p = all[path];
      if (p && p.marks && p.marks.length) { pages.push({ path: path, p: p }); passages += p.marks.length; }
    });
    if (pages.length) {
      pages.sort(function (a, b) {
        return Math.max.apply(null, b.p.marks.map(function (m) { return m.t; })) -
               Math.max.apply(null, a.p.marks.map(function (m) { return m.t; }));
      });
      var head = document.createElement('p');
      head.className = 'mg-reading-head';
      head.textContent = 'You marked ' + passages + (passages === 1 ? ' passage' : ' passages') +
        ' in ' + pages.length + (pages.length === 1 ? ' fragment' : ' fragments');
      var ul = document.createElement('ul');
      pages.slice(0, 5).forEach(function (x) {
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = x.path + '#mark-' + x.p.marks[0].id;
        a.textContent = x.p.title || x.path;
        var n = document.createElement('span');
        n.textContent = x.p.marks.length;
        li.appendChild(a); li.appendChild(n); ul.appendChild(li);
      });
      reading.appendChild(head);
      reading.appendChild(ul);
      reading.hidden = false;
    }
    return;
  }

  // ---------- a Fragment ----------
  var article = document.querySelector('[data-mg-page]');
  var prose = article && article.querySelector('.prose');
  if (!prose) return;
  var path = article.getAttribute('data-mg-page');
  var title = article.getAttribute('data-mg-title') || document.title;
  var ready = false;
  var blocks = [];

  function eligible(el) {
    if (el.closest(SKIP)) return false;
    if (el.querySelector(BLOCKS)) return false;          // only innermost blocks
    for (var p = el.parentElement; p && p !== prose; p = p.parentElement) {
      if (!CHAIN[p.tagName] && !(p.tagName === 'DIV' && p.classList.contains('footnotes'))) return false;
    }
    return !!p;
  }
  function collect() {
    blocks = Array.prototype.filter.call(prose.querySelectorAll(BLOCKS), eligible);
  }
  function texts(block) {
    var out = [], w = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        return n.parentElement.closest(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });
    while (w.nextNode()) out.push(w.currentNode);
    return out;
  }
  function plain(block) {
    return texts(block).map(function (t) { return t.data; }).join('');
  }
  // Character offset of a range boundary within a block's markable text.
  function offset(block, node, off) {
    var pre = document.createRange();
    pre.setStart(block, 0);
    pre.setEnd(node, off);
    var total = 0, list = texts(block);
    for (var i = 0; i < list.length; i++) {
      var t = list[i];
      if (t === node) return total + off;
      if (pre.isPointInRange(t, t.length)) total += t.length; else break;
    }
    return total;
  }
  function wrap(block, start, end, mark) {
    var pos = 0, made = [];
    texts(block).forEach(function (t) {
      var a = pos, b = pos + t.length;
      pos = b;
      if (b <= start || a >= end) return;
      var s = Math.max(start, a) - a, e = Math.min(end, b) - a;
      var piece = t;
      if (s > 0) piece = piece.splitText(s);
      if (e - s < piece.length) piece.splitText(e - s);
      var m = document.createElement('mark');
      m.className = 'mg-mark';
      m.dataset.mg = mark.id;
      piece.parentNode.insertBefore(m, piece);
      m.appendChild(piece);
      made.push(m);
    });
    if (made.length) {
      made[0].id = 'mark-' + mark.id;
      made[0].title = 'Marked ' + day(mark.t);
    }
    return made;
  }
  function unwrap(id) {
    prose.querySelectorAll('mark.mg-mark[data-mg="' + id + '"]').forEach(function (m) {
      var parent = m.parentNode;
      while (m.firstChild) parent.insertBefore(m.firstChild, m);
      parent.removeChild(m);
      parent.normalize();
    });
  }

  function marks() {
    var all = load();
    return (all[path] && all[path].marks) || [];
  }
  function store(list) {
    var all = load();
    if (list.length) all[path] = { title: title, marks: list }; else delete all[path];
    save(all);
  }

  // ---------- margin notes ----------
  var notes = document.createElement('div');
  notes.className = 'mg-notes';
  notes.setAttribute('aria-hidden', 'true');
  prose.appendChild(notes);
  function layout() {
    notes.textContent = '';
    var base = prose.getBoundingClientRect().top, floor = -Infinity;
    marks().slice().map(function (m) {
      var el = document.getElementById('mark-' + m.id);
      return el ? { m: m, top: el.getBoundingClientRect().top - base } : null;
    }).filter(Boolean).sort(function (a, b) { return a.top - b.top; }).forEach(function (x) {
      var n = document.createElement('span');
      n.className = 'mg-note';
      n.textContent = 'Marked ' + day(x.m.t);
      var top = Math.max(x.top, floor);
      n.style.top = top + 'px';
      notes.appendChild(n);
      floor = top + n.offsetHeight + 6;
    });
  }

  function restore() {
    collect();
    var kept = marks().filter(function (m) {
      var block = blocks[m.b];
      if (!block) return false;
      var text = plain(block);
      if (text.slice(m.s, m.e) !== m.x) {
        var at = text.indexOf(m.x);
        if (at < 0 || text.indexOf(m.x, at + 1) >= 0) return false;   // gone, or ambiguous
        m.s = at; m.e = at + m.x.length;
      }
      return wrap(block, m.s, m.e, m).length > 0;
    });
    store(kept);
    layout();
    ready = true;
    var h = location.hash.match(/^#mark-([\w-]+)$/);
    if (h) {
      var el = document.getElementById('mark-' + h[1]);
      if (el) {
        el.scrollIntoView({ block: 'center' });
        prose.querySelectorAll('mark.mg-mark[data-mg="' + h[1] + '"]').forEach(function (m) {
          m.classList.add('mg-flash');
        });
      }
    }
  }

  // ---------- marking and unmarking ----------
  // "Mark" appears at the end of a finished selection (after the pointer or
  // shift-key is released, so not mid-drag) and goes away on any other click,
  // scroll, Esc, or after a few seconds. Hovering a mark shows a small × at its
  // end; removing is immediate, with "Undo" in a note at the bottom.
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    e.className = cls; if (text) e.textContent = text; e.hidden = true;
    document.body.appendChild(e); return e;
  }
  var markBtn = el('button', 'mg-mark-btn', 'Mark');
  var xBtn = el('button', 'mg-x', '×');
  var toast = el('div', 'mg-toast');
  markBtn.type = xBtn.type = 'button';
  xBtn.setAttribute('aria-label', 'Remove this mark');
  toast.setAttribute('role', 'status');
  var pending = null, xFor = null, timers = {};

  function later(name, fn, ms) { clearTimeout(timers[name]); timers[name] = setTimeout(fn, ms); }
  function at(btn, x, y) {
    btn.hidden = false;
    var w = btn.offsetWidth, h = btn.offsetHeight, vw = document.documentElement.clientWidth;
    x = Math.min(Math.max(8, x), vw - w - 8);
    btn.style.left = (x + window.scrollX) + 'px';
    btn.style.top = (y - h / 2 + window.scrollY) + 'px';
  }
  // narrower screens: above the end of the selection, clear of the words that follow
  function above(btn, r) {
    btn.hidden = false;
    var w = btn.offsetWidth, h = btn.offsetHeight, vw = document.documentElement.clientWidth;
    var x = Math.min(Math.max(8, r.right - w / 2), vw - w - 8);
    var y = r.top - h - 6;
    if (y < 70) y = r.bottom + 6;
    btn.style.left = (x + window.scrollX) + 'px';
    btn.style.top = (y + window.scrollY) + 'px';
  }
  function lastRect(range) {
    var rects = range.getClientRects();
    return rects.length ? rects[rects.length - 1] : range.getBoundingClientRect();
  }
  function hideMark() { markBtn.hidden = true; pending = null; clearTimeout(timers.mark); }
  function hideX() { xBtn.hidden = true; xFor = null; clearTimeout(timers.x); }

  function offerMark() {
    var p = fromSelection();
    if (!p) { hideMark(); return; }
    pending = p;
    var r = lastRect(p.range);
    if (getComputedStyle(notes).display !== 'none') {
      // wide screens: in the margin, on the line where the note will go
      at(markBtn, prose.getBoundingClientRect().right + 40, r.top + r.height / 2);
    } else {
      above(markBtn, r);
    }
    later('mark', hideMark, 4500);
  }
  function fromSelection() {
    var sel = window.getSelection();
    if (!ready || !sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
    var r = sel.getRangeAt(0);
    var node = r.commonAncestorContainer;
    var el = node.nodeType === 1 ? node : node.parentElement;
    var block = null;
    for (var p = el; p && p !== prose; p = p.parentElement) {
      if (blocks.indexOf(p) >= 0) { block = p; break; }
    }
    if (!block) return null;
    var frag = r.cloneContents();
    if (frag.querySelector && frag.querySelector('mjx-container, mark.mg-mark, code, pre')) return null;
    if (el.closest('mjx-container, mark.mg-mark, code')) return null;
    var s = offset(block, r.startContainer, r.startOffset);
    var e = offset(block, r.endContainer, r.endOffset);
    var x = plain(block).slice(s, e);
    if (x.trim().length < 3) return null;
    return { block: block, s: s, e: e, x: x, range: r };
  }

  // a finished selection: pointer released, or shift released after keyboard selection
  var lastPointer = 'mouse';
  document.addEventListener('pointerdown', function (e) {
    lastPointer = e.pointerType;
    if (e.target !== markBtn) hideMark();
    if (e.target !== xBtn && !e.target.closest('mark.mg-mark')) hideX();
  });
  document.addEventListener('pointerup', function () { setTimeout(offerMark, 10); });
  document.addEventListener('keyup', function (e) { if (e.key === 'Shift') offerMark(); });
  // touch: the selection handles keep moving after pointerup, so follow them
  document.addEventListener('selectionchange', function () {
    var sel = window.getSelection();
    if (!sel || sel.isCollapsed) { hideMark(); return; }
    if (lastPointer === 'touch') later('touch', offerMark, 450);
  });
  window.addEventListener('scroll', function () { hideMark(); hideX(); }, { passive: true });
  window.addEventListener('resize', function () { hideMark(); hideX(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { hideMark(); hideX(); } });

  markBtn.addEventListener('pointerdown', function (e) { e.preventDefault(); });   // keep the selection
  markBtn.addEventListener('click', function () {
    if (!pending) return;
    var list = marks();
    var mark = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      b: blocks.indexOf(pending.block), s: pending.s, e: pending.e, x: pending.x, t: Date.now()
    };
    var made = wrap(pending.block, mark.s, mark.e, mark);
    if (made.length) {
      list.push(mark);
      made.forEach(function (m) { m.classList.add('mg-new'); });
    }
    window.getSelection().removeAllRanges();
    store(list);
    hideMark();
    layout();
  });

  // hovering a mark shows × at its end
  function offerX(id) {
    var parts = prose.querySelectorAll('mark.mg-mark[data-mg="' + id + '"]');
    if (!parts.length) return;
    var rects = parts[parts.length - 1].getClientRects();
    var r = rects[rects.length - 1];
    xFor = id;
    // a badge on the mark's top-right corner, clear of the next word
    at(xBtn, r.right - 6, r.top - 3);
  }
  prose.addEventListener('mouseover', function (e) {
    var m = e.target.closest('mark.mg-mark');
    if (!m || (window.getSelection() && !window.getSelection().isCollapsed)) return;
    clearTimeout(timers.x);
    if (xFor !== m.dataset.mg) offerX(m.dataset.mg);
  });
  prose.addEventListener('mouseout', function (e) {
    if (e.target.closest('mark.mg-mark')) later('x', hideX, 350);
  });
  xBtn.addEventListener('mouseenter', function () { clearTimeout(timers.x); });
  xBtn.addEventListener('mouseleave', function () { later('x', hideX, 350); });
  prose.addEventListener('click', function (e) {          // touch: tap a mark to get its ×
    var m = e.target.closest('mark.mg-mark');
    if (!m || e.target.closest('a') || lastPointer === 'mouse') return;
    offerX(m.dataset.mg);
    later('x', hideX, 3500);
  });

  xBtn.addEventListener('click', function () {
    if (!xFor) return;
    var id = xFor, list = marks(), gone = null;
    list = list.filter(function (m) { if (m.id === id) { gone = m; return false; } return true; });
    unwrap(id);
    store(list);
    hideX();
    layout();
    if (gone) undoable(gone);
  });
  function undoable(mark) {
    toast.textContent = 'Mark removed ';
    var undo = document.createElement('button');
    undo.type = 'button';
    undo.textContent = 'Undo';
    undo.addEventListener('click', function () {
      collect();
      var block = blocks[mark.b];
      if (block && wrap(block, mark.s, mark.e, mark).length) {
        var list = marks(); list.push(mark); store(list); layout();
      }
      toast.hidden = true;
    });
    toast.appendChild(undo);
    toast.hidden = false;
    later('toast', function () { toast.hidden = true; }, 5000);
  }

  // Restore once MathJax has typeset (it replaces the TeX text marks are anchored to).
  var done = false;
  function go() { if (!done) { done = true; restore(); } }
  function whenTypeset() {
    var mj = window.MathJax;
    if (mj && mj.startup && mj.startup.promise) { mj.startup.promise.then(go, go); return; }
    var s = document.getElementById('MathJax-script');
    if (s && mj) { s.addEventListener('load', whenTypeset); s.addEventListener('error', go); setTimeout(go, 6000); return; }
    go();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', whenTypeset); else whenTypeset();
})();
