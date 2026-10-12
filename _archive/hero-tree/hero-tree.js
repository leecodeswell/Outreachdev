/* =====================================================================
   ARCHIVED HERO TREE: script (removed from the live site Oct 2026)
   Self-contained: brings its own tiny helpers. Expects the markup in
   demo.html (a .flow element) and the #o-mark symbol on the page.
   ===================================================================== */
(function () {
  "use strict";
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* =====================================================================
     HERO TREE (desktop): branches grow out from the hub to each leaf,
     twigs sprout small leaves, everything sways in a slow breeze, light
     pulses run in from your inputs and out to the results, and now and
     then a leaf lets go and drifts down. Drawn at 2x for crisp lines.
     ===================================================================== */
  (function treeAnim() {
    var flow = $(".flow");
    if (!flow) return;
    var canvas = $(".flow-canvas", flow), ctx = canvas.getContext("2d");
    var inputs = $$('[data-node="in"]', flow), outputs = $$('[data-node="out"]', flow), hub = $('[data-node="hub"]', flow);
    var labels = $$(".flow-label", flow);
    var paths = [], pulses = [], ripples = [], sparks = [], motes = [], falling = [];
    var sideEnd = { in: 0, out: 1 }, maxReach = 1, W = 0, H = 0, HC = { x: 0, y: 0, r: 1 }, twigLen = 40;
    var growStart = -1, grown = false, visible = true, seen = false, clock = 0, liveAt = -1, nextFall = 4, spawnClock = 0.4;
    var ptr = { x: -9999, y: -9999, on: false };
    var GROW_MS = 1300, SPEED = 230;   // px per second for the light pulses

    // a soft round glow, drawn once at high resolution and reused (smooth at any size)
    var sprite = (function () {
      var c = document.createElement("canvas"); c.width = c.height = 256;
      var g = c.getContext("2d"), r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
      r.addColorStop(0, "rgba(252,243,225,1)"); r.addColorStop(0.07, "rgba(245,219,174,0.9)");
      r.addColorStop(0.22, "rgba(203,154,88,0.38)"); r.addColorStop(0.5, "rgba(134,105,68,0.11)"); r.addColorStop(1, "rgba(134,105,68,0)");
      g.fillStyle = r; g.fillRect(0, 0, 256, 256); return c;
    })();
    function glow(x, y, R, a) { if (a <= 0) return; ctx.globalAlpha = Math.min(1, a); ctx.drawImage(sprite, x - R, y - R, R * 2, R * 2); ctx.globalAlpha = 1; }

    function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
    function ease(t) { return 1 - Math.pow(1 - t, 3); }
    function easeBack(t) { var c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }
    function rng(seed) { return function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }; }
    function bez(p, t) {
      var u = 1 - t;
      return { x: u * u * u * p.p0.x + 3 * u * u * t * p.p1.x + 3 * u * t * t * p.p2.x + t * t * t * p.p3.x,
               y: u * u * u * p.p0.y + 3 * u * u * t * p.p1.y + 3 * u * t * t * p.p2.y + t * t * t * p.p3.y };
    }
    function bezD(p, t) {
      var u = 1 - t, a = 3 * u * u, b = 6 * u * t, c = 3 * t * t;
      var x = a * (p.p1.x - p.p0.x) + b * (p.p2.x - p.p1.x) + c * (p.p3.x - p.p2.x);
      var y = a * (p.p1.y - p.p0.y) + b * (p.p2.y - p.p1.y) + c * (p.p3.y - p.p2.y);
      var l = Math.hypot(x, y) || 1; return { x: x / l, y: y / l };
    }
    function wind(t) { return Math.sin(t * 0.43) * 0.6 + Math.sin(t * 0.71 + 1.7) * 0.3 + Math.sin(t * 1.9 + 0.3) * 0.1; }

    /* ---------- layout ---------- */
    function build() {
      flow.querySelectorAll(".node").forEach(function (n) { n.style.setProperty("--sx", "0px"); n.style.setProperty("--sy", "0px"); n.style.setProperty("--sr", "0deg"); });
      var base = flow.getBoundingClientRect();
      W = base.width; H = base.height;
      if (!W || !H) return false;
      var scale = Math.min(3, Math.max(2, window.devicePixelRatio || 1));   // at least 2x for smooth curves, up to 3x on very sharp screens
      canvas.width = Math.round(W * scale); canvas.height = Math.round(H * scale);
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      var hr = hub.getBoundingClientRect();
      // offsetWidth ignores the pop-in scale, so the ring is placed for the orb's real size
      HC = { x: hr.left - base.left + hr.width / 2, y: hr.top - base.top + hr.height / 2, r: (hub.offsetWidth || hr.width) / 2 };
      twigLen = Math.min(66, W / 23);
      var rand = rng(11);

      function make(node, kind, order, end, limb) {
        var tip, c;
        if (node) {
          var sr = node.querySelector(".stem").getBoundingClientRect(), er = node.getBoundingClientRect();
          tip = { x: (kind === "in" ? sr.right : sr.left) - base.left, y: sr.top + sr.height / 2 - base.top };
          c = { x: er.left - base.left + er.width / 2, y: er.top - base.top + er.height / 2 };
        } else { tip = { x: limb.x, y: limb.y }; c = tip; }   // a limb starts at its fork
        var ang = clamp((tip.y - HC.y) / (HC.r * 4), -0.5, 0.5);
        var p = { kind: kind, node: node, tip: tip, c: c, phase: rand() * 6.283, delay: order, twigs: [], isLimb: !node, toLimb: null,
          hubPt: end || { x: HC.x + (kind === "in" ? -1 : 1) * HC.r * Math.cos(ang), y: HC.y + HC.r * Math.sin(ang) },
          s: { dx: 0, dy: 0, rot: 0, ax: 0, ay: 0, bend: 0 }, last: 0 };
        geom(p);
        var len = 0, prev = bez(p, 0);
        for (var k = 1; k <= 24; k++) { var q = bez(p, k / 24); len += Math.hypot(q.x - prev.x, q.y - prev.y); prev = q; }
        p.len = len;
        var n = !node ? 3 : kind === "in" ? (rand() > 0.5 ? 1 : 0) : 5, up = tip.y < HC.y - 8 ? -1 : tip.y > HC.y + 8 ? 1 : 0;
        for (var i = 0; i < n; i++) {
          var side = up ? (i % 3 === 1 ? -up : up) : (i % 2 ? 1 : -1);
          var tw = { at: 0.16 + (i + 0.2 + rand() * 0.6) * (0.66 / n), side: side, ang: 0.5 + rand() * 0.42, L: twigLen * (0.6 + rand() * 0.75), ph: rand() * 6.283, leaves: [] };
          tw.leaves.push({ u: 1, side: 0, size: 14 + rand() * 8, ph: rand() * 6.283, sc: 1, kind: (rand() * 3) | 0, tone: pickTone(rand()) });
          if (rand() > 0.25) tw.leaves.push({ u: 0.5 + rand() * 0.2, side: rand() > 0.5 ? 1 : -1, size: 10 + rand() * 6, ph: rand() * 6.283, sc: 1, kind: (rand() * 3) | 0, tone: pickTone(rand()) });
          if (rand() > 0.55) tw.leaves.push({ u: 0.28 + rand() * 0.14, side: rand() > 0.5 ? 1 : -1, size: 8 + rand() * 4, ph: rand() * 6.283, sc: 1, kind: (rand() * 3) | 0, tone: pickTone(rand()) });
          p.twigs.push(tw);
        }
        return p;
      }
      var keep = paths; paths = []; pulses = []; sparks = []; ripples = [];
      // the inputs gather onto three limbs (top, middle, bottom) that run into the orb
      var groups = [[0, 1], [2, 3], [4, 5]], maxTip = 0;
      inputs.forEach(function (nd) { var r = nd.querySelector(".stem").getBoundingClientRect(); maxTip = Math.max(maxTip, r.right - base.left); });
      var forkX = maxTip + (HC.x - HC.r - maxTip) * 0.42;
      groups.forEach(function (gr, gi) {
        var members = gr.map(function (k) { return inputs[k]; }).filter(Boolean);
        if (!members.length) return;
        var ys = members.map(function (nd) { var r = nd.querySelector(".stem").getBoundingClientRect(); return r.top + r.height / 2 - base.top; });
        var my = ys.reduce(function (a, b) { return a + b; }, 0) / ys.length;
        var fork = { x: forkX + (gi === 1 ? 18 : 0), y: my + (HC.y - my) * 0.35 };
        var limb = make(null, "in", 300, null, fork);
        paths.push(limb);
        members.forEach(function (nd, k) { var p = make(nd, "in", 300, fork); p.toLimb = limb; paths.push(p); });
      });
      outputs.forEach(function (nd, k) { paths.push(make(nd, "out", 300)); });
      sideEnd = { in: W, out: 0 };
      paths.forEach(function (p) { if (!p.node) return; if (p.kind === "in") sideEnd.in = Math.min(sideEnd.in, p.tip.x); else sideEnd.out = Math.max(sideEnd.out, p.tip.x); });
      maxReach = 0; paths.forEach(function (p) { maxReach = Math.max(maxReach, (p.toLimb ? p.toLimb.len : 0) + p.len); });
      // motes: faint specks of light drifting up through the tree
      var count = Math.min(70, Math.round(W * H / 15000));
      if (motes.length !== count || !keep.length) {
        motes = [];
        for (var m = 0; m < count; m++) motes.push({ x: Math.random() * W, y: Math.random() * H, r: 0.4 + Math.random() * 1.3, vy: -(3 + Math.random() * 9), vx: (Math.random() - 0.5) * 4, ph: Math.random() * 6.283, tw: 0.6 + Math.random() * 1.6 });
      }
      return true;
    }

    // where the branch runs right now (its leaf end moves with the leaf)
    function geom(p) {
      var s = p.s, leaf = { x: p.tip.x + s.ax, y: p.tip.y + s.ay }, h = p.hubPt;
      var a = p.kind === "in" ? leaf : h, b = p.kind === "in" ? h : leaf, mid = (a.x + b.x) / 2;
      var bl = s.bend, bh = s.bend * 0.25;
      p.p0 = a; p.p3 = b;
      p.p1 = { x: mid, y: a.y + (p.kind === "in" ? bl : bh) };
      p.p2 = { x: mid, y: b.y + (p.kind === "in" ? bh : bl) };
    }

    /* ---------- the breeze ---------- */
    function sway(p, t, dt, amp) {
      var g = wind(t - p.c.x * 0.0013), loc = Math.sin(t * 1.25 + p.phase);
      var dx = (g * 2.4 + loc * 0.8) * amp, dy = (Math.sin(t * 0.9 + p.phase) * 3 + g * 1.1) * amp, rot = (g * 0.8 + loc * 0.35) * amp;
      if (ptr.on) {   // leaves lean away from the cursor
        var ex = p.c.x - ptr.x, ey = p.c.y - ptr.y, d = Math.hypot(ex, ey);
        if (d < 200 && d > 1) { var k = Math.pow(1 - d / 200, 2); dx += ex / d * 12 * k; dy += ey / d * 9 * k; rot += (ex > 0 ? 1 : -1) * 1.4 * k; }
      }
      var s = p.s, f = Math.min(1, dt * 7);
      s.dx += (dx - s.dx) * f; s.dy += (dy - s.dy) * f; s.rot += (rot - s.rot) * f;
      s.bend = (g * 7 + loc * 2) * amp + s.dy * 0.6;
      var r = s.rot * Math.PI / 180, ox = p.tip.x - p.c.x, oy = p.tip.y - p.c.y;
      s.ax = (ox * Math.cos(r) - oy * Math.sin(r)) - ox + s.dx;
      s.ay = (ox * Math.sin(r) + oy * Math.cos(r)) - oy + s.dy;
      var st = p.node.style;
      st.setProperty("--sx", s.dx.toFixed(2) + "px"); st.setProperty("--sy", s.dy.toFixed(2) + "px"); st.setProperty("--sr", s.rot.toFixed(3) + "deg");
    }

    /* ---------- drawing ---------- */
    // a filled ribbon along sampled points, wide at w0 and narrow at w1: tapered like a real branch
    function ribbon(pts, w0, w1) {
      var n = pts.length - 1, L = [], R = [];
      for (var i = 0; i <= n; i++) {
        var a = pts[Math.max(0, i - 1)], b = pts[Math.min(n, i + 1)];
        var tx = b.x - a.x, ty = b.y - a.y, l = Math.hypot(tx, ty) || 1, w = (w0 + (w1 - w0) * (i / n)) / 2;
        L.push([pts[i].x - ty / l * w, pts[i].y + tx / l * w]); R.push([pts[i].x + ty / l * w, pts[i].y - tx / l * w]);
      }
      ctx.beginPath(); ctx.moveTo(L[0][0], L[0][1]);
      for (i = 1; i <= n; i++) ctx.lineTo(L[i][0], L[i][1]);
      for (i = n; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]);
      ctx.closePath(); ctx.fill();
    }
    // Leaves: three shapes, a few autumn-gold tones (and the odd violet one), lit on one half of the
    // midrib and shaded on the other, with side veins and a bright rim. "flip" turns the leaf over in
    // the breeze (1 = top side, 0 = edge-on, -1 = underside, which is paler).
    var SHAPES = [
      { w: 0.46, a: [0.16, 1.05], b: [0.6, 0.95] },    // ovate
      { w: 0.30, a: [0.24, 1.0], b: [0.7, 0.72] },     // lance
      { w: 0.58, a: [0.1, 0.75], b: [0.52, 1.18] }     // round
    ];
    var TONES = [
      { base: [65, 50, 33], tip: [192, 145, 79], under: [225, 198, 154] },   // gold
      { base: [69, 51, 30], tip: [196, 146, 67], under: [228, 201, 147] },   // bright gold
      { base: [58, 45, 30], tip: [166, 126, 72], under: [217, 190, 142] }     // soft gold
    ];
    function pickTone(r) { return r < 0.45 ? 0 : r < 0.8 ? 1 : 2; }
    function rgba(c, k, a) { return "rgba(" + (c[0] * k | 0) + "," + (c[1] * k | 0) + "," + (c[2] * k | 0) + "," + a + ")"; }
    function lift(c, k) { return [c[0] + (255 - c[0]) * k, c[1] + (255 - c[1]) * k, c[2] + (255 - c[2]) * k]; }
    function drawLeaf(x, y, ang, len, bright, alpha, kind, tone, flip) {
      if (len < 0.4) return;
      var S = SHAPES[kind || 0], T = TONES[tone || 0], f = flip == null ? 1 : flip;
      if (Math.abs(f) < 0.06) f = f < 0 ? -0.06 : 0.06;
      var w = len * S.w, under = f < 0, stalk = len * 0.14, L = len;
      var tipC = lift(under ? T.under : T.tip, 0.28 * bright), baseC = lift(T.base, 0.2 * bright);
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
      ctx.globalAlpha = alpha == null ? 1 : alpha;
      // stalk
      ctx.strokeStyle = rgba(T.tip, 0.8, 0.55); ctx.lineWidth = Math.max(0.7, len * 0.05); ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(stalk, 0); ctx.stroke();
      ctx.translate(stalk, 0); ctx.scale(1, f);
      function half(sg) {
        ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.bezierCurveTo(L * S.a[0], sg * w * S.a[1], L * S.b[0], sg * w * S.b[1], L, 0);
        ctx.closePath();
      }
      // the lit half and the shaded half
      var g1 = ctx.createLinearGradient(0, 0, L, 0);
      g1.addColorStop(0, rgba(baseC, 1, 0.92)); g1.addColorStop(0.55, rgba(tipC, 0.92, 0.95)); g1.addColorStop(1, rgba(tipC, 1, 1));
      half(-1); ctx.fillStyle = g1; ctx.fill();
      var g2 = ctx.createLinearGradient(0, 0, L, 0);
      g2.addColorStop(0, rgba(baseC, 0.7, 0.95)); g2.addColorStop(1, rgba(tipC, 0.68, 0.95));
      half(1); ctx.fillStyle = g2; ctx.fill();
      // a soft sheen across the lit half
      var sh = ctx.createLinearGradient(0, -w * 0.9, 0, 0);
      sh.addColorStop(0, "rgba(252,241,223," + (0.16 + 0.22 * bright) + ")"); sh.addColorStop(1, "rgba(252,241,223,0)");
      half(-1); ctx.fillStyle = sh; ctx.fill();
      // veins
      var vA = 0.22 + 0.4 * bright, lw = Math.max(0.45, len * 0.028);
      ctx.strokeStyle = "rgba(247,227,189," + vA + ")"; ctx.lineWidth = lw;
      ctx.beginPath();
      for (var v = 1; v <= 4; v++) {
        var u = 0.12 + v * 0.17, reach = w * S.b[1] * 0.62 * (1 - u * 0.45);
        ctx.moveTo(L * u, 0); ctx.quadraticCurveTo(L * (u + 0.07), -reach * 0.55, L * (u + 0.15), -reach);
        ctx.moveTo(L * u, 0); ctx.quadraticCurveTo(L * (u + 0.07), reach * 0.55, L * (u + 0.15), reach);
      }
      ctx.stroke();
      // midrib
      ctx.strokeStyle = "rgba(249,233,205," + (0.42 + 0.45 * bright) + ")"; ctx.lineWidth = lw * 1.7;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(L * 0.5, -w * 0.04, L * 0.94, 0); ctx.stroke();
      // bright rim on the lit edge
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(L * S.a[0], -w * S.a[1], L * S.b[0], -w * S.b[1], L, 0);
      ctx.strokeStyle = "rgba(246,223,180," + (0.32 + 0.5 * bright) + ")"; ctx.lineWidth = lw * 1.4; ctx.stroke();
      // a darker edge on the shaded side gives the leaf body
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(L * S.a[0], w * S.a[1], L * S.b[0], w * S.b[1], L, 0);
      ctx.strokeStyle = rgba(T.base, 0.6, 0.5); ctx.lineWidth = lw; ctx.stroke();
      ctx.restore();
      if (bright > 0.2) glow(x + Math.cos(ang) * len * 0.6, y + Math.sin(ang) * len * 0.6, len * 2, bright * 0.45);
    }
    // how much light is passing a point on a branch right now (0..1)
    function energy(p, t) {
      var e = 0;
      for (var i = 0; i < pulses.length; i++) { var q = pulses[i]; if (q.p !== p || q.wait > 0) continue; var d = (q.t - t) / 0.09; e = Math.max(e, Math.exp(-d * d)); }
      return e;
    }

    function drawBranch(p, g, t, amp) {
      var from = p.kind === "in" ? 1 - g : 0, to = p.kind === "in" ? 1 : g, N = 40, pts = [];
      // sample from the hub outward so the ribbon is thick at the hub
      for (var i = 0; i <= N; i++) { var tt = p.kind === "in" ? to - (to - from) * i / N : from + (to - from) * i / N; pts.push(bez(p, tt)); }
      // soft light under the branch
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath(); pts.forEach(function (q, k) { if (k) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); });
      if (p.kind === "out") { ctx.strokeStyle = "rgba(134,105,68,0.06)"; ctx.lineWidth = 7; ctx.stroke(); }   // no halo on the forked side, so nothing marks where a branch splits
      // one gradient per side, measured from the orb, so a limb and the branches that fork off it shade as one piece
      var gx0 = HC.x + (p.kind === "in" ? -HC.r : HC.r), gx1 = p.kind === "in" ? sideEnd.in : sideEnd.out;
      var gr = ctx.createLinearGradient(gx0, 0, gx1, 0);
      gr.addColorStop(0, "rgb(145,115,75)"); gr.addColorStop(0.55, "rgb(74,61,44)"); gr.addColorStop(1, "rgb(44,37,27)");   // solid, so overlapping branches at a fork don't add up
      ctx.fillStyle = gr;
      if (p.kind === "out") ribbon(pts, 6, 2 + 3 * (1 - g)); else if (p.isLimb) ribbon(pts, 6, 3.2 + 2 * (1 - g)); else ribbon(pts, 3.2, 0.8 + 2.4 * (1 - g));
      // twigs and their leaves
      p.twigs.forEach(function (tw) {
        var k = clamp((g - tw.at) / 0.24, 0, 1);
        if (!k) return;
        var e = ease(k), tPath = p.kind === "in" ? 1 - tw.at : tw.at, s = bez(p, tPath), d = bezD(p, tPath);
        if (p.kind === "in") { d.x = -d.x; d.y = -d.y; }   // point away from the hub
        var a = tw.side * (tw.ang + Math.sin(t * 1.6 + tw.ph) * 0.05 * amp), ca = Math.cos(a), sa = Math.sin(a);
        var dir = { x: d.x * ca - d.y * sa, y: d.x * sa + d.y * ca };
        var c = { x: s.x + dir.x * tw.L * 0.55, y: s.y + dir.y * tw.L * 0.55 };
        var en = { x: s.x + (dir.x * 0.72 + d.x * 0.42) * tw.L, y: s.y + (dir.y * 0.72 + d.y * 0.42) * tw.L };
        function q(u) { var v = 1 - u; return { x: v * v * s.x + 2 * v * u * c.x + u * u * en.x, y: v * v * s.y + 2 * v * u * c.y + u * u * en.y }; }
        var tp = []; for (var j = 0; j <= 14; j++) tp.push(q(e * j / 14));
        var lit = energy(p, tPath);
        ctx.fillStyle = "rgba(" + (134 + 81 * lit | 0) + "," + (105 + 72 * lit | 0) + "," + (68 + 51 * lit | 0) + "," + (0.42 + 0.45 * lit) + ")";
        ribbon(tp, 1.5, 0.5);
        var lg = clamp((g - tw.at - 0.18) / 0.22, 0, 1);
        if (!lg) return;
        tw.leaves.forEach(function (lf) {
          if (lf.sc <= 0) return;
          var at = q(lf.u), b = q(Math.max(0, lf.u - 0.05)), base = Math.atan2(at.y - b.y, at.x - b.x);
          var rustle = 1;
          if (ptr.on) { var dd = Math.hypot(at.x - ptr.x, at.y - ptr.y); if (dd < 150) rustle += (1 - dd / 150) * 3; }
          var ang = base + lf.side * 0.75 + Math.sin(t * 2.3 + lf.ph) * 0.16 * amp * rustle + (rustle > 1 ? Math.sin(t * 9 + lf.ph) * 0.05 * (rustle - 1) : 0);
          // turn over a little in the breeze, much more when the cursor rustles them
          var calm = 1 - 0.3 * amp * (0.5 + 0.5 * Math.sin(t * 1.5 + lf.ph * 1.7)), shake = clamp((rustle - 1) / 2.5, 0, 1);
          var flip = calm * (1 - shake) + Math.cos(t * 7 + lf.ph) * shake;
          lf.x = at.x; lf.y = at.y; lf.a = ang;
          drawLeaf(at.x, at.y, ang, lf.size * easeBack(lg) * Math.min(1, lf.sc), lit, 1, lf.kind, lf.tone, flip);
        });
      });
      if (g < 1) { var tip = pts[pts.length - 1]; glow(tip.x, tip.y, 14, 0.9); }
    }

    /* ---------- the core: a gold gyroscope ----------
       Three fine rings turn in 3D around a glowing nucleus and the logo. The back half of each ring
       passes behind the logo and the front half in front of it. A precision bezel of ticks marks where
       the branches plug in. It glows steadily, tilts toward the cursor, and spins up on hover. */
    var markPath = null;
    (function () { var el = document.querySelector("#o-mark path"); if (el && window.Path2D) markPath = new Path2D(el.getAttribute("d")); })();
    var core = { tx: 0.34, ty: 0, hover: 0, hoverT: 0, touch: 0, ripples: [] };
    var RINGS = [
      { r: 1.0,  inc: 0,     node: 0,   rate: 0,     ph: 0, bs: 0.42,  bp: 0, beads: [0, 3.4] },
      { r: 0.86, inc: 1.08,  node: 0.5, rate: 0.21,  ph: 0, bs: -0.62, bp: 0, beads: [1.3] },
      { r: 0.73, inc: -1.16, node: 2.4, rate: -0.15, ph: 0, bs: 0.8,   bp: 0, beads: [4.2] }
    ];
    function coreR() { return HC.r * 0.8; }
    // a point on a ring, turned into place and projected with a little perspective
    function ringPt(rg, th) {
      var x = Math.cos(th) * rg.r, y = 0, z = Math.sin(th) * rg.r, c, s, nx, ny, nz;
      c = Math.cos(rg.inc); s = Math.sin(rg.inc); ny = y * c - z * s; nz = y * s + z * c; y = ny; z = nz;
      var om = rg.node + rg.ph; c = Math.cos(om); s = Math.sin(om); nx = x * c + z * s; nz = -x * s + z * c; x = nx; z = nz;
      c = Math.cos(core.tx); s = Math.sin(core.tx); ny = y * c - z * s; nz = y * s + z * c; y = ny; z = nz;
      c = Math.cos(core.ty); s = Math.sin(core.ty); nx = x * c + z * s; nz = -x * s + z * c; x = nx; z = nz;
      var R = coreR(), k = 4 / (4 - z);
      return { x: HC.x + x * k * R, y: HC.y - y * k * R, z: z };
    }
    var N_SEG = 120;
    function drawRings(front, vis) {
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      RINGS.forEach(function (rg, j) {
        var f = clamp(vis * 1.5 - j * 0.25, 0, 1);
        if (!f) return;
        var pts = [], n = Math.ceil(N_SEG * f);
        for (var i = 0; i <= n; i++) pts.push(ringPt(rg, -1.2 + j + (i / N_SEG) * 6.2832));
        // stroke unbroken runs of similar depth, so the ring reads as one smooth line (no beading at the joins)
        var i0 = 0;
        function run(i1, band) {
          if (i1 <= i0) return;
          var d = band / 10, al = (0.16 + 0.72 * d) * (0.85 + 0.15 * core.hover);
          ctx.beginPath(); ctx.moveTo(pts[i0].x, pts[i0].y);
          for (var k = i0 + 1; k <= i1; k++) ctx.lineTo(pts[k].x, pts[k].y);
          ctx.strokeStyle = "rgba(169,124,67," + (al * 0.16) + ")"; ctx.lineWidth = 4.5; ctx.stroke();
          ctx.strokeStyle = "rgba(237,199,136," + al + ")"; ctx.lineWidth = 0.7 + 1.4 * d; ctx.stroke();
        }
        var band = -1, side = null;
        for (i = 0; i < n; i++) {
          var zm = (pts[i].z + pts[i + 1].z) / 2, sd = zm >= 0, bd = Math.round((zm + 1) * 5);
          if (bd !== band || sd !== side) { if (side === front) run(i, band); i0 = i; band = bd; side = sd; }
        }
        if (side === front) run(n, band);
        if (f < 1) { var h = pts[n]; if ((h.z >= 0) === front) glow(h.x, h.y, 16, 0.9); return; }
        // satellites riding the ring, each with a short fading trail
        ctx.lineCap = "round";
        rg.beads.forEach(function (b0) {
          var th = b0 + rg.bp, hd = ringPt(rg, th);
          if ((hd.z >= 0) !== front) return;
          var d = (hd.z + 1) / 2, dir = rg.bs >= 0 ? -1 : 1, prev = hd;
          for (var k = 1; k <= 12; k++) {
            var q = ringPt(rg, th + dir * k * 0.045);
            ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = "rgba(248,229,195," + ((1 - k / 12) * (0.35 + 0.6 * d)) + ")"; ctx.lineWidth = 1.2 + 1.2 * d * (1 - k / 12); ctx.stroke();
            prev = q;
          }
          glow(hd.x, hd.y, 9 + 9 * d, 0.45 + 0.5 * d);
          ctx.fillStyle = "rgba(253,248,238," + (0.6 + 0.4 * d) + ")"; ctx.beginPath(); ctx.arc(hd.x, hd.y, 0.9 + 0.9 * d, 0, 6.283); ctx.fill();
        });
      });
    }
    function drawNucleus(t, vis) {
      var R = coreR(), br = vis + core.hover * 0.12 + core.touch * 0.1;
      // the wide halo is a CSS layer under the canvas (cheap to fade); only the hot center is drawn here
      var gl = clamp(br, 0, 1.6).toFixed(3);
      if (gl !== core.gl) { core.gl = gl; hub.style.setProperty("--core-glow", gl); }
      ctx.globalCompositeOperation = "lighter";
      glow(HC.x, HC.y, R * 0.75, 0.32 * br);
      ctx.globalCompositeOperation = "source-over";
      var img = logoImage(R * 0.95);
      if (!img || vis <= 0) return;
      // the logo in gold, turned a touch toward the cursor
      var sz = R * 0.95 * (0.9 + 0.1 * ease(vis)), sx = Math.cos(core.ty * 0.9), sy = Math.cos((core.tx - 0.34) * 0.9), pad = img.pad * sz;
      ctx.globalAlpha = clamp(vis * 1.4, 0, 1);
      ctx.drawImage(img, HC.x - (sz / 2 + pad) * sx, HC.y - (sz / 2 + pad) * sy, (sz + pad * 2) * sx, (sz + pad * 2) * sy);
      ctx.globalAlpha = 1;
    }
    var logoCache = null;
    function logoImage(size) {
      if (!markPath) return null;
      var px = Math.round(size * Math.min(3, Math.max(2, window.devicePixelRatio || 1)));
      if (logoCache && logoCache.px === px) return logoCache;
      var pad = 0.35, c = document.createElement("canvas"), g = c.getContext("2d"), k = px / 137.8;
      c.width = c.height = Math.round(px * (1 + pad * 2));
      g.translate(c.width / 2, c.height / 2); g.scale(k, k); g.translate(-100.8, -95.4);
      var gr = g.createLinearGradient(40, 28, 150, 164);
      gr.addColorStop(0, "#FCF3DF"); gr.addColorStop(0.42, "#D3A665"); gr.addColorStop(1, "#694F33");
      g.fillStyle = gr;
      g.shadowColor = "rgba(12,7,3,0.85)"; g.shadowBlur = px * 0.06; g.shadowOffsetY = px * 0.012; g.fill(markPath);
      g.shadowColor = "rgba(224,162,86,0.6)"; g.shadowBlur = px * 0.16; g.shadowOffsetY = 0; g.fill(markPath);
      c.px = px; c.pad = pad; logoCache = c;
      return c;
    }
    // the bezel: a hairline circle of fine ticks with a slow sweep of light, and a glowing port for every branch
    function drawBezel(t, vis) {
      var Rb = HC.r, sweep = t * 0.55, n = 120;
      ctx.lineCap = "butt";
      ctx.strokeStyle = "rgba(183,137,74," + 0.14 * vis + ")"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(HC.x, HC.y, Rb, -1.5708, -1.5708 + 6.2832 * vis); ctx.stroke();
      var LV = 8, bins = [];
      for (var b = 0; b < LV; b++) bins.push([]);
      for (var i = 0; i < n * vis; i++) {
        var a = -1.5708 + i / n * 6.2832, da = Math.atan2(Math.sin(a - sweep), Math.cos(a - sweep));
        var lit = Math.exp(-da * da / 0.12) + Math.exp(-Math.pow(Math.atan2(Math.sin(a - sweep - 3.1416), Math.cos(a - sweep - 3.1416)), 2) / 0.12) * 0.5;
        var al = (i % 10 === 0 ? 0.3 : 0.14) + 0.6 * lit;
        paths.forEach(function (p) {   // the ticks beside a port light up briefly when light arrives there
          if (!p.port) return;
          var dp = Math.atan2(Math.sin(a - p.portA), Math.cos(a - p.portA));
          al += 0.45 * p.port * Math.exp(-dp * dp / 0.05);
        });
        bins[Math.min(LV - 1, Math.round(al * (LV - 1)))].push(i);
      }
      bins.forEach(function (list, b) {
        if (!list.length) return;
        ctx.strokeStyle = "rgba(209,164,100," + (b / (LV - 1)) * vis + ")";
        ctx.beginPath();
        list.forEach(function (i) {
          var a = -1.5708 + i / n * 6.2832, c = Math.cos(a), s = Math.sin(a), L = i % 10 === 0 ? 7 : 3.5;
          ctx.moveTo(HC.x + c * (Rb - 3), HC.y + s * (Rb - 3)); ctx.lineTo(HC.x + c * (Rb - 3 - L), HC.y + s * (Rb - 3 - L));
        });
        ctx.stroke();
      });
      if (vis < 1) return;
      ctx.globalCompositeOperation = "lighter";
      paths.forEach(function (p) {
        if (p.toLimb) return;
        glow(p.hubPt.x, p.hubPt.y, 10 + 5 * (p.port || 0), 0.4 + 0.3 * (p.port || 0));
      });
      core.ripples.forEach(function (r) {   // one faint ring slipping outward from the bezel
        var k = r.age / 1.4;
        ctx.strokeStyle = "rgba(237,199,136," + 0.16 * (1 - k) * (1 - k) + ")"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(HC.x, HC.y, Rb * (1 + ease(k) * 0.3), 0, 6.2832); ctx.stroke();
      });
      ctx.globalCompositeOperation = "source-over";
    }
    function stepCore(t, dt) {
      var bx = 0.34 + Math.sin(t * 0.31) * 0.05, by = Math.sin(t * 0.23) * 0.16;
      if (ptr.on) { bx = 0.34 + clamp((ptr.y - HC.y) / H, -0.6, 0.6) * 0.55; by = clamp((ptr.x - HC.x) / W, -0.6, 0.6) * 1.0; }
      var f = Math.min(1, dt * 2.6);
      core.tx += (bx - core.tx) * f; core.ty += (by - core.ty) * f;
      core.hover += (core.hoverT - core.hover) * Math.min(1, dt * 5);
      core.touch = Math.max(0, core.touch - dt * 0.9);
      paths.forEach(function (p) { if (p.port) p.port = Math.max(0, p.port - dt * 0.8); });
      for (var i = core.ripples.length - 1; i >= 0; i--) { core.ripples[i].age += dt; if (core.ripples[i].age > 1.4) core.ripples.splice(i, 1); }
      var boost = 1 + core.hover * 1.6 + core.touch * 0.9;
      RINGS.forEach(function (rg) { rg.ph += rg.rate * dt * boost; rg.bp += rg.bs * dt * boost; });
    }
    // light reaching the core: its port and the nearby ticks brighten, the rings quicken a little,
    // and one faint ring slips outward. Everything eases off within about a second.
    function touchCore(p) {
      p.port = 1; p.portA = Math.atan2(p.hubPt.y - HC.y, p.hubPt.x - HC.x);
      core.touch = 1;
      if (core.ripples.length < 2) core.ripples.push({ age: 0 });
    }
    function drawCore(t, vis) {
      drawRings(false, vis);
      drawNucleus(t, clamp((vis - 0.35) / 0.65, 0, 1));
      drawRings(true, vis);
      drawBezel(t, vis);
    }


    /* ---------- light pulses ---------- */
    function lit(node) { node.classList.add("is-lit"); setTimeout(function () { node.classList.remove("is-lit"); }, 900); }
    function spawnIn(p) {
      var ins = paths.filter(function (x) { return x.kind === "in" && x.node; });
      p = p || ins[Math.floor(Math.random() * ins.length)];
      if (!p) return;
      pulses.push({ p: p, t: 0, wait: 0 }); lit(p.node);
    }
    function spawnOut(p, wait) {
      var outs = paths.filter(function (x) { return x.kind === "out"; });
      p = p || outs[Math.floor(Math.random() * outs.length)];
      if (p) pulses.push({ p: p, t: 0, wait: wait || 0 });
    }
    function burst(x, y) {
      for (var i = 0; i < 9; i++) { var a = Math.random() * 6.283, v = 18 + Math.random() * 38; sparks.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, age: 0, life: 0.5 + Math.random() * 0.5 }); }
    }
    function drawPulse(q) {
      // a comet: one smooth tapered streak that fades toward its tail, with a soft glow at the head
      // the tail is measured in pixels and can reach back past a fork onto the branch the light came from,
      // so the streak runs through the fork as one piece
      var p = q.p, N = 22, SPAN = 110, sh = Math.min(q.t, 1) * p.len, st = q.t * p.len - SPAN, pts = [];
      if (!q.prev) st = Math.max(0, st);
      function at(sx) { return sx >= 0 || !q.prev ? bez(p, clamp(sx / p.len, 0, 1)) : bez(q.prev, clamp(1 + sx / q.prev.len, 0, 1)); }
      if (sh > st + 0.05) {
        for (var k = 0; k <= N; k++) pts.push(at(st + (sh - st) * k / N));
        var a = pts[0], b = pts[N], fade = clamp((q.t * p.len - p.len) / SPAN, 0, 1);
        var g = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        g.addColorStop(0, "rgba(239,204,145,0)"); g.addColorStop(0.6, "rgba(237,199,136," + 0.35 * (1 - fade) + ")"); g.addColorStop(1, "rgba(249,233,203," + 0.95 * (1 - fade) + ")");
        ctx.fillStyle = g; ribbon(pts, 0.2, 2.6);
      }
      if (q.t <= 1) { var h = bez(p, q.t); glow(h.x, h.y, 20, 0.95); ctx.fillStyle = "rgba(253,248,238,0.95)"; ctx.beginPath(); ctx.arc(h.x, h.y, 1.4, 0, 6.283); ctx.fill(); }
    }

    /* ---------- falling leaves ---------- */
    function dropLeaf() {
      var pool = [];
      paths.forEach(function (p) { p.twigs.forEach(function (tw) { tw.leaves.forEach(function (lf) { if (lf.sc >= 1 && lf.x != null) pool.push(lf); }); }); });
      var lf = pool[Math.floor(Math.random() * pool.length)];
      if (!lf) return;
      falling.push({ x: lf.x, y: lf.y, a: lf.a, len: lf.size, kind: lf.kind, tone: lf.tone, vx: (Math.random() - 0.5) * 8, vy: 4, spin: (Math.random() - 0.5) * 2.2, age: 0, life: 6 + Math.random() * 3, ph: Math.random() * 6.283, tumble: 2.2 + Math.random() * 1.6 });
      lf.sc = -1.2;   // it grows back after a little while
    }

    /* ---------- frame ---------- */
    var last = 0;
    function frame(ts) {
      requestAnimationFrame(frame);
      if (!visible || document.hidden || !W) { last = ts; return; }
      var dt = Math.min(0.05, (ts - (last || ts)) / 1000); last = ts; clock += dt;
      ctx.clearRect(0, 0, W, H);
      var t = clock, amp = liveAt < 0 ? 0 : ease(clamp((t - liveAt) / 1.8, 0, 1)), w = wind(t);

      // motes, behind everything
      ctx.globalCompositeOperation = "lighter";
      motes.forEach(function (m) {
        m.x += (m.vx + w * 5) * dt; m.y += m.vy * dt;
        if (m.y < -12) { m.y = H + 12; m.x = Math.random() * W; }
        if (m.x < -12) m.x = W + 12; else if (m.x > W + 12) m.x = -12;
        var fall = 1 - Math.min(1, Math.abs(m.x - W / 2) / (W * 0.62)) * 0.55;
        var a = (0.05 + 0.16 * m.r / 1.7) * (0.55 + 0.45 * Math.sin(t * m.tw + m.ph)) * fall * (grown ? 1 : 0.4);
        if (m.r > 1.05) glow(m.x, m.y, m.r * 7, a * 1.4);
        else { ctx.fillStyle = "rgba(217,183,132," + a + ")"; ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, 6.283); ctx.fill(); }
      });
      ctx.globalCompositeOperation = "source-over";
      stepCore(t, dt);

      if (!grown) {
        if (growStart < 0) { if (!seen) return; growStart = ts + 150; }
        var el = ts - growStart, done = true, cv = clamp(el / 1300, 0, 1);
        // the core assembles first: rings draw themselves in, then the nucleus lights
        paths.forEach(function (p) {
          geom(p);
          // one continuous growth front moving out from the core: a leaf's branch picks up exactly where its limb ends
          var gx = clamp((el - 1000) / 2200, 0, 1), reach = (gx < 0.5 ? 4 * gx * gx * gx : 1 - Math.pow(-2 * gx + 2, 3) / 2) * maxReach;
          var start = p.toLimb ? p.toLimb.len : 0, g = gx >= 1 ? 1 : clamp((reach - start) / p.len, 0, 1);
          if (g > 0) drawBranch(p, g, t, 0);
          if (g >= 1 && p.node && !p.node.classList.contains("is-born")) {
            p.node.classList.add("is-born"); lit(p.node);
            labels.forEach(function (l) { if (l.parentElement === p.node.parentElement) l.classList.add("is-born"); });
          }
          if (g < 1) done = false;
        });
        drawCore(t, ease(cv));
        if (done && cv >= 1) { bornAll(); spawnIn(); }
        return;
      }

      // breeze, branches, leaves
      paths.forEach(function (p) {
        if (p.node) sway(p, t, dt, amp); geom(p);
        p.twigs.forEach(function (tw) { tw.leaves.forEach(function (lf) { if (lf.sc < 1) lf.sc = Math.min(1, lf.sc + dt / 1.6); }); });
        drawBranch(p, 1, t, amp);
      });
      drawCore(t, 1);

      // falling leaves
      nextFall -= dt;
      if (nextFall <= 0) { dropLeaf(); nextFall = 2.6 + Math.random() * 3.2; }
      for (var f = falling.length - 1; f >= 0; f--) {
        var L = falling[f]; L.age += dt;
        L.vy = Math.min(L.vy + 10 * dt, 19);
        L.x += (L.vx + Math.sin(L.age * 2.1 + L.ph) * 15 + w * 10) * dt; L.y += L.vy * dt;
        L.a += (L.spin + Math.cos(L.age * 2.1 + L.ph) * 0.9) * dt;
        var al = Math.min(1, L.age * 3) * (1 - clamp((L.age - (L.life - 1.6)) / 1.6, 0, 1));
        drawLeaf(L.x, L.y, L.a, L.len, 0.08, al, L.kind, L.tone, Math.cos(L.age * L.tumble + L.ph));
        if (L.age > L.life || L.y > H + 20) falling.splice(f, 1);
      }

      // light: new pulse about once a second
      spawnClock -= dt;
      if (spawnClock <= 0) { spawnIn(); spawnClock = 0.9 + Math.random() * 0.5; }
      ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
      for (var i = pulses.length - 1; i >= 0; i--) {
        var q = pulses[i];
        if (q.wait > 0) { q.wait -= dt; continue; }
        q.t += SPEED / q.p.len * dt;
        drawPulse(q);
        if (q.t >= 1 && !q.done) {
          q.done = true;
          if (q.p.toLimb) { pulses.push({ p: q.p.toLimb, t: (q.t - 1) * q.p.len / q.p.toLimb.len, wait: 0, prev: q.p }); pulses.splice(i, 1); continue; }   // carry on down the limb, same streak
          else if (q.p.kind === "in") { touchCore(q.p); spawnOut(null, 0.18); }
          else { lit(q.p.node); var e = q.p.p3; burst(e.x, e.y); }
        }
        if (q.t > 1 + 115 / q.p.len) pulses.splice(i, 1);
      }
      for (i = sparks.length - 1; i >= 0; i--) {
        var s = sparks[i]; s.age += dt; if (s.age > s.life) { sparks.splice(i, 1); continue; }
        s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= 0.95; s.vy *= 0.95;
        glow(s.x, s.y, 5, (1 - s.age / s.life) * 0.7);
      }
      ctx.globalCompositeOperation = "source-over";
    }

    function bornAll() {
      grown = true; liveAt = clock;
      flow.classList.remove("is-seed"); flow.classList.add("is-grown");
      paths.forEach(function (p) { if (p.node) p.node.classList.add("is-born"); });
      labels.forEach(function (l) { l.classList.add("is-born"); });
      setTimeout(function () { flow.classList.add("is-live"); }, 520);   // after the pop-in, leaves follow the breeze without easing
    }
    function drawStatic() {
      ctx.clearRect(0, 0, W, H);
      paths.forEach(function (p) { geom(p); drawBranch(p, 1, 0, 0); });
      drawCore(0, 1);
    }

    /* ---------- pointer: leaves lean away, hovering a leaf sends light ---------- */
    flow.addEventListener("pointermove", function (e) { var b = flow.getBoundingClientRect(); ptr.x = e.clientX - b.left; ptr.y = e.clientY - b.top; ptr.on = e.pointerType === "mouse"; });
    flow.addEventListener("pointerleave", function () { ptr.on = false; });
    function hoverSend(p) {
      if (!grown || reduceMotion) return;
      var now = performance.now(); if (now - p.last < 700) return; p.last = now;
      if (p.kind === "in") spawnIn(p); else spawnOut(p);
    }
    inputs.concat(outputs).forEach(function (node) {
      node.addEventListener("mouseenter", function () { var p = paths.filter(function (x) { return x.node === node; })[0]; if (p) hoverSend(p); });
    });

    // the core: spins up under the cursor; a click sends light out to both results
    hub.addEventListener("mouseenter", function () { core.hoverT = 1; });
    hub.addEventListener("mouseleave", function () { core.hoverT = 0; });
    hub.addEventListener("click", function () {
      if (!grown || reduceMotion) return;
      core.touch = 1; if (core.ripples.length < 2) core.ripples.push({ age: 0 });
      paths.forEach(function (p) { if (p.kind === "out") spawnOut(p); });
    });

    function start() {
      if (!build()) return false;
      flow.classList.add("has-core");
      if (reduceMotion) { bornAll(); drawStatic(); return true; }
      flow.classList.add("is-growing");
      requestAnimationFrame(frame);
      return true;
    }
    var rt, started = false;
    function onResize() {
      clearTimeout(rt);
      rt = setTimeout(function () {
        if (!started) { go(); return; }
        if (build() && reduceMotion) drawStatic();
      }, 80);
    }
    if ("ResizeObserver" in window) new ResizeObserver(onResize).observe(flow); else window.addEventListener("resize", onResize);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
        if (es[0].intersectionRatio >= 0.3) seen = true;   // start growing once a third of it is on screen
      }, { threshold: [0, 0.3] }).observe(flow);
    } else seen = true;
    var ready = false;
    function go() { if (ready && !started) started = start(); }
    function arm() { ready = true; go(); }
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(arm); setTimeout(arm, 1200); } else arm();
  })();
})();
