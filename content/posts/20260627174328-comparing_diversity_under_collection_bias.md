+++
title = "Comparing diversity under collection bias"
author = ["Folgert Karsdorp"]
date = 2026-06-27T17:43:28+02:00
lastmod = 2026-06-27T17:43:28+02:00
tags = ["diversity", "coverage", "collection", "bias", "interactive"]
description = "An interactive companion to our Royal Society Interface paper on collection bias: set up two assemblages, bias how their records were collected, and see which standardization strategy still recovers the true diversity ratio."
draft = false
+++

<iframe id="cov-demo" src="/demos/coverage-standardization.html"
        title="Interactive demo: comparing diversity under collection bias"
        loading="lazy" scrolling="no"
        style="width:100%;height:1600px;border:0;display:block;overflow:hidden;"></iframe>

<!-- floating ratio readout: pinned to the window while the demo is on-screen,
     fed live by the demo (the iframe can't pin one itself — see the demo's
     reportActiveRatio / cov-demo-ratio message). -->
<div id="cov-ratio-chip" aria-hidden="true">
  <div class="crc-row crc-true"><span class="crc-k">True&nbsp;A&nbsp;:&nbsp;B</span><span class="crc-v" id="crc-true">–</span></div>
  <div class="crc-row"><span class="crc-k" id="crc-method">—</span><span class="crc-v" id="crc-est">–</span><span class="crc-pct" id="crc-pct"></span></div>
</div>

<style>
  #cov-ratio-chip {
    position: fixed; right: 18px; bottom: 18px; z-index: 60;
    background: #fff; border: 1px solid #e3e7ec; border-left: 3px solid #2ca02c;
    border-radius: 10px; box-shadow: 0 6px 22px rgba(17,24,39,.15);
    padding: 9px 13px; min-width: 172px;
    font-family: 'IBM Plex Sans', ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    font-size: 13px; color: #3d4451; line-height: 1.3;
    opacity: 0; transform: translateY(8px); pointer-events: none;
    transition: opacity .22s ease, transform .22s ease;
  }
  #cov-ratio-chip.show { opacity: 1; transform: none; }
  #cov-ratio-chip .crc-row { display: flex; align-items: baseline; gap: 8px; white-space: nowrap; }
  #cov-ratio-chip .crc-true { margin-bottom: 3px; }
  #cov-ratio-chip .crc-k { color: #586472; font-size: 11px; font-weight: 600; letter-spacing: .03em; text-transform: uppercase; }
  #cov-ratio-chip .crc-v { font-variant-numeric: tabular-nums; font-family: 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace; font-weight: 700; margin-left: auto; }
  #cov-ratio-chip .crc-true .crc-v { font-size: 17px; color: #0f1117; }
  #cov-ratio-chip .crc-pct { font-variant-numeric: tabular-nums; font-weight: 700; font-size: 12px; padding: 1px 7px; border-radius: 999px; color: #586472; }
  #cov-ratio-chip.good { border-left-color: #2e9e3f; } #cov-ratio-chip.good .crc-pct { color: #2e9e3f; background: #eaf6ec; }
  #cov-ratio-chip.warn { border-left-color: #c08214; } #cov-ratio-chip.warn .crc-pct { color: #c08214; background: #faf1df; }
  #cov-ratio-chip.bad  { border-left-color: #d6453a; } #cov-ratio-chip.bad  .crc-pct { color: #d6453a; background: #fdecea; }
  @media (max-width: 600px) {
    #cov-ratio-chip { right: 8px; bottom: 8px; padding: 7px 10px; font-size: 12px; min-width: 0; }
    #cov-ratio-chip .crc-true .crc-v { font-size: 15px; }
  }
  @media (prefers-reduced-motion: reduce) { #cov-ratio-chip { transition: opacity .15s ease; transform: none; } }
</style>

<script>
(function () {
  var f = document.getElementById("cov-demo");
  if (!f) return;
  var chip = document.getElementById("cov-ratio-chip");
  // Reparent to <body> so position:fixed pins to the viewport even if a content
  // ancestor establishes a containing block (transform/filter/perspective).
  if (chip && chip.parentNode !== document.body) document.body.appendChild(chip);
  var inView = false, armed = false, readoutBox = null;   // armed: user has touched the demo at least once

  // Is the demo's own ratio readout currently within the viewport? If so, the
  // floating chip is redundant, so we hide it and only surface it when the real
  // readout has scrolled out of view (e.g. while you're up looking at the graphs).
  function readoutOnScreen() {
    if (!readoutBox) return true;                 // position unknown yet → assume visible (chip stays hidden)
    var ir = f.getBoundingClientRect();
    var top = ir.top + readoutBox.top;
    var bot = top + readoutBox.height;
    var vh = window.innerHeight || document.documentElement.clientHeight;
    return bot > 0 && top < vh;
  }
  function sync() {
    var on = inView && armed && !readoutOnScreen();
    if (chip) { chip.classList.toggle("show", on); chip.setAttribute("aria-hidden", on ? "false" : "true"); }
  }
  function setNum(id, v) {
    var el = document.getElementById(id);
    if (el) el.textContent = (typeof v === "number") ? v.toFixed(2) : "–";
  }
  window.addEventListener("message", function (e) {
    var d = e && e.data; if (!d) return;
    if (d.type === "cov-demo-height" && typeof d.height === "number" && d.height > 200) {
      f.style.height = (d.height + 2) + "px";
    } else if (d.type === "cov-demo-readout" && typeof d.top === "number") {
      readoutBox = { top: d.top, height: d.height || 0 };
      sync();
    } else if (d.type === "cov-demo-ratio" && chip) {
      setNum("crc-true", d.trueRatio);
      setNum("crc-est", d.est);
      var m = document.getElementById("crc-method"); if (m) m.textContent = d.method || "—";
      var p = document.getElementById("crc-pct"); if (p) p.textContent = d.pct || "";
      chip.classList.remove("good", "warn", "bad");
      if (d.cls === "good" || d.cls === "warn" || d.cls === "bad") chip.classList.add(d.cls);
      if (d.interacted) armed = true;   // stay dormant until the first slider/method/preset action
      sync();
    }
  });
  // Whether the readout is on screen depends on the article's scroll position,
  // which the demo can't see — so re-check here on scroll/resize (rAF-throttled).
  var ticking = false;
  function onScrollResize() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { ticking = false; sync(); });
  }
  window.addEventListener("scroll", onScrollResize, { passive: true });
  window.addEventListener("resize", onScrollResize);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { inView = es[0].isIntersecting; sync(); }, { threshold: 0 }).observe(f);
  } else { inView = true; sync(); }
})();
</script>
