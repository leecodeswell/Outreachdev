/* =====================================================================
   Outreachdev (by Thompson Technologies): shared site behavior
   ===================================================================== */
(function () {
  "use strict";

  /* ---------- Settings: fill these in when you're ready ---------- */
  var CONTACT_EMAIL = "thompsontechnologiesleet@gmail.com";   // where contact form messages are delivered
  var BOOKING_URL   = "";   // optional scheduling link (Calendly, Cal.com...). Empty = "Schedule a call" opens the form in call mode.

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Mobile menu ---------- */
  var navBtn = $(".nav-toggle"), nav = $("#site-nav");
  function setMenu(open) {
    if (!navBtn) return;
    navBtn.setAttribute("aria-expanded", String(open));
    navBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    nav.classList.toggle("is-open", open);
  }
  if (navBtn && nav) {
    navBtn.addEventListener("click", function () { setMenu(navBtn.getAttribute("aria-expanded") !== "true"); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) { setMenu(false); setDropdown(false); } });
  }

  /* ---------- Applications dropdown ---------- */
  var ddBtn = $("[data-dropdown]"), ddMenu = ddBtn ? document.getElementById(ddBtn.getAttribute("aria-controls")) : null;
  var isMobileNav = function () { return window.matchMedia("(max-width: 960px)").matches; };
  function setDropdown(open) {
    if (!ddBtn) return;
    ddBtn.setAttribute("aria-expanded", String(open));
    ddMenu.hidden = !open;
  }
  if (ddBtn) {
    ddBtn.addEventListener("click", function (e) { e.stopPropagation(); setDropdown(ddMenu.hidden); });
    var dd = ddBtn.parentElement, closeT;
    dd.addEventListener("mouseenter", function () { if (!isMobileNav()) { clearTimeout(closeT); setDropdown(true); } });
    dd.addEventListener("mouseleave", function () { if (!isMobileNav()) closeT = setTimeout(function () { setDropdown(false); }, 150); });
    document.addEventListener("click", function (e) { if (!dd.contains(e.target)) setDropdown(false); });
    dd.addEventListener("focusout", function (e) { if (!isMobileNav() && !dd.contains(e.relatedTarget)) setDropdown(false); });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (ddBtn && !ddMenu.hidden) { setDropdown(false); ddBtn.focus(); }
    setMenu(false);
  });

  /* ---------- "Schedule a call" links ---------- */
  $$("[data-call]").forEach(function (a) {
    if (BOOKING_URL) { a.href = BOOKING_URL; a.target = "_blank"; a.rel = "noopener"; }
    else a.addEventListener("click", function () { setContactMode("call"); });
  });

  /* =====================================================================
     HERO TREE: the trunk appears, branches grow out to each leaf,
     small twigs sprout along the way, then gold light runs through it
     ===================================================================== */
  (function treeAnim() {
    var flow = $(".flow");
    if (!flow) return;
    var canvas = $(".flow-canvas", flow), ctx = canvas.getContext("2d");
    var inputs = $$('[data-node="in"]', flow), outputs = $$('[data-node="out"]', flow), hub = $('[data-node="hub"]', flow);
    var labels = $$(".flow-label", flow);
    var paths = [], particles = [];
    var W = 0, H = 0, growStart = -1, grown = false, visible = true, seen = false, spawnClock = 0;
    var GROW_MS = 1100;

    function center(el, base) { var r = el.getBoundingClientRect(); return { x: r.left - base.left + r.width / 2, y: r.top - base.top + r.height / 2, r: r.width / 2 }; }
    function bez(p, t) {
      var u = 1 - t;
      return {
        x: u * u * u * p.p0.x + 3 * u * u * t * p.p1.x + 3 * u * t * t * p.p2.x + t * t * t * p.p3.x,
        y: u * u * u * p.p0.y + 3 * u * u * t * p.p1.y + 3 * u * t * t * p.p2.y + t * t * t * p.p3.y
      };
    }
    // deterministic "randomness" so the tree keeps its shape on resize
    function rng(seed) { return function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }; }

    function build() {
      var base = flow.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = base.width; H = base.height;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var h = center(hub, base), rand = rng(7);
      var twigLen = W < 600 ? 12 : Math.min(60, W / 28);

      function make(node, kind, order) {
        // the branch attaches to the outer tip of the leaf's little stem
        var sr = node.querySelector(".stem").getBoundingClientRect();
        var leaf = { x: (kind === "in" ? sr.right : sr.left) - base.left, y: sr.top + sr.height / 2 - base.top };
        // branches meet the trunk spread slightly around its edge, like roots
        var ang = Math.max(-0.5, Math.min(0.5, (leaf.y - h.y) / (h.r * 4)));
        var hubPt = { x: h.x + (kind === "in" ? -1 : 1) * h.r * Math.cos(ang), y: h.y + h.r * Math.sin(ang) };
        var a = kind === "in" ? leaf : hubPt, b = kind === "in" ? hubPt : leaf;
        var mid = (a.x + b.x) / 2;
        var p = { p0: a, p1: { x: mid, y: a.y }, p2: { x: mid, y: b.y }, p3: b, kind: kind, node: node, delay: 350 + order * 120, twigs: [] };
        // one or two twigs sprouting off each branch, curling outward
        var n = W < 600 ? 1 : 2 + (rand() > 0.5 ? 1 : 0);
        for (var i = 0; i < n; i++) {
          var tFromHub = 0.25 + (i + rand()) * (0.55 / n);                 // how far out along the branch
          var t = kind === "in" ? 1 - tFromHub : tFromHub;    // in path coordinates
          var s = bez(p, t), s2 = bez(p, kind === "in" ? t - 0.01 : t + 0.01);
          var dx = s2.x - s.x, dy = s2.y - s.y, len = Math.hypot(dx, dy) || 1; dx /= len; dy /= len;
          var side = Math.abs(leaf.y - h.y) < 8 ? (i % 2 ? 1 : -1) : Math.sign(leaf.y - h.y) * (i === 1 ? -1 : 1);
          var nx = -dy, ny = dx; if (Math.sign(ny || 1) !== side) { nx = -nx; ny = -ny; }
          var ang = 0.55 + rand() * 0.35, L = twigLen * (0.7 + rand() * 0.6);
          var tx = dx * Math.cos(ang) + nx * Math.sin(ang), ty = dy * Math.cos(ang) + ny * Math.sin(ang);
          p.twigs.push({ s: s, c: { x: s.x + tx * L * 0.6, y: s.y + ty * L * 0.6 }, e: { x: s.x + (tx + dx * 0.5) * L, y: s.y + (ty + dy * 0.5) * L * 0.9 }, at: tFromHub });
        }
        return p;
      }
      paths = []; particles = [];
      var n = Math.max(inputs.length, outputs.length), order = 0;
      for (var i = 0; i < n; i++) {
        if (inputs[i]) paths.push(make(inputs[i], "in", order++));
        if (outputs[i]) paths.push(make(outputs[i], "out", order++));
      }
    }

    function glow(x, y, r, a) {
      var g = ctx.createRadialGradient(x, y, 0, x, y, r * 5);
      g.addColorStop(0, "rgba(233,205,136," + a * 0.7 + ")"); g.addColorStop(1, "rgba(201,162,79,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 5, 0, 6.2832); ctx.fill();
      ctx.fillStyle = "rgba(250,236,196," + a + ")"; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
    }

    // g = how far the branch has grown out from the trunk (0..1)
    function drawBranch(p, g) {
      var from = p.kind === "in" ? 1 - g : 0, to = p.kind === "in" ? 1 : g, steps = 40;
      var grad = ctx.createLinearGradient(p.p0.x, 0, p.p3.x, 0);
      var strong = "rgba(201,162,79,0.6)", soft = "rgba(201,162,79,0.16)";
      grad.addColorStop(0, p.kind === "in" ? soft : strong); grad.addColorStop(1, p.kind === "in" ? strong : soft);
      ctx.strokeStyle = grad; ctx.lineWidth = 1.25; ctx.lineCap = "round";
      ctx.beginPath();
      for (var s = 0; s <= steps; s++) { var pt = bez(p, from + (to - from) * (s / steps)); if (s) ctx.lineTo(pt.x, pt.y); else ctx.moveTo(pt.x, pt.y); }
      ctx.stroke();
      // twigs grow once the branch passes them
      p.twigs.forEach(function (tw) {
        var k = Math.max(0, Math.min(1, (g - tw.at) / 0.22));
        if (!k) return;
        var e = 1 - Math.pow(1 - k, 2);
        ctx.strokeStyle = "rgba(201,162,79," + (0.28 * e) + ")"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(tw.s.x, tw.s.y);
        var steps2 = 14;
        for (var q = 1; q <= steps2; q++) {
          var t = e * q / steps2, u = 1 - t;
          ctx.lineTo(u * u * tw.s.x + 2 * u * t * tw.c.x + t * t * tw.e.x, u * u * tw.s.y + 2 * u * t * tw.c.y + t * t * tw.e.y);
        }
        ctx.stroke();
        if (k >= 1) { ctx.fillStyle = "rgba(201,162,79,0.55)"; ctx.beginPath(); ctx.arc(tw.e.x, tw.e.y, 1.6, 0, 6.2832); ctx.fill(); }
      });
      if (g < 1) { var tip = bez(p, p.kind === "in" ? from : to); glow(tip.x, tip.y, 2.2, 0.95); }
    }
    function ease(t) { return 1 - Math.pow(1 - t, 3); }
    function lit(node) { node.classList.add("is-lit"); setTimeout(function () { node.classList.remove("is-lit"); }, 900); }

    function spawn() {
      var ins = paths.filter(function (p) { return p.kind === "in"; }), outs = paths.filter(function (p) { return p.kind === "out"; });
      var src = ins[Math.floor(Math.random() * ins.length)];
      particles.push({ path: src, t: 0, v: 0.45 + Math.random() * 0.15 });
      lit(src.node);
      setTimeout(function () {
        var dst = outs[Math.floor(Math.random() * outs.length)];
        if (dst) particles.push({ path: dst, t: 0, v: 0.5 + Math.random() * 0.15 });
      }, 1100);
    }
    function bornAll() {
      grown = true;
      flow.classList.remove("is-seed"); flow.classList.add("is-grown");
      paths.forEach(function (p) { p.node.classList.add("is-born"); });
      labels.forEach(function (l) { l.classList.add("is-born"); });
    }

    var last = 0;
    function frame(ts) {
      requestAnimationFrame(frame);
      if (!visible || document.hidden) { last = ts; return; }
      var dt = Math.min(0.05, (ts - (last || ts)) / 1000); last = ts;
      ctx.clearRect(0, 0, W, H);

      if (!grown) {
        // the tree waits until it is actually on screen, then grows
        if (growStart < 0) { if (!seen) return; growStart = ts + 150; }
        var el = ts - growStart, done = true;
        paths.forEach(function (p) {
          var g = Math.max(0, Math.min(1, (el - p.delay) / GROW_MS));
          if (g > 0) drawBranch(p, ease(g));
          if (g >= 1 && !p.node.classList.contains("is-born")) {
            p.node.classList.add("is-born"); lit(p.node);
            labels.forEach(function (l) { if (l.parentElement === p.node.parentElement) l.classList.add("is-born"); });
          }
          if (g < 1) done = false;
        });
        if (done) { bornAll(); spawn(); }
        return;
      }

      paths.forEach(function (p) { drawBranch(p, 1); });
      spawnClock += dt;
      if (spawnClock > 0.95) { spawnClock = 0; spawn(); }
      ctx.globalCompositeOperation = "lighter";
      for (var i = particles.length - 1; i >= 0; i--) {
        var pt = particles[i];
        pt.t += pt.v * dt;
        for (var k = 0; k < 6; k++) {
          var tt = pt.t - k * 0.025;
          if (tt < 0 || tt > 1) continue;
          var pos = bez(pt.path, tt);
          glow(pos.x, pos.y, k === 0 ? 2.3 : 2 - k * 0.25, 0.9 - k * 0.15);
        }
        if (pt.t >= 1 && pt.path.kind === "out" && !pt.done) { pt.done = true; lit(pt.path.node); }
        if (pt.t > 1.2) particles.splice(i, 1);
      }
      ctx.globalCompositeOperation = "source-over";
    }

    function drawStatic() { ctx.clearRect(0, 0, W, H); paths.forEach(function (p) { drawBranch(p, 1); }); }
    function start() {
      build();
      if (reduceMotion) { bornAll(); drawStatic(); return; }
      flow.classList.add("is-growing");
      requestAnimationFrame(frame);
    }

    var rt;
    function onResize() { clearTimeout(rt); rt = setTimeout(function () { build(); if (reduceMotion) drawStatic(); }, 80); }
    if ("ResizeObserver" in window) new ResizeObserver(onResize).observe(flow); else window.addEventListener("resize", onResize);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
        if (es[0].intersectionRatio >= 0.3) seen = true;   // start growing once a third of it is on screen
      }, { threshold: [0, 0.3] }).observe(flow);
    } else seen = true;

    var started = false;
    function go() { if (!started) { started = true; start(); } }
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(go); setTimeout(go, 1200); } else go();
  })();

  /* =====================================================================
     SPREADSHEET BEFORE / AFTER
     ===================================================================== */
  (function showcase() {
    var root = $(".showcase");
    if (!root) return;
    var tabs = $$("[data-view]", root), panels = $$("[data-panel]", root), cap = $("[data-caption]", root);
    var CAP = { sheet: "Duplicate entries, inconsistent dates, and broken formulas.", app: "The same records: duplicates merged, dates consistent, sorted by status." };
    var current = "sheet", touched = false, visible = false;
    function show(v) {
      current = v;
      tabs.forEach(function (t) { var on = t.dataset.view === v; t.classList.toggle("is-active", on); t.setAttribute("aria-selected", String(on)); });
      panels.forEach(function (p) { p.classList.toggle("is-visible", p.dataset.panel === v); });
      cap.textContent = CAP[v];
    }
    tabs.forEach(function (t) { t.addEventListener("click", function () { touched = true; show(t.dataset.view); }); });
    if (!reduceMotion && "IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: 0.4 }).observe(root);
      setInterval(function () { if (!touched && visible && !document.hidden) show(current === "sheet" ? "app" : "sheet"); }, 3600);
    }
  })();

  /* =====================================================================
     AI CHATBOT SAMPLE
     ===================================================================== */
  (function chat() {
    var log = $("[data-chat-log]"), list = $("[data-chat-suggest]"), reset = $("[data-chat-reset]");
    if (!log || !list) return;
    var QA = [
      { q: "What are your hours on Sunday?", a: "On Sundays we’re open 9 am to 3 pm. The kitchen closes at 2:30 pm.", src: "Hours and location" },
      { q: "Do you have gluten-free options?", a: "Yes. Gluten-free dishes are marked GF on the menu, and many others can be adapted. Please mention any allergies when you order.", src: "Menu and allergen policy" },
      { q: "Can I book a table for 12?", a: "Groups of 8 or more need a reservation at least 48 hours ahead. I’ve passed your request to the manager, who will confirm with you.", src: "Reservations policy" },
      { q: "Do you cater weddings?", a: "I don’t have information about wedding catering, so I won’t guess. I’ve passed your question to the owner.", handoff: true }
    ];
    var busy = false;
    var docIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l4 4v14H7zM14 3v4h4"/></svg>';
    var handIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h14M13 6l6 6-6 6"/></svg>';
    function add(cls, text) { var m = document.createElement("div"); m.className = "msg " + cls; m.textContent = text; log.appendChild(m); log.scrollTop = log.scrollHeight; return m; }
    function greet() { add("msg-bot", "Hi! Ask me anything about Harbor Café."); }
    var btns = QA.map(function (item) {
      var b = document.createElement("button"); b.type = "button"; b.className = "suggest"; b.textContent = item.q;
      b.addEventListener("click", function () { ask(item, b); }); list.appendChild(b); return b;
    });
    function ask(item, btn) {
      if (busy) return; busy = true; btn.disabled = true; reset.hidden = false;
      add("msg-user", item.q);
      var reply = add("msg-bot", ""); reply.innerHTML = '<span class="typing" aria-label="Assistant is typing"><i></i><i></i><i></i></span>';
      setTimeout(function () {
        reply.textContent = item.a;
        var src = document.createElement("div"); src.className = "msg-src" + (item.handoff ? " is-handoff" : "");
        src.innerHTML = item.handoff ? handIcon : docIcon;
        var sp = document.createElement("span"); sp.textContent = item.handoff ? "Not in the approved information. Handed to a person." : "Source: " + item.src;
        src.appendChild(sp); reply.appendChild(src);
        log.scrollTop = log.scrollHeight; busy = false;
      }, reduceMotion ? 0 : 900);
    }
    reset.addEventListener("click", function () { log.textContent = ""; btns.forEach(function (b) { b.disabled = false; }); busy = false; reset.hidden = true; greet(); });
    greet();
  })();

  /* =====================================================================
     SCROLL REVEAL
     ===================================================================== */
  (function reveal() {
    if (reduceMotion || !("IntersectionObserver" in window)) return;
    var els = $$(".section-head, .card, .step, .points li, .callout, .app-feature, .split > div, .cta-band, .mission-grid");
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
    els.forEach(function (el) { el.classList.add("reveal"); io.observe(el); });
  })();

  /* =====================================================================
     CONTACT FORM (delivers to CONTACT_EMAIL through FormSubmit; falls back to email)
     ===================================================================== */
  var form = $("#contact-form");
  var modeRadios = form ? $$("input[name='mode']", form) : [];
  function currentMode() { var r = modeRadios.filter(function (x) { return x.checked; })[0]; return r ? r.value : "question"; }
  function setContactMode(m) { if (!form) return; modeRadios.forEach(function (r) { r.checked = r.value === m; }); applyMode(); }
  function applyMode() {
    var call = currentMode() === "call";
    $("[data-call-fields]", form).hidden = !call;
    $("[data-message-label]", form).textContent = call ? "Anything to know before we talk? (optional)" : "What would you like to improve?";
    $("[data-submit-label]", form).textContent = call ? "Request a call" : "Send message";
    $("#message", form).required = !call;
  }
  if (form) {
    modeRadios.forEach(function (r) { r.addEventListener("change", applyMode); });
    applyMode();
    var statusEl = $("[data-form-status]", form), submitBtn = $("[data-submit]", form);
    var fail = function (field, text) {
      $$("[aria-invalid]", form).forEach(function (f) { f.removeAttribute("aria-invalid"); });
      if (field) { field.setAttribute("aria-invalid", "true"); field.focus(); }
      statusEl.textContent = text; statusEl.className = "form-status is-error";
    };
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var call = currentMode() === "call", f = form.elements;
      var name = f.name.value.trim(), email = f.email.value.trim(), biz = f.business.value.trim(), msg = f.message.value.trim(), times = f.times.value.trim();
      if (!name) return fail(f.name, "Please enter your name.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(f.email, "Please enter a valid email address.");
      if (call && !times) return fail(f.times, "Please add a few days and times that work.");
      if (!call && !msg) return fail(f.message, "Please add a few sentences about what you'd like to improve.");
      $$("[aria-invalid]", form).forEach(function (x) { x.removeAttribute("aria-invalid"); });
      if (form.elements._honey && form.elements._honey.value) return; // spam bot filled the hidden field

      var subject = (call ? "Call request" : "Project inquiry") + " from " + name + (biz ? " (" + biz + ")" : "");
      var lines = ["Name: " + name, "Email: " + email];
      if (biz) lines.push("Business: " + biz);
      if (call) lines.push("Best days and times: " + times, "Format: " + f.format.value);
      if (msg) lines.push("", msg);
      var mailto = "mailto:" + CONTACT_EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(lines.join("\n"));

      submitBtn.classList.add("is-loading"); statusEl.textContent = ""; statusEl.className = "form-status";

      // Sent through FormSubmit (free), which delivers the message straight to CONTACT_EMAIL.
      var payload = {
        _subject: subject, _template: "table", _replyto: email,
        Type: call ? "Call request" : "Message", Name: name, Email: email, Business: biz || "-"
      };
      if (call) { payload["Best days and times"] = times; payload.Format = f.format.value; }
      payload.Message = msg || "-";

      fetch("https://formsubmit.co/ajax/" + CONTACT_EMAIL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (r) { return r.json().then(function (d) { if (!r.ok || String(d.success) !== "true") throw new Error(d.message || "Send failed"); }); })
        .then(function () {
          form.reset(); applyMode();
          statusEl.textContent = call ? "Thanks! Your call request was sent. I'll reply by email to set a time." : "Thanks! Your message was sent. I'll reply by email soon.";
          statusEl.className = "form-status is-success";
        })
        .catch(function () {
          // If the form service can't be reached, hand off to the visitor's own email app instead
          statusEl.innerHTML = "";
          statusEl.appendChild(document.createTextNode("That didn't go through. Please "));
          var a = document.createElement("a"); a.href = mailto; a.textContent = "email me directly"; statusEl.appendChild(a);
          statusEl.appendChild(document.createTextNode(" at " + CONTACT_EMAIL + "."));
          statusEl.className = "form-status is-error";
        })
        .then(function () { submitBtn.classList.remove("is-loading"); });
    });
  }

  /* ---------- Show the contact email wherever it's listed ---------- */
  $$("[data-email]").forEach(function (a) { a.href = "mailto:" + CONTACT_EMAIL; a.textContent = CONTACT_EMAIL; });

  /* ---------- Footer year ---------- */
  var yr = $("[data-year]"); if (yr) yr.textContent = new Date().getFullYear();
})();
