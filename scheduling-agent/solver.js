/* =====================================================================
   Scheduling Agent: scheduling engine (v1)

   How it works
   1. Every shift on every day becomes a "slot" with a number of positions.
   2. Locked people (manual picks, set schedules) are placed first and never moved.
   3. A greedy pass fills the hardest positions first.
   4. A local search then keeps trying small changes (reassign one person,
      or swap two people) and keeps the ones that make the schedule better.

   Scoring: lower is better. Rules come in tiers so a soft preference can
   never outweigh a hard rule:
     hard (1e5+)   double-booking, missing a required role, never-together pairs,
                   going over someone's max hours (per hour)
     unfilled      1e4 per empty position
     soft (<1e3)   preferences, work-well-together, fair hours, rest,
                   reaching minimum hours
   ===================================================================== */
(function (root) {
  "use strict";

  var OVERLAP = 1e6, ROLE = 1e5, NEVER = 1e5, DOUBLE = 1e5, OVERMAX = 2e4, UNFILLED = 1e4;
  var REST_MIN = 10 * 60; // minutes between the end of one shift and the start of the next

  function rng(seed) {
    var s = (seed >>> 0) || 0x9e3779b9;
    return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }
  function num(v, d) { return v == null || isNaN(v) ? d : +v; }

  /* ---------- turn a problem into fast lookup tables ---------- */
  function build(P) {
    var people = P.people || [], slots = P.slots || [];
    var NP = people.length, idx = {};
    people.forEach(function (p, i) { idx[p.id] = i; });
    var f = P.features || {}, w = P.weights || {};
    var W = {
      pref: f.preferences ? 30 * num(w.preferences, 3) : 0,
      pair: f.preferPairs ? 30 * num(w.pairs, 3) : 0,
      fair: f.fairness ? 3 * num(w.fairness, 3) : 0,
      rest: f.rest ? 120 * num(w.rest, 3) : 0,
      minh: 60 * num(w.minHours, 3)
    };

    var hasRole = people.map(function (p) { var o = {}; (p.roles || []).forEach(function (r) { o[r] = true; }); return o; });
    var pref = people.map(function (p) { return p.prefs || {}; });
    function matrix(list) {
      var m = []; for (var i = 0; i < NP; i++) m.push(new Uint8Array(NP));
      (list || []).forEach(function (pr) {
        var a = idx[pr[0]], b = idx[pr[1]];
        if (a == null || b == null || a === b) return;
        m[a][b] = 1; m[b][a] = 1;
      });
      return m;
    }
    var never = matrix(f.avoidPairs === false ? [] : P.never);
    var prefer = matrix(P.prefer);

    var pos = [], S = [];
    slots.forEach(function (s, si) {
      var locked = (s.locked || []).map(function (id) { return idx[id]; }).filter(function (i) { return i != null; });
      // never lose a locked person, even if it overstaffs the shift
      var count = Math.max(num(s.count, 0), locked.length);
      var elig = new Uint8Array(NP), eligList = [];
      (s.eligible || []).forEach(function (id) { var i = idx[id]; if (i != null && !elig[i]) { elig[i] = 1; eligList.push(i); } });
      var row = { key: s.key, day: s.day, start: s.start, end: s.end, hours: num(s.hours, (s.end - s.start) / 60),
        count: count, plannedCount: num(s.count, 0), needs: f.roles ? (s.needs || []) : [], shiftId: s.shiftId,
        elig: elig, eligList: eligList, pos: [], locked: locked };
      for (var k = 0; k < count; k++) {
        row.pos.push(pos.length);
        pos.push({ s: si, locked: k < locked.length, init: k < locked.length ? locked[k] : -1 });
      }
      S.push(row);
    });

    // fair share of the week's hours, by each person's hour range
    var demand = 0; S.forEach(function (s) { demand += s.plannedCount * s.hours; });
    var mids = people.map(function (p) { return p.fixed ? 0 : (num(p.min, 0) + Math.min(num(p.max, 40), 60)) / 2; });
    var midSum = mids.reduce(function (a, b) { return a + b; }, 0) || 1;
    var share = people.map(function (p, i) {
      var v = demand * mids[i] / midSum;
      return Math.max(num(p.min, 0), Math.min(num(p.max, 168), v));
    });

    return { P: P, people: people, NP: NP, idx: idx, S: S, pos: pos, W: W, hasRole: hasRole, pref: pref,
      never: never, prefer: prefer, share: share, allowDoubles: !!P.allowDoubles, roles: !!f.roles };
  }

  /* ---------- the score (and, on request, the list of issues) ---------- */
  function makeScorer(C) {
    var NP = C.NP, hours = new Float64Array(NP), lists = [];
    for (var i = 0; i < NP; i++) lists.push([]);
    function byStart(a, b) { return C.S[a].start - C.S[b].start; }

    return function score(A, issues) {
      var total = 0, i, j, k;
      for (i = 0; i < NP; i++) { hours[i] = 0; lists[i].length = 0; }

      for (var si = 0; si < C.S.length; si++) {
        var s = C.S[si], members = [];
        for (k = 0; k < s.pos.length; k++) {
          var p = A[s.pos[k]];
          if (p < 0) continue;
          if (members.indexOf(p) >= 0) { total += OVERLAP; continue; }
          members.push(p); hours[p] += s.hours; lists[p].push(si);
        }
        var missing = s.plannedCount - members.length;
        if (missing > 0) { total += missing * UNFILLED; if (issues) issues.push({ type: "unfilled", key: s.key, missing: missing, available: s.eligList.length }); }
        if (C.roles) {
          for (k = 0; k < s.needs.length; k++) {
            var need = s.needs[k], have = 0;
            for (j = 0; j < members.length; j++) if (C.hasRole[members[j]][need.role]) have++;
            if (have < need.count) { total += (need.count - have) * ROLE; if (issues) issues.push({ type: "role", key: s.key, role: need.role, missing: need.count - have }); }
          }
        }
        for (i = 0; i < members.length; i++) {
          var m = members[i];
          if (C.W.pref) { var pv = C.pref[m][s.shiftId]; if (pv) total -= pv * C.W.pref; }
          if (issues && !s.elig[m] && !C.people[m].fixed) issues.push({ type: "unavailable", key: s.key, pid: C.people[m].id });
          for (j = i + 1; j < members.length; j++) {
            var n = members[j];
            if (C.never[m][n]) { total += NEVER; if (issues) issues.push({ type: "never", key: s.key, a: C.people[m].id, b: C.people[n].id }); }
            if (C.W.pair && C.prefer[m][n]) total -= C.W.pair;
          }
        }
      }

      for (i = 0; i < NP; i++) {
        var pp = C.people[i], h = hours[i], mx = num(pp.max, 168), mn = num(pp.min, 0);
        if (h > mx + 1e-9) { total += (h - mx) * OVERMAX; if (issues) issues.push({ type: "over", pid: pp.id, hours: h, max: mx }); }
        if (h < mn - 1e-9) { total += (mn - h) * C.W.minh; if (issues) issues.push({ type: "under", pid: pp.id, hours: h, min: mn }); }
        if (C.W.fair && !pp.fixed) { var d = h - C.share[i]; total += C.W.fair * d * d; }
        var L = lists[i];
        if (L.length > 1) {
          L.sort(byStart);
          for (k = 1; k < L.length; k++) {
            var a = C.S[L[k - 1]], b = C.S[L[k]];
            if (b.start < a.end) { total += OVERLAP; if (issues) issues.push({ type: "overlap", pid: pp.id, a: a.key, b: b.key }); }
            else if (a.day === b.day && !C.allowDoubles) { total += DOUBLE; if (issues) issues.push({ type: "double", pid: pp.id, a: a.key, b: b.key }); }
            else if (C.W.rest && b.start - a.end < REST_MIN) { total += C.W.rest; if (issues) issues.push({ type: "rest", pid: pp.id, a: a.key, b: b.key }); }
          }
        }
      }
      return total;
    };
  }

  function toAssign(C, A) {
    var out = {};
    C.S.forEach(function (s) {
      var ids = [];
      s.pos.forEach(function (k) { if (A[k] >= 0) ids.push(C.people[A[k]].id); });
      out[s.key] = ids;
    });
    return out;
  }

  function fromAssign(C, assign) {
    var A = C.pos.map(function (p) { return p.init; });
    C.S.forEach(function (s) {
      var ids = (assign && assign[s.key]) || [];
      var free = s.pos.filter(function (k) { return !C.pos[k].locked; });
      var already = s.locked.slice();
      ids.forEach(function (id) {
        var i = C.idx[id];
        if (i == null || already.indexOf(i) >= 0) return;
        if (!free.length) { // more people than positions: grow the slot
          var k = C.pos.length; C.pos.push({ s: C.S.indexOf(s), locked: false, init: -1 }); s.pos.push(k); s.count++; A.push(-1); free.push(k);
        }
        A[free.shift()] = i; already.push(i);
      });
    });
    return A;
  }

  /* ---------- solve ---------- */
  function solve(P, opts) {
    opts = opts || {};
    var C = build(P), score = makeScorer(C), rand = rng(opts.seed || Date.now());
    var A = C.pos.map(function (p) { return p.init; });
    var free = [];
    C.pos.forEach(function (p, k) { if (!p.locked) free.push(k); });

    function inSlot(si, person, except) {
      var s = C.S[si];
      for (var q = 0; q < s.pos.length; q++) if (s.pos[q] !== except && A[s.pos[q]] === person) return true;
      return false;
    }

    // greedy: positions with the fewest options (and role needs) first
    var order = free.slice().sort(function (a, b) {
      var sa = C.S[C.pos[a].s], sb = C.S[C.pos[b].s];
      return (sa.eligList.length - sb.eligList.length) || (sb.needs.length - sa.needs.length) || (sa.start - sb.start);
    });
    var cur = score(A);
    order.forEach(function (k) {
      var si = C.pos[k].s, best = -1, bestScore = cur;
      C.S[si].eligList.forEach(function (p) {
        if (inSlot(si, p, k)) return;
        A[k] = p; var sc = score(A);
        if (sc < bestScore) { bestScore = sc; best = p; }
      });
      A[k] = best; cur = bestScore;
    });

    // local search (simulated annealing)
    var bestA = A.slice(), best = cur;
    if (free.length) {
      var t0 = (typeof performance !== "undefined" ? performance : Date).now();
      var budget = opts.budgetMs == null ? 700 : opts.budgetMs, maxIter = opts.maxIter || 400000;
      var T0 = 600, it = 0, T = T0, progress = 0;
      while (it < maxIter) {
        if ((it & 255) === 0) {
          progress = (((typeof performance !== "undefined" ? performance : Date).now()) - t0) / budget;
          if (progress >= 1) break;
          T = T0 * Math.pow(0.003, progress);
        }
        it++;
        var k1 = free[(rand() * free.length) | 0], s1 = C.pos[k1].s, old1 = A[k1], ns;
        if (rand() < 0.55) {
          var el = C.S[s1].eligList, np = rand() < 0.08 || !el.length ? -1 : el[(rand() * el.length) | 0];
          if (np === old1 || (np >= 0 && inSlot(s1, np, k1))) continue;
          A[k1] = np; ns = score(A);
          if (ns <= cur || rand() < Math.exp((cur - ns) / T)) { cur = ns; if (cur < best) { best = cur; bestA = A.slice(); } }
          else A[k1] = old1;
        } else {
          var k2 = free[(rand() * free.length) | 0], s2 = C.pos[k2].s, old2 = A[k2];
          if (s1 === s2 || old1 === old2) continue;
          if (old2 >= 0 && (!C.S[s1].elig[old2] || inSlot(s1, old2, k1))) continue;
          if (old1 >= 0 && (!C.S[s2].elig[old1] || inSlot(s2, old1, k2))) continue;
          A[k1] = old2; A[k2] = old1; ns = score(A);
          if (ns <= cur || rand() < Math.exp((cur - ns) / T)) { cur = ns; if (cur < best) { best = cur; bestA = A.slice(); } }
          else { A[k1] = old1; A[k2] = old2; }
        }
      }
    }
    var issues = []; score(bestA, issues);
    return { assign: toAssign(C, bestA), score: best, issues: issues };
  }

  /* ---------- warnings for any schedule, including hand edits ---------- */
  function analyze(P, assign) {
    var C = build(P), score = makeScorer(C), A = fromAssign(C, assign), issues = [];
    var total = score(A, issues), hours = {};
    C.people.forEach(function (p) { hours[p.id] = 0; });
    C.S.forEach(function (s) { s.pos.forEach(function (k) { if (A[k] >= 0) hours[C.people[A[k]].id] += s.hours; }); });
    return { score: total, issues: issues, hours: hours };
  }

  /* ---------- who could fill an open spot, best first, with reasons ---------- */
  function rank(P, assign, key) {
    var C = build(P), score = makeScorer(C), A = fromAssign(C, assign);
    var si = -1; C.S.forEach(function (s, i) { if (s.key === key) si = i; });
    if (si < 0) return [];
    var s = C.S[si];
    var k = -1;
    s.pos.forEach(function (q) { if (k < 0 && A[q] < 0) k = q; });
    if (k < 0) { k = C.pos.length; C.pos.push({ s: si, locked: false, init: -1 }); s.pos.push(k); s.count++; A.push(-1); }
    var base = score(A), members = s.pos.map(function (q) { return A[q]; }).filter(function (p) { return p >= 0; });

    var hours = new Float64Array(C.NP), byPerson = [];
    for (var i = 0; i < C.NP; i++) byPerson.push([]);
    C.S.forEach(function (t, ti) { t.pos.forEach(function (q) { if (A[q] >= 0) { hours[A[q]] += t.hours; byPerson[A[q]].push(ti); } }); });

    var out = [];
    C.people.forEach(function (p, i) {
      if (members.indexOf(i) >= 0) return;
      A[k] = i; var d = score(A) - base; A[k] = -1;
      var reasons = [], ok = !!s.elig[i] && !p.fixed, h = hours[i], after = h + s.hours, mx = num(p.max, 168), mn = num(p.min, 0);
      if (p.fixed) reasons.push({ t: "On a set schedule", good: false });
      else if (!s.elig[i]) reasons.push({ t: "Not available", good: false });
      else reasons.push({ t: "Available", good: true });
      var clash = false;
      byPerson[i].forEach(function (ti) {
        var t = C.S[ti];
        if (t.start < s.end && s.start < t.end) { clash = true; reasons.push({ t: "Already working then", good: false }); }
        else if (t.day === s.day && !C.allowDoubles) { clash = true; reasons.push({ t: "Already working that day", good: false }); }
        else if (C.W.rest && ((t.end <= s.start && s.start - t.end < REST_MIN) || (s.end <= t.start && t.start - s.end < REST_MIN))) reasons.push({ t: "Short rest between shifts", good: false });
      });
      if (clash) ok = false;
      if (after > mx + 1e-9) { reasons.push({ t: "Would go over max (" + fmtH(after) + " / " + fmtH(mx) + ")", good: false, over: true }); }
      else if (h < mn) reasons.push({ t: "Needs hours (" + fmtH(h) + " of " + fmtH(mn) + " min)", good: true });
      else reasons.push({ t: fmtH(h) + " this week", good: null });
      if (C.W.pref) { var pv = C.pref[i][s.shiftId]; if (pv > 0) reasons.push({ t: "Prefers this shift", good: true }); if (pv < 0) reasons.push({ t: "Prefers to avoid this shift", good: false }); }
      members.forEach(function (m) {
        if (C.never[i][m]) { ok = false; reasons.push({ t: "Can't work with " + C.people[m].name, good: false }); }
        if (C.W.pair && C.prefer[i][m]) reasons.push({ t: "Works well with " + C.people[m].name, good: true });
      });
      out.push({ pid: p.id, ok: ok, over: after > mx + 1e-9, delta: d, hours: h, reasons: reasons });
    });
    out.sort(function (a, b) { return (b.ok - a.ok) || (a.delta - b.delta) || (a.hours - b.hours); });
    return out;
  }

  function fmtH(h) { return (Math.round(h * 10) / 10) + "h"; }

  root.SAEngine = { solve: solve, analyze: analyze, rank: rank, _build: build, _scorer: makeScorer };
})(typeof window !== "undefined" ? window : globalThis);
