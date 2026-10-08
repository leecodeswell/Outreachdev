/* =====================================================================
   Scheduling Agent demo: scheduling solver and interface
   ===================================================================== */
(function () {
  "use strict";

  /* SOLVER:START — pure logic, no page access (tested separately) */
  
  function pairKey(a, b) { return a < b ? a + "|" + b : b + "|" + a; }
  
  function combinations(arr, k) {
    const out = [];
    (function rec(start, acc) {
      if (acc.length === k) { out.push(acc.slice()); return; }
      for (let i = start; i < arr.length; i++) { acc.push(arr[i]); rec(i + 1, acc); acc.pop(); }
    })(0, []);
    return out;
  }
  
  /*
    cfg = {
      staff:   ["Ava", ...],
      shifts:  number of shifts,
      perShift: people wanted on each shift,
      prefs:   { Ava: [2,1,null,...] }   2 strongly prefer ... -2 strongly avoid, null = unavailable
      rules:   { "Ava|Ben": "like" | "avoid" | "never" },
      weights: { pref, tog, avoid, fair }  each 0..10,
      locks:   Set of "Name|shiftIndex"   (must be on that shift),
      callouts:Set of "Name|shiftIndex"   (cannot be on that shift),
    }
    Finds the highest-scoring schedule using dynamic programming over shifts.
    Hard rules (unavailable, "never", locks, call-outs) are never broken.
  */
  function solveSchedule(cfg) {
    const { staff, shifts: S, perShift: k, prefs, rules, weights: w, locks, callouts } = cfg;
    const managers = cfg.managers || new Set(), needMgr = cfg.needMgr || [];
    const n = staff.length;
    const base = S + 1;
    const pow = [];
    for (let i = 0, p = 1; i < n; i++, p *= base) pow.push(p);
    const avg = (S * k) / n;
  
    const optionLists = [];
    const layers = [];
    let prev = new Map([[0, { score: 0, prev: null, opt: -1 }]]);
  
    for (let s = 0; s < S; s++) {
      const lockedIdx = [];
      staff.forEach((nm, i) => { if (locks.has(nm + "|" + s)) lockedIdx.push(i); });
      const eligible = [];
      staff.forEach((nm, i) => {
        if (prefs[nm][s] !== null && !callouts.has(nm + "|" + s)) eligible.push(i);
      });
      if (lockedIdx.length > k) {
        return { ok: false, reason: "Too many locked picks for one shift." };
      }
      for (const li of lockedIdx) {
        if (!eligible.includes(li)) {
          return { ok: false, reason: staff[li] + " is locked on a shift they cannot work." };
        }
      }
  
      const noNever = (c) => {
        for (let a = 0; a < c.length; a++)
          for (let b = a + 1; b < c.length; b++)
            if (rules[pairKey(staff[c[a]], staff[c[b]])] === "never") return false;
        return true;
      };
  
      const hasMgr = (c) => !needMgr[s] || c.some((i) => managers.has(staff[i]));
      let opts = [];
      for (let m = Math.min(k, eligible.length); m >= lockedIdx.length; m--) {
        opts = combinations(eligible, m).filter((c) => lockedIdx.every((l) => c.includes(l)) && noNever(c) && hasMgr(c));
        if (opts.length) break;
      }
      if (!opts.length) {
        const label = cfg.labels ? cfg.labels[s] : "shift " + (s + 1);
        if (needMgr[s] && !eligible.some((i) => managers.has(staff[i])))
          return { ok: false, reason: "No manager is available for " + label + "." };
        return { ok: false, reason: "The rules can’t all be met for " + label + "." };
      }
  
      const scored = opts.map((c) => {
        let sc = 0;
        for (const i of c) sc += w.pref * prefs[staff[i]][s];
        for (let a = 0; a < c.length; a++)
          for (let b = a + 1; b < c.length; b++) {
            const r = rules[pairKey(staff[c[a]], staff[c[b]])];
            if (r === "like") sc += 2 * w.tog;
            else if (r === "avoid") sc -= 2 * w.avoid;
          }
        return { members: c, score: sc, inc: c.reduce((t, i) => t + pow[i], 0) };
      });
      optionLists.push(scored);
  
      const next = new Map();
      for (const [key, val] of prev) {
        for (let o = 0; o < scored.length; o++) {
          const nk = key + scored[o].inc;
          const ns = val.score + scored[o].score;
          const cur = next.get(nk);
          if (!cur || ns > cur.score + 1e-9) next.set(nk, { score: ns, prev: key, opt: o });
        }
      }
      layers.push(next);
      prev = next;
    }
  
    let bestKey = null, bestTotal = -Infinity;
    for (const [key, val] of prev) {
      let pen = 0;
      for (let i = 0; i < n; i++) {
        const c = Math.floor(key / pow[i]) % base;
        pen += (c - avg) * (c - avg);
      }
      const total = val.score - w.fair * pen;
      if (total > bestTotal + 1e-9) { bestTotal = total; bestKey = key; }
    }
  
    const schedule = new Array(S);
    let key = bestKey;
    for (let s = S - 1; s >= 0; s--) {
      const node = layers[s].get(key);
      schedule[s] = optionLists[s][node.opt].members.map((i) => staff[i]);
      key = node.prev;
    }
    return { ok: true, schedule, total: bestTotal };
  }
  
  /* Score a finished schedule (used by tests and by the rescue ranking) */
  function scoreSchedule(cfg, schedule) {
    const { staff, prefs, rules, weights: w, shifts: S, perShift: k } = cfg;
    let sc = 0;
    const count = Object.fromEntries(staff.map((n) => [n, 0]));
    schedule.forEach((members, s) => {
      members.forEach((nm) => { sc += w.pref * prefs[nm][s]; count[nm]++; });
      for (let a = 0; a < members.length; a++)
        for (let b = a + 1; b < members.length; b++) {
          const r = rules[pairKey(members[a], members[b])];
          if (r === "like") sc += 2 * w.tog;
          else if (r === "avoid") sc -= 2 * w.avoid;
        }
    });
    const avg = (S * k) / staff.length;
    staff.forEach((nm) => { sc -= w.fair * (count[nm] - avg) ** 2; });
    return sc;
  }
  
  /*
    Call-out cover: someone called out. Rank everyone else for the open slot,
    using the same weights the manager set, and explain each suggestion.
  */
  function rankReplacements(cfg, schedule, s, calledOut) {
    const { staff, prefs, rules, weights: w, shifts: S, perShift: k, callouts } = cfg;
    const managers = cfg.managers || new Set();
    const members = schedule[s].filter((n) => n !== calledOut);
    const needsMgr = !!(cfg.needMgr && cfg.needMgr[s]) && !members.some((m) => managers.has(m));
    const avg = (S * k) / staff.length;
    const counts = Object.fromEntries(staff.map((n) => [n, 0]));
    schedule.forEach((m, i) => m.forEach((n) => { if (!(i === s && n === calledOut)) counts[n]++; }));
  
    const eligible = [], blocked = [];
    for (const nm of staff) {
      if (nm === calledOut || members.includes(nm)) continue;
      if (prefs[nm][s] === null || callouts.has(nm + "|" + s)) { blocked.push({ name: nm, why: "unavailable" }); continue; }
      const never = members.find((m) => rules[pairKey(nm, m)] === "never");
      if (never) { blocked.push({ name: nm, why: "can’t work with " + never }); continue; }
      if (needsMgr && !managers.has(nm)) { blocked.push({ name: nm, why: "shift needs a manager" }); continue; }
  
      let score = w.pref * prefs[nm][s];
      const reasons = [];
      const p = prefs[nm][s];
      if (p === 2) reasons.push({ t: "Strongly prefers this shift", tone: "good" });
      else if (p === 1) reasons.push({ t: "Prefers this shift", tone: "good" });
      else if (p === 0) reasons.push({ t: "Available", tone: "neutral" });
      else if (p === -1) reasons.push({ t: "Would rather not", tone: "warn" });
      else reasons.push({ t: "Strongly prefers not to", tone: "warn" });
  
      if (needsMgr) reasons.unshift({ t: "Manager, covers the manager requirement", tone: "good" });
      for (const m of members) {
        const r = rules[pairKey(nm, m)];
        if (r === "like") { score += 2 * w.tog; reasons.push({ t: "Likes working with " + m, tone: "good" }); }
        if (r === "avoid") { score -= 2 * w.avoid; reasons.push({ t: "Prefers not to work with " + m, tone: "warn" }); }
      }
      const c = counts[nm];
      score -= w.fair * ((c + 1 - avg) ** 2 - (c - avg) ** 2);
      if (c < avg - 0.5) reasons.push({ t: "Has fewer shifts than average", tone: "good" });
      else if (c > avg + 0.5) reasons.push({ t: "Already has " + c + " shifts", tone: "warn" });
  
      eligible.push({ name: nm, score, reasons });
    }
    eligible.sort((a, b) => b.score - a.score || staff.indexOf(a.name) - staff.indexOf(b.name));
    return { eligible, blocked };
  }
  
  /* SOLVER:END */

  /* =====================================================================
     DEMO UI
     ===================================================================== */
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = $("#scheduler");
  if (!root) return;

  var DAYS = ["Fri", "Sat", "Sun"], MEALS = ["Lunch", "Dinner"], S = 6;
  var LABELS = []; for (var i = 0; i < S; i++) LABELS.push(DAYS[Math.floor(i / 2)] + " " + MEALS[i % 2]);

  var DEMO = {
    staff: ["Ava", "Ben", "Cara", "Dev", "Eli", "Fay"],
    prefs: {
      Ava:  [2, 1, null, -1, 1, 0],
      Ben:  [1, 2, 0, -2, -1, 1],
      Cara: [null, 2, 2, 1, 0, 1],
      Dev:  [-1, 0, 2, 2, 2, -2],
      Eli:  [2, -2, 1, 1, 0, 2],
      Fay:  [0, 1, -1, -2, null, 0]
    },
    rules: { "Ava|Ben": "like", "Cara|Dev": "avoid", "Ben|Eli": "never", "Dev|Fay": "like" },
    weights: { pref: 6, tog: 3, avoid: 4, fair: 3 },
    managers: ["Ava", "Dev"],
    needMgr: [false, true, false, true, false, false]
  };

  var elSchedule = $("[data-schedule]", root), elSummary = $("[data-summary]", root), elError = $("[data-error]", root);
  var elRescue = $("[data-rescue]", root), elPeople = $("[data-people]", root), elRules = $("[data-rules]", root);
  var selA = $("[data-pair-a]", root), selB = $("[data-pair-b]", root), selRel = $("[data-pair-rel]", root), pairStatus = $("[data-pair-status]", root);
  var cfg, schedule, timer, token = 0, lastCallout = null;

  function fresh() {
    cfg = {
      staff: DEMO.staff.slice(), shifts: S, perShift: 2, labels: LABELS,
      prefs: JSON.parse(JSON.stringify(DEMO.prefs)),
      rules: JSON.parse(JSON.stringify(DEMO.rules)),
      weights: JSON.parse(JSON.stringify(DEMO.weights)),
      managers: new Set(DEMO.managers), needMgr: DEMO.needMgr.slice(),
      locks: new Set(), callouts: new Set()
    };
    schedule = null; lastCallout = null;
  }

  /* ----- availability values ----- */
  var LEVELS = [
    { v: 2, sym: "++", name: "strongly prefers", cls: "cell-pp" },
    { v: 1, sym: "+", name: "prefers", cls: "cell-p" },
    { v: 0, sym: "·", name: "neutral", cls: "" },
    { v: -1, sym: "−", name: "would rather not", cls: "cell-a" },
    { v: -2, sym: "−−", name: "strongly avoids", cls: "cell-aa" },
    { v: null, sym: "✕", name: "unavailable", cls: "cell-x" }
  ];
  function levelIndex(v) { for (var i = 0; i < LEVELS.length; i++) if (LEVELS[i].v === v) return i; return 2; }

  /* ----- people grid ----- */
  function renderPeople() {
    elPeople.textContent = "";
    elPeople.appendChild(document.createElement("div"));
    for (var s = 0; s < S; s++) {
      var h = document.createElement("div"); h.className = "people-colhead";
      h.appendChild(document.createTextNode(DAYS[Math.floor(s / 2)]));
      var b = document.createElement("b"); b.textContent = MEALS[s % 2]; h.appendChild(b);
      elPeople.appendChild(h);
    }
    cfg.staff.forEach(function (name) {
      var row = document.createElement("div"); row.className = "people-name";
      var nm = document.createElement("span"); nm.textContent = name;
      var mg = document.createElement("button"); mg.type = "button"; mg.className = "mgr-tag-btn"; mg.textContent = "MGR";
      var isM = cfg.managers.has(name);
      mg.setAttribute("aria-pressed", String(isM));
      mg.setAttribute("aria-label", name + " is " + (isM ? "" : "not ") + "a manager");
      mg.addEventListener("click", function () {
        if (cfg.managers.has(name)) cfg.managers.delete(name); else cfg.managers.add(name);
        renderPeople(); queueSolve();
      });
      row.appendChild(nm); row.appendChild(mg); elPeople.appendChild(row);
      for (var s2 = 0; s2 < S; s2++) (function (s) {
        var c = document.createElement("button"); c.type = "button";
        var lv = LEVELS[levelIndex(cfg.prefs[name][s])];
        c.className = "cell " + lv.cls; c.textContent = lv.sym;
        c.setAttribute("aria-label", name + ", " + LABELS[s] + ": " + lv.name + ". Click to change.");
        c.addEventListener("click", function () {
          var next = LEVELS[(levelIndex(cfg.prefs[name][s]) + 1) % LEVELS.length];
          cfg.prefs[name][s] = next.v;
          cfg.callouts.delete(name + "|" + s);
          c.className = "cell " + next.cls; c.textContent = next.sym;
          c.setAttribute("aria-label", name + ", " + LABELS[s] + ": " + next.name + ". Click to change.");
          queueSolve();
        });
        elPeople.appendChild(c);
      })(s2);
    });
  }

  /* ----- pairings ----- */
  var RULE_TXT = { like: "Prefer together", avoid: "Prefer apart", never: "Can’t work together" };
  function renderRules() {
    elRules.textContent = "";
    var keys = Object.keys(cfg.rules);
    if (!keys.length) { var e = document.createElement("li"); e.className = "rules-empty"; e.textContent = "No rules yet."; elRules.appendChild(e); return; }
    keys.forEach(function (k) {
      var pr = k.split("|"), li = document.createElement("li");
      var who = document.createElement("span"); who.className = "rule-who"; who.textContent = pr[0] + " & " + pr[1];
      var end = document.createElement("span"); end.className = "rule-end";
      var tag = document.createElement("span"); tag.className = "rule-tag rule-" + cfg.rules[k]; tag.textContent = RULE_TXT[cfg.rules[k]];
      var x = document.createElement("button"); x.type = "button"; x.className = "rule-x"; x.textContent = "×";
      x.setAttribute("aria-label", "Remove rule for " + pr[0] + " and " + pr[1]);
      x.addEventListener("click", function () { delete cfg.rules[k]; setPairStatus("Rule removed.", ""); renderRules(); queueSolve(); });
      end.appendChild(tag); end.appendChild(x); li.appendChild(who); li.appendChild(end); elRules.appendChild(li);
    });
  }
  function setPairStatus(t, cls) { pairStatus.textContent = t; pairStatus.className = "form-status" + (cls ? " " + cls : ""); }
  function fillSelects() {
    [selA, selB].forEach(function (sel, idx) {
      sel.textContent = "";
      cfg.staff.forEach(function (n, i) { var o = document.createElement("option"); o.value = n; o.textContent = n; o.selected = i === idx; sel.appendChild(o); });
    });
  }
  $("[data-pair-form]", root).addEventListener("submit", function (e) {
    e.preventDefault();
    var a = selA.value, b = selB.value;
    if (a === b) { setPairStatus("Pick two different people.", "is-error"); return; }
    var k = pairKey(a, b), existed = !!cfg.rules[k];
    cfg.rules[k] = selRel.value;
    setPairStatus((existed ? "Updated: " : "Added: ") + a + " & " + b + ".", "is-success");
    renderRules(); queueSolve();
  });

  /* ----- schedule ----- */
  function renderSchedule() {
    elSchedule.textContent = "";
    var order = [];
    if (window.matchMedia("(max-width: 720px)").matches) { for (var q = 0; q < S; q++) order.push(q); }
    else { for (var m = 0; m < 2; m++) for (var d = 0; d < 3; d++) order.push(d * 2 + m); }
    order.forEach(function (s) {
      var box = document.createElement("div"); box.className = "shift" + (cfg.needMgr[s] ? " needs-mgr" : "");
      var head = document.createElement("div"); head.className = "shift-head";
      var nm = document.createElement("span"); nm.className = "shift-name"; nm.textContent = LABELS[s];
      var tg = document.createElement("button"); tg.type = "button"; tg.className = "mgr-toggle"; tg.textContent = "Manager";
      tg.setAttribute("aria-pressed", String(!!cfg.needMgr[s]));
      tg.setAttribute("aria-label", "Require a manager on " + LABELS[s]);
      tg.addEventListener("click", function () { cfg.needMgr[s] = !cfg.needMgr[s]; queueSolve(); renderSchedule(); });
      head.appendChild(nm); head.appendChild(tg); box.appendChild(head);

      var members = schedule ? schedule[s] : [];
      members.forEach(function (name) {
        var b = document.createElement("button"); b.type = "button"; b.className = "chip";
        b.appendChild(document.createTextNode(name));
        if (cfg.managers.has(name)) { var t = document.createElement("span"); t.className = "tag-mgr"; t.textContent = "MGR"; b.appendChild(t); }
        b.setAttribute("aria-label", name + " on " + LABELS[s] + ". Click to simulate a call-out.");
        b.addEventListener("click", function () { callOut(name, s); });
        box.appendChild(b);
      });
      for (var k = members.length; k < cfg.perShift; k++) {
        if (lastCallout && lastCallout.s === s) {
          var ob = document.createElement("button"); ob.type = "button"; ob.className = "chip chip-open"; ob.textContent = "Open: find cover";
          ob.addEventListener("click", function () { showRescue(); });
          box.appendChild(ob);
        } else {
          var od = document.createElement("div"); od.className = "chip chip-open"; od.textContent = "Open slot"; box.appendChild(od);
        }
      }
      elSchedule.appendChild(box);
    });
  }

  function renderSummary() {
    if (!schedule) { elSummary.textContent = ""; return; }
    var asked = 0, total = 0, mgrOk = true;
    schedule.forEach(function (mem, s) {
      mem.forEach(function (n) { total++; if (cfg.prefs[n][s] >= 1) asked++; });
      if (cfg.needMgr[s] && !mem.some(function (n) { return cfg.managers.has(n); })) mgrOk = false;
    });
    elSummary.innerHTML = "<strong>" + asked + " of " + total + "</strong> assignments are shifts people asked for. " +
      (mgrOk ? "Every manager shift is covered." : "<strong>A manager shift is uncovered.</strong>");
  }

  /* ----- call-out rescue ----- */
  function callOut(name, s) {
    if (lastCallout) undoCallout(true);
    cfg.callouts.add(name + "|" + s);
    schedule[s] = schedule[s].filter(function (n) { return n !== name; });
    lastCallout = { name: name, s: s };
    renderSchedule(); renderSummary(); showRescue();
  }
  function undoCallout(silent) {
    var c = lastCallout; if (!c) return;
    cfg.callouts.delete(c.name + "|" + c.s);
    if (schedule[c.s].indexOf(c.name) < 0 && schedule[c.s].length < cfg.perShift) schedule[c.s].push(c.name);
    lastCallout = null; elRescue.hidden = true; elRescue.textContent = "";
    if (!silent) { renderSchedule(); renderSummary(); }
  }
  function showRescue() {
    var c = lastCallout; if (!c) return;
    var r = rankReplacements(cfg, schedule, c.s, c.name);
    elRescue.textContent = "";
    var head = document.createElement("div"); head.className = "rescue-head";
    var hd = document.createElement("div");
    var h = document.createElement("h4"); h.textContent = c.name + " called out of " + LABELS[c.s];
    var sub = document.createElement("p"); sub.textContent = r.eligible.length ? "Best replacements, ranked by your priorities:" : "No one can cover this shift.";
    hd.appendChild(h); hd.appendChild(sub);
    var btns = document.createElement("div"); btns.className = "rescue-btns";
    var undo = document.createElement("button"); undo.type = "button"; undo.className = "mini-btn"; undo.textContent = "Undo call-out";
    undo.addEventListener("click", function () { undoCallout(false); });
    btns.appendChild(undo);
    head.appendChild(hd); head.appendChild(btns); elRescue.appendChild(head);

    r.eligible.slice(0, 3).forEach(function (cand, i) {
      var row = document.createElement("div"); row.className = "rescue-item";
      var left = document.createElement("div");
      var nm = document.createElement("span"); nm.className = "rescue-name"; nm.textContent = cand.name; left.appendChild(nm);
      if (i === 0) { var best = document.createElement("span"); best.className = "rescue-best"; best.textContent = "Best match"; left.appendChild(best); }
      var rs = document.createElement("div"); rs.className = "reasons";
      cand.reasons.forEach(function (x) { var sp = document.createElement("span"); sp.className = "reason " + x.tone; sp.textContent = x.t; rs.appendChild(sp); });
      left.appendChild(rs);
      var b = document.createElement("button"); b.type = "button"; b.className = "mini-btn" + (i === 0 ? " mini-btn-gold" : ""); b.textContent = "Assign";
      b.setAttribute("aria-label", "Assign " + cand.name + " to " + LABELS[c.s]);
      b.addEventListener("click", function () {
        schedule[c.s].push(cand.name);
        lastCallout = null; elRescue.hidden = true; elRescue.textContent = "";
        renderSchedule(); renderSummary();
      });
      row.appendChild(left); row.appendChild(b); elRescue.appendChild(row);
    });
    if (r.blocked.length) {
      var bl = document.createElement("p"); bl.className = "rescue-blocked";
      bl.textContent = "Can’t cover: " + r.blocked.map(function (x) { return x.name + " (" + x.why + ")"; }).join(", ");
      elRescue.appendChild(bl);
    }
    elRescue.hidden = false;
  }

  /* ----- solving ----- */
  function solveNow() {
    elSchedule.classList.remove("is-loading");
    var res = solveSchedule(cfg);
    if (res.ok) { schedule = res.schedule; elError.hidden = true; elSchedule.classList.remove("is-stale"); }
    else { elError.textContent = res.reason + " Change availability, managers, or a rule."; elError.hidden = false; elSchedule.classList.add("is-stale"); }
    renderSchedule(); renderSummary();
    elSummary.hidden = !res.ok;
  }
  function queueSolve() {
    // a settings change rebuilds the schedule, so any open call-out is cleared
    cfg.callouts.clear(); lastCallout = null; elRescue.hidden = true; elRescue.textContent = "";
    clearTimeout(timer);
    var my = ++token;
    elSchedule.classList.add("is-loading");
    timer = setTimeout(function () { if (my === token) solveNow(); }, reduceMotion ? 0 : 280);
  }

  /* ----- sliders (gold fill follows the thumb) ----- */
  function paintFill(inp) { inp.style.setProperty("--fill", (inp.value - inp.min) / (inp.max - inp.min) * 100 + "%"); }
  $$("[data-weight]", root).forEach(function (inp) {
    paintFill(inp);
    inp.addEventListener("input", function () {
      cfg.weights[inp.dataset.weight] = +inp.value;
      $("[data-out='" + inp.dataset.weight + "']", root).textContent = inp.value;
      paintFill(inp); queueSolve();
    });
  });
  function syncSliders() {
    $$("[data-weight]", root).forEach(function (inp) {
      inp.value = cfg.weights[inp.dataset.weight];
      $("[data-out='" + inp.dataset.weight + "']", root).textContent = inp.value;
      paintFill(inp);
    });
  }

  /* ----- tabs ----- */
  var tabs = $$("[data-stab]", root);
  function showTab(t) {
    tabs.forEach(function (x) {
      var on = x === t; x.classList.toggle("is-active", on); x.setAttribute("aria-selected", String(on)); x.tabIndex = on ? 0 : -1;
      document.getElementById(x.getAttribute("aria-controls")).hidden = !on;
    });
  }
  tabs.forEach(function (t, i) {
    t.tabIndex = i === 0 ? 0 : -1;
    t.addEventListener("click", function () { showTab(t); });
    t.addEventListener("keydown", function (e) {
      var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0; if (!d) return;
      e.preventDefault(); var n = tabs[(i + d + tabs.length) % tabs.length]; n.focus(); showTab(n);
    });
  });

  $("[data-reset]", root).addEventListener("click", function () {
    fresh(); syncSliders(); renderPeople(); renderRules(); fillSelects(); setPairStatus("", "");
    elRescue.hidden = true; solveNow();
  });
  window.matchMedia("(max-width: 720px)").addEventListener("change", renderSchedule);

  fresh(); syncSliders(); renderPeople(); renderRules(); fillSelects(); solveNow();
})();
