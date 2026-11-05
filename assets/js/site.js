/* Pari — small, dependency-free behaviour. */
(function () {
  "use strict";

  // ---- Config: fill these in once the accounts exist (see docs/MORNING-README.md)
  var CONFIG = {
    formEndpoint: "",                 // e.g. "https://formspree.io/f/xxxxxxx". Empty = mailto fallback.
    email: "hello@outreachdev.dev",   // must match the address in the HTML
    phone: "+16415960111"
  };

  // ---- Mobile nav
  var toggle = document.querySelector(".nav-toggle");
  var mobile = document.getElementById("mobile-nav");
  if (toggle && mobile) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      mobile.setAttribute("data-open", String(!open));
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        toggle.setAttribute("aria-expanded", "false");
        mobile.setAttribute("data-open", "false");
        toggle.focus();
      }
    });
  }

  // ---- Reveal on scroll (progressive; content is visible without JS/IO)
  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && items.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.1 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("in"); });
  }

  // ---- Contact form
  var form = document.getElementById("contact-form");
  if (form) {
    var status = document.getElementById("form-status");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.querySelector('[name="company_website_url"]').value) return; // honeypot
      var data = new FormData(form);
      var name = (data.get("name") || "").toString().trim();
      var company = (data.get("company") || "").toString().trim();
      var need = (data.get("need") || "").toString();
      var industry = (data.get("industry") || "").toString();
      var phone = (data.get("phone") || "").toString().trim();
      var email = (data.get("email") || "").toString().trim();
      var msg = (data.get("message") || "").toString().trim();

      if (!name || !email || !company) {
        status.textContent = "Please add your name, business name and email.";
        return;
      }

      if (CONFIG.formEndpoint) {
        status.textContent = "Sending…";
        fetch(CONFIG.formEndpoint, { method: "POST", headers: { "Accept": "application/json" }, body: data })
          .then(function (r) {
            if (r.ok) { form.reset(); status.textContent = "Got it. Lee will reply within one business day."; }
            else { throw new Error("bad status"); }
          })
          .catch(function () { mailtoFallback(); });
      } else {
        mailtoFallback();
      }

      function mailtoFallback() {
        var subject = "Call request from " + company;
        var body = [
          "Name: " + name, "Business: " + company, "Interested in: " + need, "Industry: " + industry,
          "Phone: " + phone, "Email: " + email, "", msg
        ].join("\n");
        window.location.href = "mailto:" + CONFIG.email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
        status.textContent = "Opening your email app. If nothing happens, email " + CONFIG.email + " directly.";
      }
    });
  }

  // ---- Footer year
  var y = document.getElementById("year");
  if (y) y.textContent = String(new Date().getFullYear());
})();
