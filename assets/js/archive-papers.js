// The homepage hero, papers edition: the floating books of the dark archive,
// where every glowing volume is one of the publications in references.bib.
//
// - Every publication floats as its own first page (the page from its PDF via
//   the atlas in data/covers.json, or one typeset here from title, authors and
//   abstract); a book without a PDF stays a bound volume. They are shelved left
//   to right by year over a year axis (with a small histogram; hovering it
//   lights that year's pages).
// - The lamp follows the pointer. The book nearest to it turns to face you and
//   is catalogued in the card under the title, tied to it by a thread; faint
//   threads run to every other book that shares a co-author.
// - Clicking a book (or "Take it out") takes it from the archive: the paper's
//   first page (from data/covers.json, scripts/generate-covers.py, or typeset)
//   or, for a book, a copy in a cloth binding flies forward, the archive dims,
//   and the card shows the abstract. Esc, the button or a click in the dark
//   puts it back.
//   The open book is in the URL (#shelf/<bibkey>), so it can be shared.
// - Left alone, the lamp tours the shelf.
//
// Markup: layouts/partials/hero-papers.html (selected by params.hero in
// config.toml). Data: data/publications.json, written by
// scripts/generate-references.py. three.js is the vendored subset in
// static/js/vendor/three-hero.min.js (rebuilt by scripts/build-three-vendor.sh).

import {
  WebGLRenderer, Scene, PerspectiveCamera, BoxGeometry, InstancedMesh,
  InstancedBufferAttribute, BufferGeometry, BufferAttribute, ShaderMaterial,
  Points, Object3D, Vector2, Vector3, Color, Plane, Raycaster, AdditiveBlending,
  Mesh, MeshBasicMaterial, CanvasTexture, Quaternion, SRGBColorSpace, Group,
} from '/js/vendor/three-hero.min.js';

const root = document.getElementById('archive');
const canvas = root && root.querySelector('.archive-canvas');
const dataEl = document.getElementById('archive-papers-data');
if (root && canvas && dataEl) {
  try { start(JSON.parse(dataEl.textContent)); } catch (err) { console.warn('archive hero disabled:', err); }
}

function start(entries) {
  const papers = (entries || []).filter((e) => e.title && /^\d{4}$/.test(e.year || ''));
  if (!papers.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = getComputedStyle(document.documentElement);
  const token = (name, fallback) => new Color((css.getPropertyValue(name) || fallback).trim());
  const NIGHT = token('--night', '#0c1418');
  const PAPER = token('--paper', '#f3f2ed');
  const VERMILION = token('--vermilion', '#d9412b');
  const LAMP = token('--lamp', '#f2c46d');
  const LAPIS_LIGHT = token('--lapis-light', '#9aabff');
  const KIND = { article: 0, book: 1, other: 2 };
  // Cloth for the reading copies' bindings, per kind (light, dark).
  const CLOTH = { article: ['#7a2418', '#561810'], book: ['#263a8a', '#17235a'], other: ['#6e5016', '#4a350c'] };
  const GILT = '#e2c27a';

  const rand = Math.random;
  const gauss = () => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  // ---------- renderer, camera ----------
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setClearColor(NIGHT, 1);
  const scene = new Scene();
  const camera = new PerspectiveCamera(38, 1, 0.1, 200);
  camera.position.set(0, 0, 34);
  let halfW = 20, halfH = 12;
  let narrow = false;

  // ---------- books: the publications first, then the unlit archive ----------
  const P = papers.length;
  const ATMOS = window.innerWidth < 700 ? 600 : 1100;
  const COUNT = P + ATMOS;

  const geometry = new BoxGeometry(0.38, 0.54, 0.1);
  const mesh = new InstancedMesh(geometry, null, COUNT);
  const quats = new Float32Array(COUNT * 4);         // resting orientation
  const spin = new Float32Array(COUNT * 4);          // tumble axis (xyz) + speed
  const info = new Float32Array(COUNT * 4);          // isPaper, kind, focus 0..1, visited 0..1
  const extra = new Float32Array(COUNT * 2);         // taken (hidden while its reading copy is out), highlight 0..1
  const seeds = new Float32Array(COUNT);
  const q = new Quaternion();
  for (let i = 0; i < COUNT; i++) {
    q.random();
    quats.set([q.x, q.y, q.z, q.w], i * 4);
    const ax = new Vector3(gauss(), gauss(), gauss()).normalize();
    const slow = i < P ? 0.35 : 1;                    // publications tumble slowly, so they can be read
    spin.set([ax.x, ax.y, ax.z, (0.08 + rand() * 0.2) * slow * (rand() < 0.5 ? -1 : 1)], i * 4);
    seeds[i] = rand();
    if (i < P) info.set([1, KIND[papers[i].kind] ?? 2, 0, 0], i * 4);
  }
  const infoAttr = new InstancedBufferAttribute(info, 4);
  const extraAttr = new InstancedBufferAttribute(extra, 2);
  geometry.setAttribute('aQuat', new InstancedBufferAttribute(quats, 4));
  geometry.setAttribute('aSpin', new InstancedBufferAttribute(spin, 4));
  geometry.setAttribute('aInfo', infoAttr);
  geometry.setAttribute('aExtra', extraAttr);
  geometry.setAttribute('aSeed', new InstancedBufferAttribute(seeds, 1));

  // Each publication is its first page: a thin sheet showing its tile in the
  // atlas (the page from the PDF, else one typeset here). A book without a PDF
  // stays a bound volume and shows its cloth cover.
  // data/covers.json (scripts/generate-covers.py): {bibkey: {page, tile, aspect}}
  const coversEl = document.getElementById('archive-covers-data');
  const covers = (coversEl && JSON.parse(coversEl.textContent || '{}')) || {};
  const bound = (p) => p.kind === 'book' && !covers[p.key];
  const TYPESET_ASPECT = 0.7071;
  const CELL_W = 192, CELL_H = 272, GUTTER = 4, ATLAS_COLS = 8;
  const pitchW = CELL_W + 2 * GUTTER, pitchH = CELL_H + 2 * GUTTER;
  const atlasCanvas = document.createElement('canvas');
  atlasCanvas.width = ATLAS_COLS * pitchW;
  atlasCanvas.height = Math.ceil(P / ATLAS_COLS) * pitchH;
  const cell = (i) => [(i % ATLAS_COLS) * pitchW + GUTTER, Math.floor(i / ATLAS_COLS) * pitchH + GUTTER];
  const tiles = new Float32Array(COUNT * 4);         // the tile's uv rect: u0, v0, du, dv
  const shapes = new Float32Array(COUNT * 3).fill(1); // width, height, thickness of the box
  for (let i = 0; i < P; i++) {
    const [x, y] = cell(i);
    const W = atlasCanvas.width, H = atlasCanvas.height;
    tiles.set([(x + 0.5) / W, 1 - (y + CELL_H - 0.5) / H, (CELL_W - 1) / W, (CELL_H - 1) / H], i * 4);
    const aspect = covers[papers[i].key]?.aspect || TYPESET_ASPECT;
    if (!bound(papers[i])) shapes.set([aspect / (0.38 / 0.54), 1, 0.12], i * 3);
  }
  geometry.setAttribute('aTile', new InstancedBufferAttribute(tiles, 4));
  geometry.setAttribute('aShape', new InstancedBufferAttribute(shapes, 3));
  const atlasTexture = new CanvasTexture(atlasCanvas);   // sampled as is: the shader works in display colours

  // Placement: x is screen-space (−1..1), so the year axis lines up at every
  // depth; publications are spread by year, the archive at random.
  const years = papers.map((p) => +p.year);
  const minYear = Math.min(...years), maxYear = Math.max(...years);
  const shelfX = () => (narrow ? [-0.8, 0.8] : [-0.08, 0.86]);
  const yearX = (y) => {
    const [x0, x1] = shelfX();
    return x0 + (maxYear === minYear ? 0.5 : (y - minYear) / (maxYear - minYear)) * (x1 - x0);
  };
  const unit = new Float32Array(COUNT * 3);
  const scales = new Float32Array(COUNT);
  function placePapers() {
    const [y0, y1] = narrow ? [-0.45, 0.1] : [-0.6, 0.72];
    const placed = [];
    for (let i = 0; i < P; i++) {
      let best = null;
      for (let attempt = 0; attempt < 40; attempt++) {
        const x = yearX(years[i]) + (rand() - 0.5) * 0.06;
        const y = y0 + rand() * (y1 - y0);
        const clearance = Math.min(...placed.map(([px, py]) => Math.hypot((px - x) * 1.6, py - y)), 9);
        if (!best || clearance > best[2]) best = [x, y, clearance];
        if (clearance > 0.16) break;
      }
      placed.push(best);
      unit.set([best[0], best[1], 0.62 + rand() * 0.3], i * 3);
    }
  }
  for (let i = P; i < COUNT; i++) unit.set([rand() * 2 - 1, rand() * 2 - 1, rand()], i * 3);
  for (let i = 0; i < COUNT; i++) {
    scales[i] = i < P ? (papers[i].featured ? 2.4 : 2.0) * (bound(papers[i]) ? 0.9 : 1) : 0.75 + rand() * 0.6;
  }

  const DEPTH_NEAR = 3, DEPTH_FAR = -18;
  const positions = new Float32Array(COUNT * 3);
  const dummy = new Object3D();
  const scaleOf = (i) => scales[i] * (narrow && i < P ? 0.62 : 1);
  function layout() {
    placePapers();
    for (let i = 0; i < COUNT; i++) {
      const z = DEPTH_FAR + unit[i * 3 + 2] * (DEPTH_NEAR - DEPTH_FAR);
      const grow = (camera.position.z - z) / camera.position.z;
      const spread = i < P ? 1 : 1.08;
      const x = unit[i * 3] * halfW * spread * grow;
      const y = unit[i * 3 + 1] * halfH * spread * grow;
      positions.set([x, y, z], i * 3);
      dummy.position.set(x, y, z);
      dummy.scale.setScalar(scaleOf(i));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    placeYears();
  }

  // The orientation a book turns to when the lamp finds it: cover forward,
  // spine just showing.
  const FACE = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), 0.32)
    .multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), 0.06));
  const FOCUS_TURN = 0.92, FOCUS_GROW = 0.45, FOCUS_LIFT = 1.5;
  // The pages float mostly facing you and sway rather than tumble, so they
  // can be seen for what they are; the unlit archive tumbles at random.
  const SWAY = 0.5;
  for (let i = 0; i < P; i++) {
    const r = new Quaternion().random();
    const b = FACE.clone().slerp(r, 0.2);
    quats.set([b.x, b.y, b.z, b.w], i * 4);
  }
  const turnAngle = (i, t) => (i < P
    ? SWAY * Math.sin(t * spin[i * 4 + 3] * 4 + seeds[i] * 6.283)
    : t * spin[i * 4 + 3] + seeds[i] * 6.283);

  const lampUniform = { value: new Vector3(0, 0, 2) };
  const timeUniform = { value: 0 };
  const dimUniform = { value: 0 };
  const selectUniform = { value: 0 };                 // 1 while a year on the axis is hovered
  const spinOn = reduceMotion ? 0 : 1;
  mesh.material = new ShaderMaterial({
    uniforms: {
      uLamp: lampUniform, uTime: timeUniform, uLampR: { value: 4.6 }, uDim: dimUniform, uSelect: selectUniform,
      uSpinOn: { value: spinOn }, uFace: { value: [FACE.x, FACE.y, FACE.z, FACE.w] },
      uTurn: { value: FOCUS_TURN }, uGrow: { value: FOCUS_GROW }, uLift: { value: FOCUS_LIFT },
      uNight: { value: NIGHT }, uPaper: { value: PAPER },
      uRed: { value: VERMILION }, uGold: { value: LAMP }, uBlue: { value: LAPIS_LIGHT },
      uFogNear: { value: 26 }, uFogFar: { value: 54 }, uAtlas: { value: atlasTexture },
    },
    vertexShader: /* glsl */`
      attribute vec4 aQuat;
      attribute vec4 aSpin;
      attribute vec4 aInfo;
      attribute vec2 aExtra;
      attribute float aSeed;
      attribute vec4 aTile;
      attribute vec3 aShape;
      uniform vec3 uLamp; uniform float uTime; uniform float uLampR; uniform float uSpinOn;
      uniform vec4 uFace; uniform float uTurn; uniform float uGrow; uniform float uLift;
      varying float vLamp; varying float vShade; varying vec4 vInfo; varying float vHigh; varying float vSeed; varying float vDepth;
      varying vec2 vUv; varying vec3 vFace; varying float vBound;
      vec4 qAxis(vec3 a, float t) { return vec4(a * sin(t * 0.5), cos(t * 0.5)); }
      vec4 qMul(vec4 a, vec4 b) { return vec4(a.w * b.xyz + b.w * a.xyz + cross(a.xyz, b.xyz), a.w * b.w - dot(a.xyz, b.xyz)); }
      vec3 qRot(vec4 q, vec3 v) { return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v); }
      vec4 qSlerp(vec4 a, vec4 b, float t) {
        float d = dot(a, b);
        if (d < 0.0) { b = -b; d = -d; }
        if (d > 0.9995) return normalize(mix(a, b, t));
        float th = acos(d);
        return (a * sin((1.0 - t) * th) + b * sin(t * th)) / sin(th);
      }
      void main() {
        float f = aInfo.z;
        float t = uTime * uSpinOn;
        float turn = aInfo.x > 0.5 ? ${SWAY.toFixed(3)} * sin(t * aSpin.w * 4.0 + aSeed * 6.283) : t * aSpin.w + aSeed * 6.283;
        vec4 q = qMul(qAxis(aSpin.xyz, turn), aQuat);
        q = qSlerp(q, uFace, f * uTurn);
        vec3 p = qRot(q, position * aShape * (1.0 + uGrow * f) * (1.0 - aExtra.x));
        vUv = aTile.xy + uv * aTile.zw;
        vFace = normal;
        vBound = step(0.5, aShape.z);
        vec3 n = qRot(q, normal);
        vec4 wp = modelMatrix * instanceMatrix * vec4(p, 1.0);
        wp.z += uLift * f;
        vec3 wn = normalize(mat3(modelMatrix * instanceMatrix) * n);
        vec3 toL = uLamp - wp.xyz;
        float d = length(toL);
        vLamp = exp(-d * d / (uLampR * uLampR));
        vShade = 0.32 + 0.68 * max(dot(wn, toL / max(d, 1e-3)), 0.0);
        vInfo = aInfo;
        vHigh = aExtra.y;
        vSeed = aSeed;
        vec4 mv = viewMatrix * wp;
        vDepth = -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uNight, uPaper, uRed, uGold, uBlue; uniform float uTime, uDim, uSelect, uFogNear, uFogFar;
      uniform sampler2D uAtlas;
      varying float vLamp; varying float vShade; varying vec4 vInfo; varying float vHigh; varying float vSeed; varying float vDepth;
      varying vec2 vUv; varying vec3 vFace; varying float vBound;
      void main() {
        vec3 silhouette = uNight * 1.22 + vec3(0.010, 0.013, 0.015) * vShade;
        vec3 lit = uPaper * vLamp * vShade;
        vec3 col = silhouette + lit * 0.92;
        if (vInfo.x > 0.5) {
          // the page (or cover) in front, paper or cloth everywhere else
          vec3 surface;
          if (vFace.z > 0.5) surface = texture2D(uAtlas, vUv).rgb;
          else if (vBound > 0.5) surface = (vFace.z < -0.5 || vFace.x < -0.5) ? vec3(0.16, 0.20, 0.42) : vec3(0.88, 0.84, 0.74);
          else surface = vFace.z < -0.5 ? vec3(0.80, 0.77, 0.70) : vec3(0.70, 0.67, 0.60);
          float breathe = 0.5 + 0.5 * sin(uTime * 0.9 + vSeed * 6.283);
          float focus = vInfo.z;
          float rest = 0.68 + 0.08 * breathe + 0.12 * vInfo.w + 0.3 * vHigh;
          rest = mix(rest, vHigh > 0.6 ? 1.0 : 0.16, uSelect);       // a hovered year: its pages bright, the rest dim
          col = surface * mix(rest, 0.86, focus) * (0.62 + 0.38 * vShade) + lit * 0.1 * (1.0 - focus);
        }
        float fog = smoothstep(uFogNear, uFogFar, vDepth);
        col = mix(col, uNight, fog * 0.82);
        gl_FragColor = vec4(mix(col, uNight, uDim * 0.62), 1.0);
      }`,
  });
  scene.add(mesh);

  // ---------- dust in the lamplight ----------
  const DUST = window.innerWidth < 700 ? 380 : 700;
  const dustPos = new Float32Array(DUST * 3);
  const dustSeed = new Float32Array(DUST);
  for (let i = 0; i < DUST; i++) {
    dustPos.set([(rand() * 2 - 1) * 26, (rand() * 2 - 1) * 15, -8 + rand() * 16], i * 3);
    dustSeed[i] = rand();
  }
  const dustGeo = new BufferGeometry();
  dustGeo.setAttribute('position', new BufferAttribute(dustPos, 3));
  dustGeo.setAttribute('aSeed', new BufferAttribute(dustSeed, 1));
  const pixelRatio = { value: 1 };
  scene.add(new Points(dustGeo, new ShaderMaterial({
    transparent: true, depthWrite: false, blending: AdditiveBlending,
    uniforms: { uLamp: lampUniform, uTime: timeUniform, uGold: { value: LAMP }, uPR: pixelRatio,
                uDrift: { value: spinOn } },
    vertexShader: /* glsl */`
      attribute float aSeed;
      uniform vec3 uLamp; uniform float uTime; uniform float uPR; uniform float uDrift;
      varying float vA;
      void main() {
        vec3 p = position;
        float t = uTime * uDrift;
        p.x += sin(t * 0.11 + aSeed * 40.0) * 0.9;
        p.y = mod(position.y + t * (0.08 + aSeed * 0.12) + 15.0, 30.0) - 15.0;   // motes rise and wrap
        float d = distance(p, uLamp);
        vA = exp(-d * d / 9.0) * (0.35 + 0.65 * aSeed);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = (1.2 + 2.2 * aSeed) * uPR * (30.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uGold; varying float vA;
      void main() {
        float r = length(gl_PointCoord - 0.5);
        gl_FragColor = vec4(uGold, vA * smoothstep(0.5, 0.0, r));
      }`,
  })));

  // ---------- the lamp's own glow (behind whatever stands in front of it) ----------
  const glowGeo = new BufferGeometry();
  glowGeo.setAttribute('position', new BufferAttribute(new Float32Array(3), 3));
  const glowSize = { value: 520 };
  const glow = new Points(glowGeo, new ShaderMaterial({
    transparent: true, depthWrite: false, blending: AdditiveBlending,
    uniforms: { uLamp: lampUniform, uGold: { value: LAMP }, uSize: glowSize, uPR: pixelRatio },
    vertexShader: /* glsl */`
      uniform vec3 uLamp; uniform float uSize; uniform float uPR;
      void main() {
        vec4 mv = viewMatrix * vec4(uLamp, 1.0);
        gl_PointSize = uSize * uPR * (30.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uGold;
      void main() {
        float r = length(gl_PointCoord - 0.5) * 2.0;
        float a = 0.2 * exp(-r * r * 4.0) + 0.45 * exp(-r * r * 90.0);
        gl_FragColor = vec4(uGold, a);
      }`,
  }));
  glow.frustumCulled = false;
  glow.renderOrder = 2;
  scene.add(glow);

  // ---------- the reading copy: one book in a cloth binding ----------
  const COVER_W = 512, COVER_H = 728;
  const coverCanvas = document.createElement('canvas');
  coverCanvas.width = COVER_W; coverCanvas.height = COVER_H;
  const coverTexture = new CanvasTexture(coverCanvas);
  coverTexture.colorSpace = SRGBColorSpace;
  coverTexture.anisotropy = 4;
  const spineCanvas = document.createElement('canvas');
  spineCanvas.width = 96; spineCanvas.height = COVER_H;
  const spineTexture = new CanvasTexture(spineCanvas);
  spineTexture.colorSpace = SRGBColorSpace;
  const clothBack = new MeshBasicMaterial({ color: '#5c1a11' });
  const pages = new MeshBasicMaterial({ color: '#e7dcc3' });
  const pagesShade = new MeshBasicMaterial({ color: '#cdbf9f' });
  const BOOK_W = 1, BOOK_H = 1.42, BOOK_D = 0.24;
  // BoxGeometry faces: +x (fore-edge), −x (spine), +y (head), −y (tail), +z (cover), −z (back)
  // Unlit materials, so the faces are shaded by hand: the cover a touch below
  // full light, the spine (turned from the lamp) darker still.
  const reading = new Mesh(new BoxGeometry(BOOK_W, BOOK_H, BOOK_D), [
    pages, new MeshBasicMaterial({ map: spineTexture, color: '#a99f90' }), pages, pagesShade,
    new MeshBasicMaterial({ map: coverTexture, color: '#e6ddcc' }), clothBack,
  ]);
  reading.visible = false;
  reading.renderOrder = 1;
  scene.add(reading);

  // ---------- or, for anything but a bound book, its first page ----------
  const SHEET_H = 1.414;
  const pageMat = new MeshBasicMaterial({ color: '#ece7db' });   // a touch below white, so the page doesn't glare
  const paperEdge = new MeshBasicMaterial({ color: '#d9d2c2' });
  const paperBack = new MeshBasicMaterial({ color: '#cfc7b5' });
  const paperUnder = new MeshBasicMaterial({ color: '#b9b19f' });
  const sheet = new Group();
  sheet.add(new Mesh(new BoxGeometry(1, SHEET_H, 0.008), [paperEdge, paperEdge, paperEdge, paperEdge, pageMat, paperBack]));
  // the rest of the paper, a little askew behind its first page
  for (const [z, rz, dx, dy] of [[-0.014, 0.022, 0.012, 0.01], [-0.028, -0.017, -0.01, -0.008]]) {
    const under = new Mesh(new BoxGeometry(1, SHEET_H, 0.008), paperUnder);
    under.position.set(dx, dy, z);
    under.rotation.z = rz;
    sheet.add(under);
  }
  sheet.visible = false;
  sheet.renderOrder = 1;
  scene.add(sheet);
  let sheetH = SHEET_H;
  function shapeSheet(aspect) {
    sheetH = 1 / (aspect || 0.7071);
    sheet.children.forEach((m) => { m.scale.y = sheetH / SHEET_H; });
  }
  const pageTextures = new Map();
  function loadPage(p) {
    const c = covers[p.key];
    if (!c) {
      if (bound(p)) return Promise.resolve(null);     // a book comes out in its binding
      if (!pageTextures.has(p.key)) {
        pageTextures.set(p.key, fontsReady.then(() => {
          const c2 = document.createElement('canvas');
          c2.width = 1100; c2.height = Math.round(1100 / TYPESET_ASPECT);
          typeset(c2.getContext('2d'), p, 0, 0, c2.width, c2.height);
          const t = new CanvasTexture(c2);
          t.colorSpace = SRGBColorSpace;
          t.anisotropy = renderer.capabilities.getMaxAnisotropy();
          return t;
        }));
      }
      return pageTextures.get(p.key);
    }
    if (!pageTextures.has(p.key)) {
      pageTextures.set(p.key, new Promise((resolve) => {
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => {
          const t = new CanvasTexture(img);
          t.colorSpace = SRGBColorSpace;
          t.anisotropy = renderer.capabilities.getMaxAnisotropy();
          resolve(t);
        };
        img.onerror = () => resolve(null);       // fall back to the cloth binding
        img.src = '/' + c.page;
      }));
    }
    return pageTextures.get(p.key);
  }
  let held = reading;                             // what is in your hands: the bound book or the page

  function wrapLines(ctx, text, maxWidth) {
    const lines = [];
    let line = '';
    for (const w of text.split(/\s+/)) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w; }
      else line = test;
    }
    if (line) lines.push(line);
    return lines;
  }
  function cloth(ctx, w, h, [light, dark]) {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, light); g.addColorStop(1, dark);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // the weave: fine crossing threads
    ctx.globalAlpha = 0.07;
    ctx.strokeStyle = '#000';
    for (let y = 0; y < h; y += 3) { ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); ctx.stroke(); }
    ctx.strokeStyle = '#fff';
    ctx.globalAlpha = 0.035;
    for (let x = 0; x < w; x += 3) { ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h); ctx.stroke(); }
    ctx.globalAlpha = 1;
    // wear at the edges
    const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.38)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);
  }
  function drawCover(p) {
    const colors = CLOTH[p.kind] || CLOTH.other;
    clothBack.color.set(colors[1]);
    const ctx = coverCanvas.getContext('2d');
    cloth(ctx, COVER_W, COVER_H, colors);
    // gilt frame
    ctx.strokeStyle = GILT;
    ctx.lineWidth = 2.5; ctx.strokeRect(30, 30, COVER_W - 60, COVER_H - 60);
    ctx.lineWidth = 1; ctx.strokeRect(40, 40, COVER_W - 80, COVER_H - 80);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = GILT;
    ctx.font = 'italic 25px "Linden Hill", Georgia, serif';
    ctx.fillText(p.label || 'Publication', COVER_W / 2, 92);
    // the title, fitted to the panel
    const maxW = COVER_W - 120;
    let size = 64, lines;
    for (; size > 26; size -= 2) {
      ctx.font = `${size}px "Linden Hill", Georgia, serif`;
      lines = wrapLines(ctx, p.title, maxW);
      if (lines.length * size * 1.12 <= 380 && lines.length <= 8) break;
    }
    const lh = size * 1.12;
    const top = 135 + (380 - lines.length * lh) / 2 + size * 0.85;
    ctx.fillStyle = '#f2e2b4';
    ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowOffsetY = 2; ctx.shadowBlur = 2;
    lines.forEach((l, k) => ctx.fillText(l, COVER_W / 2, top + k * lh));
    ctx.shadowColor = 'transparent';
    // ornament
    ctx.fillStyle = GILT;
    const oy = 560, cx = COVER_W / 2;
    ctx.beginPath(); ctx.moveTo(cx, oy - 7); ctx.lineTo(cx + 7, oy); ctx.lineTo(cx, oy + 7); ctx.lineTo(cx - 7, oy); ctx.fill();
    ctx.fillRect(cx - 70, oy - 0.5, 52, 1); ctx.fillRect(cx + 18, oy - 0.5, 52, 1);
    // venue and year
    if (p.venue) {
      ctx.font = 'italic 24px "Linden Hill", Georgia, serif';
      wrapLines(ctx, p.venue, maxW).slice(0, 2).forEach((l, k) => ctx.fillText(l, cx, 610 + k * 28));
    }
    ctx.font = '500 30px Newsreader, Georgia, serif';     // Linden Hill's figures are old-style
    ctx.fillText(p.year, cx, COVER_H - 62);
    coverTexture.needsUpdate = true;

    // the spine: cloth, gilt bands and a short title
    const s = spineCanvas.getContext('2d');
    cloth(s, 96, COVER_H, [colors[1], colors[1]]);
    s.fillStyle = GILT;
    for (const y of [60, 66, COVER_H - 66, COVER_H - 60]) s.fillRect(10, y, 76, 2);
    s.save();
    s.translate(48, COVER_H / 2); s.rotate(-Math.PI / 2);
    s.textAlign = 'center'; s.textBaseline = 'middle';
    s.font = '24px "Linden Hill", Georgia, serif';
    s.fillText(p.title.length > 38 ? p.title.slice(0, 36).replace(/\s+\S*$/, '') + ' …' : p.title, 0, 0);
    s.restore();
    spineTexture.needsUpdate = true;
  }
  // A first page for a paper without a PDF, typeset like the journals do:
  // venue, title, authors, abstract. Laid out in hundredths of the page width.
  function typeset(ctx, p, x, y, w, h) {
    const u = w / 100, m = 11 * u, tw = w - 2 * m;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#f7f4ec';
    ctx.fillRect(0, 0, w, h);
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#6b665d';
    ctx.font = `${2.4 * u}px "IBM Plex Mono", monospace`;
    const head = wrapLines(ctx, `${p.venue || p.label || ''}`, tw - 10 * u)[0] || '';
    ctx.fillText(head, m, 12 * u);
    ctx.textAlign = 'right';
    ctx.fillText(p.year, w - m, 12 * u);
    ctx.textAlign = 'left';
    ctx.fillRect(m, 14.2 * u, tw, Math.max(1, 0.16 * u));
    // the title, as large as five lines allow
    let size = 7.2 * u, lines;
    for (; size > 3.6 * u; size -= 0.2 * u) {
      ctx.font = `500 ${size}px Newsreader, Georgia, serif`;
      lines = wrapLines(ctx, p.title, tw);
      if (lines.length <= 5) break;
    }
    ctx.fillStyle = '#1b1a17';
    let yy = 24 * u + size * 0.7;
    lines.forEach((l) => { ctx.fillText(l, m, yy); yy += size * 1.12; });
    ctx.font = `italic ${3.3 * u}px Newsreader, Georgia, serif`;
    ctx.fillStyle = '#3a3731';
    yy += 2.6 * u;
    wrapLines(ctx, (p.authors || []).join(', '), tw).slice(0, 3).forEach((l) => { ctx.fillText(l, m, yy); yy += 4.4 * u; });
    yy += 5 * u;
    const bottom = h - 12 * u;
    ctx.fillStyle = '#1b1a17';
    ctx.font = `600 ${2.5 * u}px Newsreader, Georgia, serif`;
    ctx.fillText('ABSTRACT', m, yy);
    yy += 4.6 * u;
    ctx.font = `${2.75 * u}px Newsreader, Georgia, serif`;
    ctx.fillStyle = '#2c2a26';
    const text = (p.abstract || '').replace(/\s*…$/, '');
    if (text) {
      for (const l of wrapLines(ctx, text, tw)) {
        if (yy > bottom) break;
        ctx.fillText(l, m, yy);
        yy += 4.1 * u;
      }
    }
    // the body of the paper, greeked, to the foot of the page
    ctx.fillStyle = 'rgba(44, 42, 38, 0.12)';
    yy += 4 * u;
    for (let k = 0; yy < bottom; k++, yy += 4.1 * u) {
      const len = k % 7 === 6 ? 0.55 : 0.97 - ((k * 37) % 9) / 100;   // a short last line ends each paragraph
      ctx.fillRect(m, yy - 1.6 * u, tw * len, 1.2 * u);
    }
    ctx.fillStyle = '#8a857b';
    ctx.font = `${2.2 * u}px "IBM Plex Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('1', w / 2, h - 5.5 * u);
    ctx.restore();
  }

  const fontsReady = Promise.all([
    document.fonts.load('64px "Linden Hill"'),
    document.fonts.load('italic 25px "Linden Hill"'),
    document.fonts.load('500 30px Newsreader'),
    document.fonts.load('600 30px Newsreader'),
    document.fonts.load('30px Newsreader'),
    document.fonts.load('italic 30px Newsreader'),
    document.fonts.load('20px "IBM Plex Mono"'),
  ]).catch(() => {});

  // ---------- the atlas: the floating pages' faces ----------
  {
    const ctx = atlasCanvas.getContext('2d');
    ctx.fillStyle = '#efebe2';                        // blank paper until the pages arrive
    ctx.fillRect(0, 0, atlasCanvas.width, atlasCanvas.height);
    atlasTexture.needsUpdate = true;
    const img = new Image();
    img.decoding = 'async';
    const sheetLoaded = Object.keys(covers).length
      ? new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; img.src = '/images/papers/atlas.jpg'; })
      : Promise.resolve();
    Promise.all([sheetLoaded, fontsReady]).then(() => {
      papers.forEach((p, i) => {
        const [x, y] = cell(i);
        const c = covers[p.key];
        if (c && c.tile && img.naturalWidth) ctx.drawImage(img, ...c.tile, x, y, CELL_W, CELL_H);
        else if (bound(p)) { drawCover(p); ctx.drawImage(coverCanvas, x, y, CELL_W, CELL_H); }
        else typeset(ctx, p, x, y, CELL_W, CELL_H);
      });
      atlasTexture.needsUpdate = true;
    });
  }

  // ---------- year axis: labels, a small histogram, and year hovering ----------
  const axis = root.querySelector('.archive-years');
  const perYear = new Map();
  years.forEach((y) => perYear.set(y, (perYear.get(y) || 0) + 1));
  const yearReadout = document.createElement('span');
  yearReadout.className = 'year-readout';
  let hoverYear = null;
  function placeYears() {
    axis.textContent = '';
    if (narrow) return;
    const span = maxYear - minYear;
    const step = span > 12 ? 4 : span > 6 ? 2 : 1;
    const labelled = new Set();
    for (let y = minYear; y < maxYear; y += step) labelled.add(y);
    for (const y of labelled) if (maxYear - y < step / 2) labelled.delete(y);
    labelled.add(maxYear);
    for (let y = minYear; y <= maxYear; y++) {
      const left = `${((yearX(y) + 1) / 2) * 100}%`;
      const n = perYear.get(y) || 0;
      if (n) {
        const bar = document.createElement('i');
        bar.className = 'year-bar';
        bar.style.left = left;
        bar.style.height = `${3 + n * 3}px`;
        bar.dataset.year = y;
        axis.appendChild(bar);
      }
      if (labelled.has(y)) {
        const label = document.createElement('span');
        label.className = 'year-label';
        label.textContent = y;
        label.style.left = left;
        axis.appendChild(label);
      }
    }
    axis.appendChild(yearReadout);
  }
  axis.addEventListener('pointermove', (e) => {
    lastHuman = clock;
    active = false;
    const r = axis.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 2 - 1;
    let best = null, bestD = 0.05;
    for (const y of perYear.keys()) { const d = Math.abs(yearX(y) - x); if (d < bestD) { bestD = d; best = y; } }
    setHoverYear(best);
  });
  axis.addEventListener('pointerleave', () => setHoverYear(null));
  function setHoverYear(y) {
    if (y === hoverYear) return;
    hoverYear = y;
    axis.querySelectorAll('.year-bar').forEach((b) => b.classList.toggle('on', +b.dataset.year === y));
    axis.classList.toggle('has-year', y !== null);
    if (y === null) { yearReadout.textContent = ''; return; }
    yearReadout.textContent = y;
    yearReadout.style.left = `${((yearX(y) + 1) / 2) * 100}%`;
  }

  // ---------- co-authorship ----------
  const SELF = /karsdorp/i;
  const coauthors = papers.map((p) => new Set((p.authors || []).filter((a) => !SELF.test(a))));
  const kin = papers.map((_, i) => papers.map((_, j) => j)
    .filter((j) => j !== i && [...coauthors[i]].some((a) => coauthors[j].has(a))));

  // ---------- the card ----------
  const card = root.querySelector('.paper-card');
  const field = (k) => card.querySelector(`[data-p="${k}"]`);
  const openBtn = card.querySelector('.paper-take');
  const closeBtn = card.querySelector('.paper-return');
  const linkBtn = field('link');
  function authorsLine(list) {
    const others = (list || []).filter((a) => !SELF.test(a));
    if (!others.length) return list && list.length ? 'Single-authored' : '';
    if (others.length <= 3) return 'with ' + (others.length === 1 ? others[0] : others.slice(0, -1).join(', ') + ' and ' + others[others.length - 1]);
    return `with ${others.slice(0, 2).join(', ')} and ${others.length - 2} others`;
  }
  const fullAuthors = (list) => (list.length > 1 ? list.slice(0, -1).join(', ') + ' and ' + list[list.length - 1] : list[0] || '');
  const order = papers.map((_, i) => i);              // browsing order: newest first, as the data is sorted
  function showCard(i) {
    const p = papers[i];
    card.dataset.kind = p.kind;
    field('kind').textContent = `${p.label || 'Publication'} · ${p.year}`;
    const title = field('title');
    title.textContent = p.title;
    title.href = p.url || `/references/#ref-${p.key}`;     // no link on file: its citation
    field('venue').textContent = p.venue || '';
    field('authors').textContent = authorsLine(p.authors);
    field('count').textContent = `${order.indexOf(i) + 1} of ${P}`;
    field('abstract').textContent = p.abstract || 'No abstract on file for this one.';
    field('allauthors').textContent = fullAuthors(p.authors || []);
    linkBtn.href = p.url || `/references/#ref-${p.key}`;
    linkBtn.textContent = p.url ? 'Read the paper ↗' : 'See the citation';
    if (p.url) linkBtn.target = '_blank'; else linkBtn.removeAttribute('target');
    card.hidden = false;
  }

  // ---------- focus, pointer, autopilot ----------
  const focus = new Float32Array(P);
  const high = new Float32Array(P);
  let current = papers.findIndex((p) => p.featured);
  if (current < 0) current = 0;
  let active = false;                                 // the pointer (or the buttons) is on a book
  let mode = 'browse';                                // 'browse' | 'opening' | 'open' | 'closing'
  const screen = new Float32Array(P * 2);
  const tmp = new Vector3();
  function project() {
    const rect = root.getBoundingClientRect();
    for (let i = 0; i < P; i++) {
      tmp.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2] + FOCUS_LIFT * focus[i]).project(camera);
      screen[i * 2] = (tmp.x + 1) / 2 * rect.width;
      screen[i * 2 + 1] = (1 - tmp.y) / 2 * rect.height;
    }
  }
  function nearest(px, py, radius) {
    let best = -1, bestD = radius * radius;
    for (let i = 0; i < P; i++) {
      const dx = screen[i * 2] - px, dy = screen[i * 2 + 1] - py;
      const d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  }
  function setCurrent(i) {
    if (i === current && !card.hidden) return;
    current = i;
    info[i * 4 + 3] = 1;                              // visited books keep a little more light
    showCard(i);
  }

  const raycaster = new Raycaster();
  const plane = new Plane(new Vector3(0, 0, 1), -2);
  const ndc = new Vector2();
  const parallax = new Vector2();
  const lamp = new Vector3(0, 0, 2);
  const lampTarget = new Vector3(0, 0, 2);
  const tilt = new Vector2();
  let lastHuman = -1e9;
  let clock = 0;

  function aim(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const px = clientX - rect.left, py = clientY - rect.top;
    ndc.set((px / rect.width) * 2 - 1, -(py / rect.height) * 2 + 1);
    lastHuman = clock;
    root.classList.add('is-touched');
    if (mode !== 'browse') { tilt.copy(ndc); return; }
    raycaster.setFromCamera(ndc, camera);
    raycaster.ray.intersectPlane(plane, lampTarget);
    parallax.copy(ndc);
    const hit = nearest(px, py, 46);
    active = hit >= 0;
    if (active) { setCurrent(hit); loadPage(papers[hit]); }   // fetch its first page ahead of a click
    canvas.style.cursor = active ? 'pointer' : '';
  }
  root.addEventListener('pointermove', (e) => {
    if ((e.pointerType === 'mouse' || e.pointerType === 'pen') && !e.target.closest('.archive-years')) aim(e.clientX, e.clientY);
  });
  root.addEventListener('pointerdown', (e) => { if (!e.target.closest('a, button, .archive-years')) aim(e.clientX, e.clientY); });
  root.addEventListener('pointerleave', () => { active = false; });
  canvas.addEventListener('click', () => {
    if (mode === 'open') closeBook();
    else if (mode === 'browse' && active) openBook(current);
  });
  card.querySelectorAll('[data-step]').forEach((btn) => btn.addEventListener('click', () => {
    const k = (order.indexOf(current) + Number(btn.dataset.step) + P) % P;
    setCurrent(order[k]);
    goTo(order[k]);
    lastHuman = clock;
    active = true;                                    // the chosen book stays lit until the pointer moves on
  }));
  openBtn.addEventListener('click', () => openBook(current));
  closeBtn.addEventListener('click', () => closeBook());
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && (mode === 'open' || mode === 'opening')) closeBook(); });

  function goTo(i) {
    lampTarget.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2] + 1.2);
  }
  let tourNext = 0;
  const DWELL = 3.6;
  function autopilot() {
    if (clock < tourNext) return;
    tourNext = clock + DWELL;
    const k = (order.indexOf(current) + 1) % P;
    setCurrent(order[k]);
    goTo(order[k]);
  }

  // ---------- taking a book from the archive ----------
  const pose = () => ({ pos: new Vector3(), quat: new Quaternion(), scale: 1 });
  const flight = { t: 0, from: pose(), to: pose() };
  const READ_QUAT = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), 0.38)
    .multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), 0.04));
  const FLIGHT_SECONDS = reduceMotion ? 0.01 : 1.05;
  const axisTmp = new Vector3();
  const qTmp = new Quaternion();

  function shelfPose(i, out) {
    // the pose the instanced shader is drawing for this book right now
    const f = focus[i];
    axisTmp.set(spin[i * 4], spin[i * 4 + 1], spin[i * 4 + 2]);
    out.quat.setFromAxisAngle(axisTmp, turnAngle(i, clock * spinOn))
      .multiply(qTmp.set(quats[i * 4], quats[i * 4 + 1], quats[i * 4 + 2], quats[i * 4 + 3]));
    out.quat.slerp(FACE, f * FOCUS_TURN);
    out.pos.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2] + FOCUS_LIFT * f);
    out.scale = scaleOf(i) * 0.38 * (1 + FOCUS_GROW * f);   // the instanced box is 0.38 wide, the reading copy 1
  }
  function readingPose(out) {
    const dist = 19;
    const viewH = 2 * Math.tan((camera.fov * Math.PI) / 360) * dist;
    const viewW = viewH * camera.aspect;
    const isPage = held === sheet;
    out.scale = (narrow ? viewH * (isPage ? 0.3 : 0.26) : viewH * (isPage ? 0.66 : 0.56)) / (isPage ? sheetH : BOOK_H);
    out.pos.set(narrow ? 0 : viewW * 0.22, narrow ? viewH * (isPage ? 0.22 : 0.27) : viewH * 0.01, camera.position.z - dist);
    out.quat.copy(READ_QUAT);
  }

  async function openBook(i) {
    if (mode !== 'browse') return;
    mode = 'opening';
    setCurrent(i);
    // the paper's first page (from its PDF, or typeset), or a book in its binding
    const page = await loadPage(papers[i]);
    if (page) {
      pageMat.map = page;
      pageMat.needsUpdate = true;
      shapeSheet(covers[papers[i].key]?.aspect || TYPESET_ASPECT);
      held = sheet;
    } else {
      await fontsReady;
      drawCover(papers[i]);
      held = reading;
    }
    shelfPose(i, flight.from);
    readingPose(flight.to);
    flight.t = 0;
    held.position.copy(flight.from.pos);
    held.quaternion.copy(flight.from.quat);
    held.scale.setScalar(flight.from.scale);
    held.visible = true;
    extra[i * 2] = 1;                                 // the shelf copy leaves its place
    tilt.set(0, 0);
    root.classList.add('is-reading');
    card.classList.add('is-reading');
    history.replaceState(null, '', `#shelf/${encodeURIComponent(papers[i].key).replace(/%3A/gi, ':')}`);
    closeBtn.focus({ preventScroll: true });
  }
  let closeQueued = false;                            // Esc pressed while the book was still in flight
  function closeBook() {
    if (mode === 'opening') { closeQueued = true; return; }
    if (mode !== 'open') return;
    mode = 'closing';
    flight.from.pos.copy(held.position);
    flight.from.quat.copy(held.quaternion);
    flight.from.scale = held.scale.x;
    shelfPose(current, flight.to);
    flight.t = 0;
    root.classList.remove('is-reading');
    card.classList.remove('is-reading');
    history.replaceState(null, '', location.pathname + location.search);
    openBtn.focus({ preventScroll: true });
  }
  function fly(dt) {
    flight.t = Math.min(1, flight.t + dt / FLIGHT_SECONDS);
    const k = ease(flight.t);
    held.position.lerpVectors(flight.from.pos, flight.to.pos, k);
    held.position.z += Math.sin(Math.PI * k) * 2.5;                          // a small arc toward you
    held.quaternion.slerpQuaternions(flight.from.quat, flight.to.quat, k);
    // a page swings a little on the way, as if lifted by one edge
    if (held === sheet && !reduceMotion) held.quaternion.multiply(qTmp.setFromAxisAngle(axisTmp.set(0, 1, 0), -0.35 * Math.sin(Math.PI * k)));
    held.scale.setScalar(flight.from.scale + (flight.to.scale - flight.from.scale) * k);
    return flight.t >= 1;
  }

  // ---------- threads: card to book, and between collaborators ----------
  const thread = root.querySelector('.archive-thread');
  const mainLine = thread.querySelector('.thread-main');
  const dot = thread.querySelector('circle');
  const kinGroup = thread.querySelector('.thread-kin');
  const kinLines = papers.map(() => kinGroup.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'line')));
  const anchor = field('kind');                       // the thread leaves from the end of the kind · year label
  function drawThreads(alpha) {
    if (narrow || card.hidden || mode !== 'browse') { thread.style.opacity = 0; return; }
    const r = root.getBoundingClientRect();
    const t = anchor.getBoundingClientRect();
    const bx = screen[current * 2], by = screen[current * 2 + 1];
    const cx = t.right - r.left + 12, cy = t.top - r.top + t.height / 2;
    mainLine.setAttribute('x1', cx); mainLine.setAttribute('y1', cy);
    mainLine.setAttribute('x2', bx); mainLine.setAttribute('y2', by);
    dot.setAttribute('cx', bx); dot.setAttribute('cy', by);
    const relatives = kin[current];
    kinLines.forEach((l, k) => {
      const j = relatives[k];
      if (j === undefined) { l.style.display = 'none'; return; }
      l.style.display = '';
      l.setAttribute('x1', bx); l.setAttribute('y1', by);
      l.setAttribute('x2', screen[j * 2]); l.setAttribute('y2', screen[j * 2 + 1]);
    });
    thread.style.opacity = bx > cx + 40 ? alpha : 0;
  }

  // ---------- sizing, visibility ----------
  function resize() {
    const w = root.clientWidth, h = root.clientHeight;
    const pr = Math.min(window.devicePixelRatio || 1, 1.75);
    renderer.setPixelRatio(pr);
    renderer.setSize(w, h, false);
    pixelRatio.value = pr;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    halfH = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
    halfW = halfH * camera.aspect;
    narrow = w < 760;
    thread.setAttribute('viewBox', `0 0 ${w} ${h}`);
    layout();
    project();
    if (mode === 'open') {
      readingPose(flight.to);
      held.position.copy(flight.to.pos);
      held.scale.setScalar(flight.to.scale);
    }
  }
  resize();
  let resizeTimer = 0;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 120); });

  let visible = true;
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) kick(); }).observe(root);
  document.addEventListener('visibilitychange', kick);

  // ---------- loop ----------
  let last = performance.now();
  let running = false;
  function kick() {
    if (running || !visible || document.hidden) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  }
  const swayQ = new Quaternion();
  const relatives = new Set();
  function frame(now) {
    if (!visible || document.hidden) { running = false; return; }
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    clock += dt;
    timeUniform.value = clock;

    const idle = clock - lastHuman > 6;
    if (mode === 'browse') {
      if (idle && !reduceMotion) autopilot();
    } else if (mode === 'opening') {
      if (fly(dt)) {
        mode = 'open';
        if (closeQueued) { closeQueued = false; closeBook(); }
      }
    } else if (mode === 'open') {
      // the book sways a little and leans toward the pointer
      swayQ.setFromAxisAngle(axisTmp.set(0, 1, 0), (reduceMotion ? 0 : Math.sin(clock * 0.6) * 0.05) + tilt.x * 0.22)
        .multiply(qTmp.setFromAxisAngle(axisTmp.set(1, 0, 0), -tilt.y * 0.12));
      held.quaternion.slerp(qTmp.copy(READ_QUAT).premultiply(swayQ), 1 - Math.exp(-dt * 4));
    } else if (mode === 'closing') {
      shelfPose(current, flight.to);                  // the shelf copy keeps turning; land where it is
      if (fly(dt)) {
        mode = 'browse';
        held.visible = false;
        extra[current * 2] = 0;
        lastHuman = clock;
        active = true;
      }
    }

    // the lamp: over the shelf, or behind the book in your hands
    if (mode === 'browse') lamp.lerp(lampTarget, 1 - Math.exp(-dt * (idle ? 1.8 : 9)));
    else lamp.lerp(tmp.copy(held.position).add(axisTmp.set(-0.6, 0.8, -2.2)), 1 - Math.exp(-dt * 6));
    lampUniform.value.copy(lamp);
    glowSize.value += ((mode === 'browse' ? 520 : 900) - glowSize.value) * Math.min(1, dt * 3);
    dimUniform.value += ((mode === 'browse' ? 0 : 1) - dimUniform.value) * Math.min(1, dt * 3);
    selectUniform.value += ((hoverYear !== null ? 1 : 0) - selectUniform.value) * Math.min(1, dt * 8);

    if (idle && mode === 'browse') parallax.multiplyScalar(1 - dt);
    camera.position.x += (parallax.x * 1.2 - camera.position.x) * Math.min(1, dt * 2);
    camera.position.y += (parallax.y * 0.8 - camera.position.y) * Math.min(1, dt * 2);
    camera.lookAt(0, 0, 0);
    project();

    const lit = mode === 'browse' && (idle || active);
    relatives.clear();
    if (lit) kin[current].forEach((j) => relatives.add(j));
    for (let i = 0; i < P; i++) {
      const target = i === current && (lit || mode === 'closing') ? 1 : 0;
      focus[i] += (target - focus[i]) * Math.min(1, dt * 6);
      info[i * 4 + 2] = focus[i];
      const h = hoverYear !== null && years[i] === hoverYear ? 1 : relatives.has(i) ? 0.35 : 0;
      high[i] += (h - high[i]) * Math.min(1, dt * 8);
      extra[i * 2 + 1] = high[i];
    }
    infoAttr.needsUpdate = true;
    extraAttr.needsUpdate = true;
    drawThreads(lit ? 1 : 0.35);

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  // a shared link opens its book: #shelf/<bibkey>
  const shared = decodeURIComponent((location.hash.match(/^#shelf\/(.+)$/) || [])[1] || '');
  const sharedIndex = shared ? papers.findIndex((p) => p.key === shared) : -1;
  if (sharedIndex >= 0) current = sharedIndex;

  setCurrent(current);
  goTo(current);
  lamp.copy(lampTarget);
  tourNext = reduceMotion ? Infinity : 4;
  root.classList.add('is-live');
  kick();
  if (sharedIndex >= 0) setTimeout(() => openBook(sharedIndex), 700);
}
