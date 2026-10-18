// The homepage hero: a dark archive of floating books, sampled with a lamp.
//
// Every book is a surviving *copy* of some *work*; work abundances are skewed
// (most works survive in one or two copies, a few in many). Lighting a book
// records one observation of its work. From those observations the ledger
// computes S_obs, f1, f2 and the bias-corrected Chao1 estimate of how many
// works exist in total — the unseen species logic of Kestemont, Karsdorp et
// al. (2022, Science) made playable. "Light the whole archive" reveals the
// truth to compare against.
//
// Markup lives in layouts/index.html (#archive); three.js is a vendored subset
// (static/js/vendor/three-hero.min.js, rebuilt by scripts/build-three-vendor.sh).

import {
  WebGLRenderer, Scene, PerspectiveCamera, BoxGeometry, InstancedMesh,
  InstancedBufferAttribute, BufferGeometry, BufferAttribute, ShaderMaterial,
  Points, Object3D, Vector2, Vector3, Color, Plane, Raycaster, AdditiveBlending,
} from '/js/vendor/three-hero.min.js';

const root = document.getElementById('archive');
const canvas = root && root.querySelector('.archive-canvas');
if (root && canvas) {
  try { start(); } catch (err) { console.warn('archive hero disabled:', err); }
}

function start() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = getComputedStyle(document.documentElement);
  const token = (name, fallback) => new Color((css.getPropertyValue(name) || fallback).trim());
  const NIGHT = token('--night', '#0c1418');
  const PAPER = token('--paper', '#f3f2ed');
  const VERMILION = token('--vermilion', '#d9412b');
  const LAMP = token('--lamp', '#f2c46d');

  // ---------- the archive: works and their surviving copies ----------
  const rand = Math.random;
  const gauss = () => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());
  const poisson = (lambda) => {
    let k = 0, p = 1; const L = Math.exp(-lambda);
    do { k++; p *= rand(); } while (p > L);
    return k - 1;
  };

  const small = window.innerWidth < 700;
  const WORKS = small ? 320 : 520;
  const copiesOf = [];
  for (let w = 0; w < WORKS; w++) copiesOf.push(1 + poisson(Math.exp(0.35 + 0.95 * gauss())));
  const COPIES = copiesOf.reduce((a, b) => a + b, 0);
  const workOf = new Int32Array(COPIES);
  for (let w = 0, i = 0; w < WORKS; w++) for (let c = 0; c < copiesOf[w]; c++) workOf[i++] = w;

  // ---------- renderer, camera ----------
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setClearColor(NIGHT, 1);
  const scene = new Scene();
  const camera = new PerspectiveCamera(38, 1, 0.1, 200);
  camera.position.set(0, 0, 34);

  // Spread the books over the visible frustum at z=0, a little beyond it.
  let halfW = 20, halfH = 12;
  const DEPTH_NEAR = 3, DEPTH_FAR = -18;

  const geometry = new BoxGeometry(0.38, 0.54, 0.1);
  const mesh = new InstancedMesh(geometry, null, COPIES);
  const unit = new Float32Array(COPIES * 3);           // normalized position in [-1, 1]^3
  const spin = new Float32Array(COPIES * 4);           // spin axis (xyz) + speed
  const state = new Float32Array(COPIES * 3);          // reveal 0..1, multiple 0..1, seed
  const dummy = new Object3D();
  for (let i = 0; i < COPIES; i++) {
    unit[i * 3] = rand() * 2 - 1;
    unit[i * 3 + 1] = rand() * 2 - 1;
    unit[i * 3 + 2] = rand();
    const ax = new Vector3(gauss(), gauss(), gauss()).normalize();
    spin.set([ax.x, ax.y, ax.z, (0.08 + rand() * 0.22) * (rand() < 0.5 ? -1 : 1)], i * 4);
    state[i * 3 + 2] = rand();
  }
  const spinAttr = new InstancedBufferAttribute(spin, 4);
  const stateAttr = new InstancedBufferAttribute(state, 3);
  geometry.setAttribute('aSpin', spinAttr);
  geometry.setAttribute('aState', stateAttr);

  const positions = new Float32Array(COPIES * 3);
  function layout() {
    for (let i = 0; i < COPIES; i++) {
      const z = DEPTH_FAR + unit[i * 3 + 2] * (DEPTH_NEAR - DEPTH_FAR);
      // widen the spread for distant books so the field fills the frame at every depth
      const grow = (camera.position.z - z) / camera.position.z;
      const x = unit[i * 3] * halfW * 1.08 * grow;
      const y = unit[i * 3 + 1] * halfH * 1.1 * grow;
      positions.set([x, y, z], i * 3);
      dummy.position.set(x, y, z);
      dummy.rotation.set(rand() * 6.3, rand() * 6.3, rand() * 6.3);
      const s = 0.75 + rand() * 0.6;
      dummy.scale.set(s, s * (0.85 + rand() * 0.3), s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  const lampUniform = { value: new Vector3(0, 0, 2) };
  const timeUniform = { value: 0 };
  const LAMP_RADIUS = small ? 3.6 : 4.2;

  mesh.material = new ShaderMaterial({
    uniforms: {
      uLamp: lampUniform, uTime: timeUniform, uLampR: { value: LAMP_RADIUS * 1.15 },
      uSpinOn: { value: reduceMotion ? 0 : 1 },
      uNight: { value: NIGHT }, uPaper: { value: PAPER },
      uRed: { value: VERMILION }, uGold: { value: LAMP },
      uFogNear: { value: 26 }, uFogFar: { value: 54 },
    },
    vertexShader: /* glsl */`
      attribute vec4 aSpin;
      attribute vec3 aState;
      uniform vec3 uLamp; uniform float uTime; uniform float uLampR; uniform float uSpinOn;
      varying float vLamp; varying float vShade; varying vec3 vState; varying float vDepth;
      vec3 rot(vec3 v, vec3 k, float a) {           // Rodrigues
        float c = cos(a), s = sin(a);
        return v * c + cross(k, v) * s + k * dot(k, v) * (1.0 - c);
      }
      void main() {
        float a = uTime * aSpin.w * uSpinOn;
        vec3 p = rot(position, aSpin.xyz, a);
        vec3 n = rot(normal, aSpin.xyz, a);
        vec4 wp = modelMatrix * instanceMatrix * vec4(p, 1.0);
        vec3 wn = normalize(mat3(modelMatrix * instanceMatrix) * n);
        vec3 toL = uLamp - wp.xyz;
        float d = length(toL);
        vLamp = exp(-d * d / (uLampR * uLampR));
        vShade = 0.32 + 0.68 * max(dot(wn, toL / max(d, 1e-3)), 0.0);
        vState = aState;
        vec4 mv = viewMatrix * wp;
        vDepth = -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uNight, uPaper, uRed, uGold; uniform float uFogNear, uFogFar;
      varying float vLamp; varying float vShade; varying vec3 vState; varying float vDepth;
      void main() {
        vec3 silhouette = uNight * 1.22 + vec3(0.010, 0.013, 0.015) * vShade;
        vec3 lit = uPaper * vLamp * vShade;
        float r = vState.x;
        vec3 pale = mix(uPaper, uGold, 0.35);
        vec3 tag = vState.y < 0.25 ? uRed : (vState.y < 0.75 ? uGold : pale);
        float flash = 4.0 * r * (1.0 - r);
        vec3 found = tag * (0.42 + 0.48 * vShade) * (1.0 + 1.1 * flash) + lit * 0.3;
        vec3 col = mix(silhouette + lit * 0.92, found, smoothstep(0.0, 0.35, r));
        float fog = smoothstep(uFogNear, uFogFar, vDepth);
        gl_FragColor = vec4(mix(col, uNight, fog * 0.82), 1.0);
      }`,
  });
  scene.add(mesh);

  // ---------- dust in the lamplight ----------
  const DUST = small ? 380 : 700;
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
  const dust = new Points(dustGeo, new ShaderMaterial({
    transparent: true, depthWrite: false, blending: AdditiveBlending,
    uniforms: { uLamp: lampUniform, uTime: timeUniform, uGold: { value: LAMP }, uPR: pixelRatio,
                uDrift: { value: reduceMotion ? 0 : 1 } },
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
  }));
  scene.add(dust);

  // ---------- the lamp's own glow ----------
  const glowGeo = new BufferGeometry();
  glowGeo.setAttribute('position', new BufferAttribute(new Float32Array(3), 3));
  const glow = new Points(glowGeo, new ShaderMaterial({
    transparent: true, depthWrite: false, depthTest: false, blending: AdditiveBlending,
    uniforms: { uLamp: lampUniform, uGold: { value: LAMP }, uSize: { value: 520 }, uPR: pixelRatio },
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
  scene.add(glow);

  // ---------- sampling ----------
  const revealed = new Uint8Array(COPIES);
  const anim = new Float32Array(COPIES);          // reveal animation progress
  const workCount = new Int32Array(WORKS);
  let n = 0, sObs = 0, f1 = 0, f2 = 0;
  let mode = 'sample';                             // 'sample' | 'revealing' | 'revealed'
  let estimateBeforeReveal = null;

  function observe(i) {
    revealed[i] = 1;
    n++;
    const w = workOf[i];
    const before = workCount[w]++;
    if (before === 0) { sObs++; f1++; }
    else if (before === 1) { f1--; f2++; markWork(w, 0.5); }
    else if (before === 2) { f2--; markWork(w, 1); }
  }
  // A work's copies are coloured by how often it has been seen: once (f1)
  // vermilion, twice (f2) gold, three or more times pale.
  const firstCopy = new Int32Array(WORKS);
  for (let w = 0, i = 0; w < WORKS; w++) { firstCopy[w] = i; i += copiesOf[w]; }
  let stateDirty = false;
  function markWork(w, level) {
    for (let i = firstCopy[w], end = i + copiesOf[w]; i < end; i++) state[i * 3 + 1] = level;
    stateDirty = true;
  }

  function chao1() {
    if (n < 2) return null;
    const k = (n - 1) / n;
    return f2 > 0 ? sObs + k * (f1 * f1) / (2 * f2) : sObs + k * f1 * (f1 - 1) / 2;
  }

  const lamp = new Vector3(0, 0, 2);
  const lampTarget = new Vector3(-6, 2, 2);
  const DETECT = reduceMotion ? 9 : 5.5;

  function sample(dt) {
    const r2 = LAMP_RADIUS * LAMP_RADIUS;
    for (let i = 0; i < COPIES; i++) {
      if (revealed[i]) continue;
      const dx = positions[i * 3] - lamp.x, dy = positions[i * 3 + 1] - lamp.y, dz = (positions[i * 3 + 2] - lamp.z) * 0.6;
      const d2 = dx * dx + dy * dy + dz * dz;
      if (d2 > r2) continue;
      const f = 1 - Math.sqrt(d2) / LAMP_RADIUS;
      if (rand() < 1 - Math.exp(-DETECT * f * f * dt)) observe(i);
    }
  }

  // ---------- ledger ----------
  const $ = (sel) => root.querySelector(sel);
  const fmt = (x) => Math.round(x).toLocaleString('en-US');
  const el = {
    n: $('[data-k="n"]'), s: $('[data-k="s"]'), f1: $('[data-k="f1"]'), f2: $('[data-k="f2"]'), f3: $('[data-k="f3"]'),
    est: $('[data-k="est"]'), dark: $('[data-k="dark"]'), verdict: $('.ledger-verdict'),
    button: $('.ledger-reveal'), ledger: $('.ledger'),
  };
  let lastLedger = 0;
  function renderLedger(force) {
    const now = performance.now();
    if (!force && now - lastLedger < 120) return;
    lastLedger = now;
    el.n.textContent = fmt(n);
    el.s.textContent = fmt(sObs);
    el.f1.textContent = fmt(f1);
    el.f2.textContent = fmt(f2);
    el.f3.textContent = fmt(sObs - f1 - f2);
    if (mode === 'sample') {
      const est = chao1();
      el.est.textContent = est === null || sObs < 3 ? '—' : fmt(est);
      el.dark.textContent = est === null || sObs < 3 ? 'Light a few books to begin' : `≈ ${fmt(Math.max(0, est - sObs))} still in the dark`;
    }
  }

  el.ledger.hidden = false;
  el.button.addEventListener('click', () => {
    if (mode === 'sample') revealAll();
    else if (mode === 'revealed') resetArchive();
  });

  let revealOrder = [], revealCursor = 0, revealStart = 0;
  const REVEAL_SECONDS = reduceMotion ? 0.01 : 2.6;
  function revealAll() {
    const est = chao1();
    estimateBeforeReveal = est === null || sObs < 3 ? null : est;
    mode = 'revealing';
    root.classList.add('is-revealing');
    el.button.disabled = true;
    revealOrder = [];
    for (let i = 0; i < COPIES; i++) if (!revealed[i]) revealOrder.push(i);
    revealOrder.sort((a, b) => positions[a * 3] - positions[b * 3]);
    revealCursor = 0;
    revealStart = clock;
  }
  function finishReveal() {
    mode = 'revealed';
    renderLedger(true);
    root.classList.remove('is-revealing');
    root.classList.add('is-revealed');
    el.button.disabled = false;
    el.button.textContent = 'Darken the archive';
    el.est.textContent = fmt(WORKS);
    el.dark.textContent = 'works in the archive';
    el.verdict.hidden = false;
    el.verdict.textContent = estimateBeforeReveal === null
      ? 'You lit too little for an estimate. Darken the archive and try again.'
      : `Your sample estimated ${fmt(estimateBeforeReveal)}; it had found ${fmt(sampleSObs)}. ` +
        (estimateBeforeReveal <= WORKS
          ? 'Chao1 is a lower bound: it says at least this many.'
          : 'A lucky (or unlucky) sample — estimates scatter around the truth.');
  }
  let sampleSObs = 0;
  function resetArchive() {
    revealed.fill(0); anim.fill(0); workCount.fill(0);
    for (let i = 0; i < COPIES; i++) { state[i * 3] = 0; state[i * 3 + 1] = 0; }
    stateDirty = true;
    n = sObs = f1 = f2 = 0;
    mode = 'sample';
    root.classList.remove('is-revealed');
    el.verdict.hidden = true;
    el.button.textContent = 'Light the whole archive';
    renderLedger(true);
  }

  // ---------- pointer & autopilot ----------
  const raycaster = new Raycaster();
  const plane = new Plane(new Vector3(0, 0, 1), -2);
  const ndc = new Vector2();
  const parallax = new Vector2();
  let lastHuman = -1e9;
  let clock = 0;

  function aim(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    raycaster.ray.intersectPlane(plane, lampTarget);
    parallax.copy(ndc);
    lastHuman = clock;
    root.classList.add('is-touched');
  }
  root.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' || e.pointerType === 'pen') aim(e.clientX, e.clientY); });
  root.addEventListener('pointerdown', (e) => { if (!e.target.closest('a, button')) aim(e.clientX, e.clientY); });

  function autopilot(t) {
    // a slow, wandering figure-of-eight across the shelves
    lampTarget.set(
      halfW * 0.62 * Math.sin(t * 0.17 + 0.6) + halfW * 0.12 * Math.sin(t * 0.53),
      halfH * 0.5 * Math.sin(t * 0.29) + halfH * 0.1 * Math.cos(t * 0.71),
      2,
    );
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
    layout();
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
  function frame(now) {
    if (!visible || document.hidden) { running = false; return; }
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    clock += dt;
    timeUniform.value = clock;

    const idle = clock - lastHuman > 5;
    if (idle && !reduceMotion) autopilot(clock);
    lamp.lerp(lampTarget, 1 - Math.exp(-dt * (idle ? 2.2 : 9)));
    lampUniform.value.copy(lamp);
    if (idle) parallax.multiplyScalar(1 - dt);
    camera.position.x += (parallax.x * 1.4 - camera.position.x) * Math.min(1, dt * 2);
    camera.position.y += (parallax.y * 0.9 - camera.position.y) * Math.min(1, dt * 2);
    camera.lookAt(0, 0, 0);

    if (mode === 'sample') { sample(dt); sampleSObs = sObs; }
    else if (mode === 'revealing') {
      const k = Math.min(1, (clock - revealStart) / REVEAL_SECONDS);
      const upto = Math.floor(k * revealOrder.length);
      while (revealCursor < upto) observe(revealOrder[revealCursor++]);
      if (k >= 1) finishReveal();
    }

    for (let i = 0; i < COPIES; i++) {
      if (revealed[i] && anim[i] < 1) {
        anim[i] = Math.min(1, anim[i] + dt / (reduceMotion ? 0.2 : 0.9));
        state[i * 3] = anim[i];
        stateDirty = true;
      }
    }
    if (stateDirty) { stateAttr.needsUpdate = true; stateDirty = false; }
    if (mode !== 'revealed') renderLedger(false);

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  renderLedger(true);
  root.classList.add('is-live');
  kick();
}
