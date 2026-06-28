/*
 * coverage-math.js
 * -----------------
 * Framework-free math for the coverage-standardization demo on www.karsdorp.io.
 *
 * It is a faithful JavaScript port of the sample-coverage estimator used in the
 * `copia` package (function `estimate_coverage`), which in turn implements the
 * iNEXT individual-based coverage estimator of Chao & Jost (2012) and
 * Chao et al. (2014). The full-sample coverage matches Eq. (2.2) of
 * "Correcting collection bias in comparative studies of diversity"
 * (Karsdorp, Kandler, Kestemont, Romanowska & Stapel, J. R. Soc. Interface 2026):
 *
 *     Ĉ_n = 1 - (f1/n) * [ (n-1) f1 / ( (n-1) f1 + 2 f2 ) ]
 *
 * Individual-based (Hurlbert) rarefaction of richness:
 *
 *     E[S_m] = Σ_i [ 1 - C(n - x_i, m) / C(n, m) ]
 *
 * Coverage of a rarefied subsample of size m < n:
 *
 *     Ĉ_m = 1 - Σ_i (x_i / n) * C(n - x_i, m) / C(n, m)
 *
 * The module exposes a global `CoverageMath` object in the browser and also
 * exports for Node (so the math can be unit-tested headlessly).
 */
(function (root) {
  "use strict";

  /* ---- log-gamma (Lanczos approximation) -------------------------------- */
  var LANCZOS = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
  ];
  function lgamma(x) {
    if (x < 0.5) {
      return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x);
    }
    x -= 1;
    var a = LANCZOS[0];
    var t = x + 7.5;
    for (var i = 1; i < 9; i++) a += LANCZOS[i] / (x + i);
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
  }

  /* ---- seeded PRNG (mulberry32) ----------------------------------------- */
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---- synthetic community: log-normal species-abundance distribution --- */
  // Inverse standard-normal CDF (Acklam's rational approximation).
  function qnorm(p) {
    var a = [-3.969683028665376e+1, 2.209460984245205e+2, -2.759285104469687e+2,
             1.383577518672690e+2, -3.066479806614716e+1, 2.506628277459239e+0];
    var b = [-5.447609879822406e+1, 1.615858368580409e+2, -1.556989798598866e+2,
             6.680131188771972e+1, -1.328068155288572e+1];
    var c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838e+0,
             -2.549732539343734e+0, 4.374664141464968e+0, 2.938163982698783e+0];
    var d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996e+0,
             3.754408661907416e+0];
    var plow = 0.02425, phigh = 1 - plow, q, r;
    if (p < plow) {
      q = Math.sqrt(-2 * Math.log(p));
      return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
             ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
    } else if (p <= phigh) {
      q = p - 0.5; r = q * q;
      return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5]) * q /
             (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
    } else {
      q = Math.sqrt(-2 * Math.log(1 - p));
      return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
              ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
    }
  }

  // Deterministic rank-abundance envelope: the *expected* log-normal SAD.
  // The k-th of S types gets relative weight w_k = exp(sigma * Φ⁻¹(1 - u_k)),
  // u_k = (k - 0.5)/S, normalized to sum 1. Because the sorted-abundance shape
  // (Lorenz curve) is the same envelope for every S, two assemblages of
  // different richness are exact replicates of one shared abundance shape —
  // the replication-principle condition (Chao & Jost 2012) under which
  // coverage-based standardization recovers the true richness ratio. This lets
  // the demo isolate the effect of *sampling effort* from differences in shape.
  // sigma controls skew (0 = perfectly even; larger = more dominance).
  function makeAbundance(S, sigma) {
    var p = new Array(S), Z = 0, i;
    for (i = 0; i < S; i++) { p[i] = Math.exp(sigma * qnorm(1 - (i + 0.5) / S)); Z += p[i]; }
    for (i = 0; i < S; i++) p[i] /= Z;
    return p;
  }

  // Draw n individuals from community p (seeded), return abundance counts per type.
  // Because mulberry32(seed) is a fixed stream, drawing n then n+k yields a nested
  // sample: increasing the sample-size slider extends the same draw sequence.
  function sampleCounts(p, n, rng) {
    var S = p.length;
    var cum = new Array(S), c = 0, i;
    for (i = 0; i < S; i++) { c += p[i]; cum[i] = c; }
    var counts = new Array(S).fill(0);
    for (var k = 0; k < n; k++) {
      var u = rng() * c; // c ~= 1, guards against fp drift
      // binary search for first cum >= u
      var lo = 0, hi = S - 1;
      while (lo < hi) { var mid = (lo + hi) >> 1; if (cum[mid] < u) lo = mid + 1; else hi = mid; }
      counts[lo]++;
    }
    return counts;
  }

  /* ---- coverage estimator (Chao / iNEXT / copia) ------------------------ */
  // Full-sample coverage, Eq. (2.2). Mirrors `compute_coverage` in the
  // reference code (coverage-based-standardization/src/simulation.py): the
  // singleton/doubleton correction is 1 when f2 == 0.
  function coverageFull(n, f1, f2) {
    var correction = 1;
    if (f2 > 0) correction = ((n - 1) * f1) / ((n - 1) * f1 + 2 * f2);
    return 1 - (f1 / n) * correction;
  }

  // log[ C(n - xi, m) / C(n, m) ]; returns -Infinity (ratio 0) when n - xi < m.
  function logRatio(n, xi, m) {
    if (n - xi < m) return -Infinity;
    return lgamma(n - xi + 1) - lgamma(n - xi - m + 1) - lgamma(n + 1) + lgamma(n - m + 1);
  }

  // Expected richness of a rarefied subsample of (continuous) size m (Hurlbert).
  // x is the array of positive abundances; n is their sum.
  function expectedRichness(x, n, m) {
    if (m >= n) return x.length;
    if (m <= 0) return 0;
    var sumRatio = 0;
    for (var i = 0; i < x.length; i++) {
      var lr = logRatio(n, x[i], m);
      if (lr > -Infinity) sumRatio += Math.exp(lr);
    }
    return x.length - sumRatio; // Σ_i (1 - ratio_i)
  }

  // Estimated coverage of a rarefied subsample of (continuous) size m, m < n.
  // NOTE: the iNEXT coverage-rarefaction formula divides by C(n-1, m), not the
  // C(n, m) used for richness rarefaction. The two differ by the factor
  // n/(n-m); using C(n, m) here would inflate coverage (and spike it to 1 as
  // m→n). logRatio() returns C(n-xi, m)/C(n, m), so we rescale by n/(n-m).
  function coverageRarefied(x, n, m) {
    if (m <= 0) return 0;
    if (m >= n) return coverageFull(n, count(x, 1), count(x, 2));
    var s = 0;
    for (var i = 0; i < x.length; i++) {
      var lr = logRatio(n, x[i], m);
      if (lr > -Infinity) s += (x[i] / n) * Math.exp(lr);
    }
    return 1 - (n / (n - m)) * s;
  }
  function count(x, v) { var c = 0; for (var i = 0; i < x.length; i++) if (x[i] === v) c++; return c; }

  // Full rarefaction curve at EVERY integer subsample size m = 1..n, exactly as
  // the reference computes it (estimate_coverage / rarefaction_extrapolation
  // with step_size = 1) — no grid, no downsampling. The per-type ratio
  // r_i(m) = C(n−x_i, m)/C(n, m) satisfies the recurrence
  //   r_i(m+1) = r_i(m) · (n − x_i − m)/(n − m),   r_i(1) = (n − x_i)/n,
  // so the whole curve costs O(n · S_obs) with no per-point log-gamma. Returns
  // arrays indexed 0..n−1 for m = 1..n; the m = n coverage endpoint is NaN here
  // and set to coverageFull() by the caller. Richness E[S_m] = S_obs − Σ r_i(m);
  // coverage Ĉ_m = 1 − (n/(n−m)) Σ (x_i/n) r_i(m).
  function fullCurve(x, n) {
    var Rsum = new Float64Array(n + 1), Csum = new Float64Array(n + 1), inv = new Float64Array(n);
    var m;
    for (m = 1; m < n; m++) inv[m] = 1 / (n - m);
    for (var i = 0; i < x.length; i++) {
      var xi = x[i], mmax = n - xi;
      if (mmax < 1) continue;
      var r = mmax / n, xin = xi / n;
      for (m = 1; m <= mmax; m++) {
        Rsum[m] += r; Csum[m] += xin * r;
        r *= (n - xi - m) * inv[m];          // → r_i(m+1)
      }
    }
    var Sobs = x.length, S = new Array(n), C = new Array(n), k;
    for (k = 1; k <= n; k++) {
      S[k - 1] = Sobs - Rsum[k];
      C[k - 1] = k < n ? 1 - (n / (n - k)) * Csum[k] : NaN; // endpoint set by caller
    }
    return { S: S, C: C };
  }

  // Draw one sample of size n from community p and reduce it to (x, f1, f2).
  function sampleStats(p, n, sampleSeed) {
    var counts = sampleCounts(p, n, mulberry32(sampleSeed >>> 0));
    var x = [], f1 = 0, f2 = 0;
    for (var i = 0; i < counts.length; i++) {
      var ci = counts[i];
      if (ci > 0) { x.push(ci); if (ci === 1) f1++; else if (ci === 2) f2++; }
    }
    return { x: x, n: n, f1: f1, f2: f2, Sobs: x.length, Cfull: coverageFull(n, f1, f2) };
  }

  // Monte-Carlo expected rarefaction curve for one assemblage configuration.
  // The community (true richness S, abundance skew sigma) is FIXED; only the
  // sampling varies across R replicates — mirroring the paper's simulation
  // design, where populations are fixed and the sampling process is repeated.
  // opts: { S, sigma, n, seed, gamma }. Returns averaged parallel arrays, one
  // entry per integer subsample size m = 1..n (the full curve, as the reference
  // computes it — no grid).
  // `gamma` models Stromer's-Riddle rarity bias exactly as the reference code's
  // stromers_riddle_sampling: records are drawn with weight ∝ count^(1-gamma),
  // i.e. from q_i ∝ p_i^(1-gamma). gamma = 0 is unbiased (proportional to true
  // frequency); gamma > 0 increasingly over-records rare/novel variants. The
  // population's true richness S is unchanged (q has the same support); only
  // which variants enter the record is distorted.
  function meanCurve(opts, R) {
    R = R || 20;
    var p = makeAbundance(opts.S, opts.sigma);
    var gamma = opts.gamma || 0;
    if (gamma !== 0) {
      var q = new Array(p.length), Zb = 0, b, e = 1 - gamma;
      for (b = 0; b < p.length; b++) { q[b] = Math.pow(p[b], e); Zb += q[b]; }
      for (b = 0; b < p.length; b++) q[b] /= Zb;
      p = q;
    }
    var n = opts.n, last = n - 1;
    var Sacc = new Float64Array(n), Cacc = new Float64Array(n);
    var SobsAcc = 0, CfullAcc = 0;
    var base = (opts.seed ^ 0x9e3779b9) >>> 0;
    for (var r = 0; r < R; r++) {
      var st = sampleStats(p, n, (base + Math.imul(r + 1, 0x85ebca6b)) >>> 0);
      var fc = fullCurve(st.x, n);
      for (var j = 0; j < n; j++) {
        Sacc[j] += fc.S[j];
        Cacc[j] += (j === last) ? st.Cfull : fc.C[j];
      }
      SobsAcc += st.Sobs; CfullAcc += st.Cfull;
    }
    var mGrid = new Array(n), Sbar = new Array(n), Cbar = new Array(n), prevC = 0;
    for (var t = 0; t < n; t++) {
      mGrid[t] = t + 1;
      Sbar[t] = Sacc[t] / R;
      var cb = Cacc[t] / R;
      if (cb < prevC) cb = prevC;          // enforce monotone coverage for display
      prevC = cb; Cbar[t] = cb;
    }
    return {
      Strue: opts.S, n: n, m: mGrid, S: Sbar, C: Cbar,
      Sobs: SobsAcc / R, Cfull: CfullAcc / R
    };
  }

  // Linear interpolation of ys at x, given strictly increasing xs.
  function interpY(xs, ys, x) {
    var n = xs.length;
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    var lo = 0, hi = n - 1;
    while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (xs[mid] <= x) lo = mid; else hi = mid; }
    var t = (x - xs[lo]) / (xs[hi] - xs[lo]);
    return ys[lo] + t * (ys[hi] - ys[lo]);
  }

  /* ---- the three standardization strategies ----------------------------- */
  // cA, cB are meanCurve() results for assemblages A and B.
  function analyze(cA, cB) {
    var nmin = Math.min(cA.n, cB.n);
    var SA_nmin = interpY(cA.m, cA.S, nmin);
    var SB_nmin = interpY(cB.m, cB.S, nmin);

    var Cmax = Math.min(cA.Cfull, cB.Cfull);
    var SA_cov = interpY(cA.C, cA.S, Cmax);
    var SB_cov = interpY(cB.C, cB.S, Cmax);

    return {
      trueRatio: cA.Strue / cB.Strue,
      size: {        // "size-based": observed richness at actual sample sizes
        ratio: cA.Sobs / cB.Sobs,
        ptA: { x: cA.n, y: cA.Sobs }, ptB: { x: cB.n, y: cB.Sobs }
      },
      rarefaction: { // "rarefaction-based": both rarefied to n_min
        ratio: SA_nmin / SB_nmin, nmin: nmin,
        ptA: { x: nmin, y: SA_nmin }, ptB: { x: nmin, y: SB_nmin }
      },
      coverage: {    // "coverage-based": both standardized to shared coverage
        ratio: SA_cov / SB_cov, Cmax: Cmax,
        ptA: { x: Cmax, y: SA_cov }, ptB: { x: Cmax, y: SB_cov }
      }
    };
  }

  var CoverageMath = {
    lgamma: lgamma,
    mulberry32: mulberry32,
    makeAbundance: makeAbundance,
    sampleCounts: sampleCounts,
    coverageFull: coverageFull,
    expectedRichness: expectedRichness,
    coverageRarefied: coverageRarefied,
    fullCurve: fullCurve,
    sampleStats: sampleStats,
    meanCurve: meanCurve,
    interpY: interpY,
    analyze: analyze
  };

  root.CoverageMath = CoverageMath;
  if (typeof module !== "undefined" && module.exports) module.exports = CoverageMath;
})(typeof self !== "undefined" ? self : this);
