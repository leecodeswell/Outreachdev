/* =====================================================================
   Outreachdev (by Lee Thompson): shared site behavior
   ===================================================================== */
(function () {
  "use strict";

  /* ---------- Settings: fill these in when you're ready ---------- */
  var CONTACT_EMAIL = "thompsontechnologiesleet@gmail.com";   // where contact form messages are delivered
  var BOOKING_URL   = "";   // optional scheduling link (Calendly, Cal.com...). Empty = "Schedule a call" opens the form in call mode.

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Story layer gate (see STORY LAYER below) ----------
     On only for desktop with motion allowed. busy/whenIdle keep two beats from playing at once. */
  var story = {
    on: !reduceMotion && "IntersectionObserver" in window && window.matchMedia("(min-width: 721px)").matches,
    busy: false, queue: [],
    whenIdle: function (fn) { if (story.busy) story.queue.push(fn); else fn(); },
    idle: function () { story.busy = false; var q = story.queue; story.queue = []; q.forEach(function (fn) { fn(); }); }
  };
  // Calls cb(el, false) once, the first time each element comes into view. Elements that are already on
  // screen (or scrolled past) get cb(el, true) so they can sit in their finished state. Returns the elements
  // still waiting, so the caller can put them in their "before" state.
  function once(els, cb, opts) {
    var waiting = [];
    els.forEach(function (el) { if (el.getBoundingClientRect().top < window.innerHeight) cb(el, true); else waiting.push(el); });
    if (!waiting.length) return waiting;
    var left = waiting.slice();
    function fire(el, already) { var k = left.indexOf(el); if (k < 0) return; left.splice(k, 1); io.unobserve(el); cb(el, already); }
    // a fast flick can skip right past an element without it ever "intersecting": catch those too
    function sweep() { left.slice().forEach(function (el) { if (el.getBoundingClientRect().bottom < 0) fire(el, true); }); }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) fire(e.target, false); });
      sweep();
    }, opts);
    waiting.forEach(function (el) { io.observe(el); });
    window.addEventListener("scrollend", sweep, { passive: true });
    return waiting;
  }

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
     PHONES: the mission statement types itself out like code
     (phones only)
     ===================================================================== */
  (function typeMission() {
    var el = $(".mission-text");
    if (!el || !window.matchMedia("(max-width: 720px)").matches) return;
    var text = el.textContent.trim();
    // screen readers get the sentence once, whole; the typed copy is decoration
    el.textContent = "";
    var whole = document.createElement("span"); whole.className = "sr-only"; whole.textContent = text; el.appendChild(whole);
    var typed = document.createElement("span"); typed.setAttribute("aria-hidden", "true"); el.appendChild(typed);
    // every character gets its own span, so the line keeps its final size while it types
    var chars = text.split("").map(function (c) {
      var s = document.createElement("span"); s.className = "ch"; s.textContent = c; typed.appendChild(s); return s;
    });
    if (reduceMotion) return;

    var caret = document.createElement("span"); caret.className = "type-caret";
    // after typing, the caret blinks three times and goes away (nothing blinks for more than 5 seconds)
    caret.addEventListener("animationend", function () { caret.remove(); });
    el.classList.add("is-typing");
    typed.insertBefore(caret, chars[0]);
    var i = 0;
    function step() {
      chars[i].classList.add("on");
      typed.insertBefore(caret, chars[i].nextSibling);
      var c = chars[i].textContent; i++;
      if (i >= chars.length) { el.classList.remove("is-typing"); return; }
      // a quick, human-ish rhythm: a small beat after each word and at punctuation (about 2 seconds in all)
      var d = 18 + Math.random() * 12;
      if (c === " ") d += 30;
      if (c === "," || c === ".") d += 120;
      setTimeout(step, d);
    }
    var started = false;
    function begin() { if (!started) { started = true; setTimeout(step, 300); } }
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { io.disconnect(); begin(); }
      }, { threshold: 0.6 });
      io.observe(el);
    } else begin();
  })();

  /* =====================================================================
     AI CHATBOT SAMPLES: a website chatbot and an in-app helper
     ===================================================================== */
  (function chat() {
    var log = $("[data-chat-log]"), list = $("[data-chat-suggest]"), reset = $("[data-chat-reset]"), meta = $("[data-chat-meta]");
    if (!log || !list) return;
    var SETS = {
      site: {
        hello: "Hi! Ask me anything about Harbor Café.",
        meta: "Sample answers for an invented café.",
        qa: [
          { q: "What are your hours on Sunday?", a: "On Sundays we’re open 9 am to 3 pm. The kitchen closes at 2:30 pm.", src: "Hours and location" },
          { q: "Do you have gluten-free options?", a: "Yes. Gluten-free dishes are marked GF on the menu, and many others can be adapted. Please mention any allergies when you order.", src: "Menu and allergen policy" },
          { q: "Can I book a table for 12?", a: "Groups of 8 or more need a reservation at least 48 hours ahead. I’ve passed your request to the manager, who will confirm with you.", src: "Reservations policy" },
          { q: "Do you cater weddings?", a: "I don’t have information about wedding catering, so I won’t guess. I’ve passed your question to the owner.", handoff: true }
        ]
      },
      app: {
        hello: "Hi! I can answer questions about this week’s schedule and suggest changes. Nothing changes until you approve it.",
        meta: "Sample of the helper inside Scheduling Agent, with an invented team.",
        qa: [
          { q: "Ben can’t work Friday. Who can cover?", a: "Gus and Eli are free Friday evening and under their max hours. Gus prefers closing shifts, so he’s the best fit.",
            change: [["Friday close", "Ben → Gus"], ["Gus’s hours", "24 → 29 of 30"]] },
          { q: "Who’s closest to their max hours?", a: "Dev is at 34 of 36 hours and Ava at 30 of 36. Everyone else has at least 6 hours of room this week.", src: "This week’s schedule" },
          { q: "Give Cara next Saturday off.", a: "Here’s the change. Her Saturday mid shift goes to Fay, who prefers weekends.",
            change: [["Cara, Saturday", "Marked off"], ["Saturday mid", "Cara → Fay"]] },
          { q: "Can you make Hana a manager?", a: "That’s a change to her roles, which only you can make in Team. I can explain how if you’d like.", handoff: true, handoffText: "Outside what the helper is allowed to change." }
        ]
      }
    };
    var tab = "site", busy = false, btns = [], timer = null;
    var docIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l4 4v14H7zM14 3v4h4"/></svg>';
    var handIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h14M13 6l6 6-6 6"/></svg>';
    function add(cls, text) { var m = document.createElement("div"); m.className = "msg " + cls; m.textContent = text; log.appendChild(m); log.scrollTop = log.scrollHeight; return m; }
    function proposal(rows) {
      var box = document.createElement("div"); box.className = "proposal";
      rows.forEach(function (r) { var row = document.createElement("div"); row.className = "proposal-row"; var a = document.createElement("span"); a.textContent = r[0]; var b = document.createElement("b"); b.textContent = r[1]; row.appendChild(a); row.appendChild(b); box.appendChild(row); });
      var bt = document.createElement("div"); bt.className = "proposal-btns";
      bt.innerHTML = '<span class="go">Apply</span><span>Dismiss</span>';
      box.appendChild(bt);
      timer = setTimeout(function () { bt.innerHTML = '<span class="done">Applied by owner</span>'; log.scrollTop = log.scrollHeight; }, reduceMotion ? 0 : 1600);
      return box;
    }
    function ask(item, btn) {
      if (busy) return; busy = true; btn.disabled = true; reset.hidden = false;
      add("msg-user", item.q);
      var reply = add("msg-bot", ""); reply.innerHTML = '<span class="typing" aria-label="Assistant is typing"><i></i><i></i><i></i></span>';
      timer = setTimeout(function () {
        reply.textContent = item.a;
        if (item.change) reply.appendChild(proposal(item.change));
        else {
          var src = document.createElement("div"); src.className = "msg-src" + (item.handoff ? " is-handoff" : "");
          src.innerHTML = item.handoff ? handIcon : docIcon;
          var sp = document.createElement("span"); sp.textContent = item.handoff ? (item.handoffText || "Not in the approved information. Handed to a person.") : "Source: " + item.src;
          src.appendChild(sp); reply.appendChild(src);
        }
        log.scrollTop = log.scrollHeight; busy = false;
      }, reduceMotion ? 0 : 900);
    }
    function load(t) {
      tab = t; clearTimeout(timer); busy = false;
      $$("[data-chat-tab]").forEach(function (b) { var on = b.dataset.chatTab === t; b.classList.toggle("is-active", on); b.setAttribute("aria-selected", String(on)); });
      log.textContent = ""; list.textContent = ""; reset.hidden = true;
      if (meta) meta.textContent = SETS[t].meta;
      add("msg-bot", SETS[t].hello);
      btns = SETS[t].qa.map(function (item) {
        var b = document.createElement("button"); b.type = "button"; b.className = "suggest"; b.textContent = item.q;
        b.addEventListener("click", function () { ask(item, b); }); list.appendChild(b); return b;
      });
    }
    $$("[data-chat-tab]").forEach(function (b) { b.addEventListener("click", function () { if (b.dataset.chatTab !== tab) load(b.dataset.chatTab); }); });
    reset.addEventListener("click", function () { load(tab); });
    load("site");
    // play the first question once the sample scrolls into view, so it isn't sitting empty
    if (!reduceMotion && "IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) {
          io.disconnect();
          setTimeout(function () { story.whenIdle(function () { if (tab === "site" && btns[0] && !btns[0].disabled && !busy) ask(SETS.site.qa[0], btns[0]); }); }, 700);
        }
      }, { threshold: 0.6 });
      io.observe(log);
    }
  })();

  /* =====================================================================
     "UNDER DEVELOPMENT" DRAWER: opens when something links to it
     ===================================================================== */
  (function devDrawer() {
    var d = document.getElementById("in-development");
    if (!d) return;
    function check() { if (location.hash === "#in-development") d.open = true; }
    window.addEventListener("hashchange", check); check();
    $$("[data-open-dev]").forEach(function (a) { a.addEventListener("click", function () { d.open = true; }); });
  })();

  /* =====================================================================
     STORY LAYER: the page reads as one project, in Lee's own four steps
     01 discuss -> 02 define -> 03 build -> 04 deliver -> your turn.
     Everything starts finished. html.story is added last, and only the parts
     still below the fold wait to play, once each. Phones, reduced motion and
     no-JS visitors get the finished page (the CSS keeps all "before" states
     under html.story).
     ===================================================================== */
  (function storyLayer() {
    var scene = codeScene();   // the cafe mock's source view and its toggle (any desktop, motion or not)
    if (!story.on) return;
    function start() {
      reveals(); beats(); if (scene) scene.arm(); buildLog();
      document.documentElement.classList.add("story");
    }
    // after load, so a reload or a jump to #contact has already put the page where it's going
    if (document.readyState === "complete") start(); else window.addEventListener("load", start);

    // Supporting visuals (cards, app cards, screenshots) arrive once, quickly. Copy never animates.
    function reveals() {
      once($$(".card:not(.dev-card), .app-card, .shot"), function (el, already) {
        // skipped past (a fast flick or a jump): just be there, no entrance
        if (already) { el.classList.remove("reveal"); el.style.removeProperty("--i"); return; }
        el.classList.add("is-in");
        // once it has landed, hand the element back its own hover transitions
        setTimeout(function () { el.classList.remove("reveal", "is-in"); el.style.removeProperty("--i"); }, 600);
      }, { rootMargin: "0px 0px -8% 0px" }).forEach(function (el) {
        el.classList.add("reveal");
        el.style.setProperty("--i", Math.min(3, Array.prototype.indexOf.call(el.parentNode.children, el)));
      });
    }

    function beats() {
      // 02 define: the "+" line of the Monday report lands
      once($$(".diff"), function (el) { el.classList.add("is-in"); }, { rootMargin: "0px 0px -35% 0px" });
      // 04 deliver: each Live dot pings once
      once($$(".status-live"), function (el, already) {
        if (already) return;
        var k = $$(".status-live").indexOf(el);
        setTimeout(function () { el.classList.add("is-in"); }, Math.max(0, k) * 150);
      }, { threshold: 1 });
      // About: the four step rules draw in, like checks passing
      $$("#about .step").forEach(function (el, i) { el.style.setProperty("--i", i); });
      once($$("#about .steps"), function (el) { el.classList.add("is-in"); }, { threshold: 0.5 });
      // your turn: the cursor after "fits." blinks three times
      once($$("#contact .caret-end"), function (el, already) { if (!already) el.classList.add("is-in"); }, { rootMargin: "0px 0px -35% 0px" });
    }

    // A quiet git log in the left margin (wide screens): one commit per chapter, current one named.
    function buildLog() {
      if (!window.matchMedia("(min-width: 1440px)").matches) return;
      var chapters = [["#top", "0"], [".mission", "1"], ["#work-together", "2"], ["#tools", "2"], ["#build", "3"], ["#assistants", "3"],
                      ["#applications", "4"], ["#partnership", "4"], ["#about", "done"], ["#contact", "5"]];
      var log = document.createElement("div"); log.className = "buildlog"; log.setAttribute("aria-hidden", "true");
      var ol = document.createElement("ol");
      var nodes = ["01 discuss", "02 define", "03 build", "04 deliver", "your turn"].map(function (name, i) {
        var li = document.createElement("li"); li.style.setProperty("--n", i); if (i === 4) li.className = "turn";
        var label = document.createElement("span"); label.textContent = name; li.appendChild(label); ol.appendChild(li); return li;
      });
      log.appendChild(ol); document.body.appendChild(log);
      function set(phase) {
        // "done" (About): all four steps are complete and the steps list there takes over the naming
        var cur = phase === "done" ? -1 : +phase - 1, reached = phase === "done" ? 4 : +phase - 1;
        log.dataset.phase = phase;
        nodes.forEach(function (li, i) { li.classList.toggle("is-current", i === cur); li.classList.toggle("is-done", i < reached && i !== cur); });
        log.style.setProperty("--fill", String(Math.max(0, Math.min(4, phase === "done" ? 3 : reached)) / 4));
      }
      // a thin band 45% down the screen: whichever chapter crosses it is the one you're reading
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) set(e.target.dataset.chapter); });
      }, { rootMargin: "-45% 0px -54% 0px" });
      chapters.forEach(function (c) { var el = $(c[0]); if (el) { el.dataset.chapter = c[1]; io.observe(el); } });
    }
  })();

  // 03 build: the Harbor Cafe mock shows its own source, then the code becomes the site.
  // The toggle lets the reader flip between them any time (desktop only; phones keep the plain mock).
  function codeScene() {
    var browser = $("#build .browser"), toggle = $("#build .code-toggle"), pill = $("#build [data-pill]");
    if (!browser || !toggle || !window.matchMedia("(min-width: 961px)").matches) return null;
    // built only from the mock's own copy: tag, attribute, string, plain text
    var LINES = [
      [["tg", "<nav>"], ["", "Harbor Café · Menu · Catering · Visit"], ["tg", "</nav>"]],
      [["tg", "<p "], ["at", "class"], ["tg", "="], ["st", "\"kicker\""], ["tg", ">"], ["", "Open daily · 7am to 3pm"], ["tg", "</p>"]],
      [["tg", "<h1>"], ["", "Fresh bread and good coffee,"]],
      [["", "    right on the harbor."], ["tg", "</h1>"]],
      [["tg", "<a "], ["at", "class"], ["tg", "="], ["st", "\"btn\""], ["tg", ">"], ["", "Order ahead"], ["tg", "</a> <a>"], ["", "Book a table"], ["tg", "</a>"]],
      [["tg", "<article>"], ["", "Breakfast · Served until 11"], ["tg", "</article>"]],
      [["tg", "<article>"], ["", "Catering · Groups of 10+"], ["tg", "</article>"]],
      [["tg", "<article>"], ["", "Find us · 14 Pier Street"], ["tg", "</article>"]],
      [["tg", "<chat-bot "], ["at", "greeting"], ["tg", "="], ["st", "\"Hi! Ask me about hours,"]],
      [["st", "          the menu, or catering.\""], ["tg", "></chat-bot>"]]
    ];
    var fig = document.createElement("figure"); fig.className = "src"; fig.setAttribute("aria-label", "Sample HTML for the Harbor Café site");
    var pre = document.createElement("pre");
    LINES.forEach(function (line, i) {
      var ln = document.createElement("span"); ln.className = "ln";
      var lc = document.createElement("span"); lc.className = "lc"; lc.style.setProperty("--i", i);
      line.forEach(function (tok) { var t = document.createElement("span"); if (tok[0]) t.className = tok[0]; t.textContent = tok[1]; lc.appendChild(t); });
      ln.appendChild(lc); pre.appendChild(ln);
    });
    fig.appendChild(pre); browser.appendChild(fig);

    var siteName = pill ? pill.textContent : "", timers = [], running = false;
    function label(code) { if (pill) pill.textContent = code ? "index.html" : siteName; }
    function stop() { timers.forEach(clearTimeout); timers = []; if (running) { running = false; story.idle(); } }
    function show(code) {   // the reader's choice: jumps straight to that view
      stop();
      browser.classList.remove("armed", "site-off", "chat-off");
      browser.classList.add("coding");
      browser.classList.toggle("src-on", code);
      toggle.setAttribute("aria-pressed", String(code));
      label(code);
    }
    toggle.hidden = false;
    toggle.addEventListener("click", function () { show(toggle.getAttribute("aria-pressed") !== "true"); });
    document.addEventListener("visibilitychange", function () { if (document.hidden && running) show(false); });

    function at(ms, fn) { timers.push(setTimeout(fn, ms)); }
    function play() {   // about 1.5 seconds, once: ten lines arrive, a short hold, then the site takes their place
      running = true; story.busy = true;
      browser.classList.add("coding");
      var built = LINES.length * 60 + 180 + 250;
      at(built, function () { browser.classList.remove("src-on", "site-off"); label(false); });
      at(built + 150, function () { browser.classList.remove("chat-off"); });
      at(built + 420, function () { browser.classList.remove("armed"); running = false; story.idle(); });
    }
    return {
      arm: function () {
        // skipped past or already on screen: show the finished site
        once([browser], function (el, already) { if (already) show(false); else play(); }, { threshold: 0.6 }).forEach(function () {
          // still below the fold: wait as an empty editor
          browser.classList.add("armed", "src-on", "site-off", "chat-off"); label(true);
        });
      }
    };
  }

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
      var interest = f.interest ? f.interest.value : "";
      if (interest) lines.push("Interested in: " + interest);
      if (call) lines.push("Best days and times: " + times, "Format: " + f.format.value);
      if (msg) lines.push("", msg);
      var mailto = "mailto:" + CONTACT_EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(lines.join("\n"));

      submitBtn.classList.add("is-loading"); statusEl.textContent = ""; statusEl.className = "form-status";

      // Sent through FormSubmit (free), which delivers the message straight to CONTACT_EMAIL.
      var payload = {
        _subject: subject, _template: "table", _replyto: email,
        Type: call ? "Call request" : "Message", Name: name, Email: email, Business: biz || "-", "Interested in": interest || "-"
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
          document.documentElement.setAttribute("data-sent", "1");
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

  /* ---------- "Ask about it" links: pre-fill the contact form ---------- */
  $$("[data-ask]").forEach(function (el) {
    el.addEventListener("click", function () {
      if (!form) return;
      var topic = el.getAttribute("data-ask"), sel = form.elements.interest, msg = form.elements.message;
      setContactMode("question");
      var map = { "Quote Builder": "An app under development", "Instructions Database": "An app under development", "Catering & Order Management": "An app under development", "A website or custom app": "A custom web app", "A single feature or small tool": "A small tool" };
      if (sel) { var want = map[topic] || (/Tailoring/.test(topic) ? "Not sure yet" : topic); Array.prototype.forEach.call(sel.options, function (o) { if (o.text === want) sel.value = o.value; }); }
      if (msg && !msg.value.trim()) msg.value = /^(Quote|Instructions|Catering)/.test(topic) ? "I'd like to hear more about " + topic + "." : /Tailoring/.test(topic) ? "I'd like a version of one of your apps tailored to my business." : "";
      setTimeout(function () { var n = form.elements.name; if (n) n.focus({ preventScroll: true }); }, 600);
    });
  });

  /* ---------- Show the contact email wherever it's listed ---------- */
  $$("[data-email]").forEach(function (a) { a.href = "mailto:" + CONTACT_EMAIL; a.textContent = CONTACT_EMAIL; });

  /* ---------- Footer year ---------- */
  var yr = $("[data-year]"); if (yr) yr.textContent = new Date().getFullYear();
})();
