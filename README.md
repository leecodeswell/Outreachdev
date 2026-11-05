# outreachdev.dev — Pari

Lead-generation and marketing site for contractors, run by Lee Thompson. Static HTML on GitHub
Pages (custom domain in `CNAME`).

## Editing

- Page content: `src/pages/*.html` (JSON meta block at the top of each file).
- Shared head, nav and footer: `src/layout.html`. Organization schema: `tools/build.mjs`.
- Styles: `assets/css/site.css`. Behaviour (menu, form, reveal): `assets/js/site.js`.
- Images: `assets/img/` (WebP renders), originals in `assets/img/src/`.

Rebuild after any change, then commit the generated files:

```bash
node tools/build.mjs
```

The build writes the page HTML into the repo root, plus `sitemap.xml`. Pages has no build step.

Local preview:

```bash
python -m http.server 8787
```

## Keep these paths

These redirect pages forward old links, bookmarks and printed Work Order Manager QR codes
(`outreachdev.dev/work-orders/#wo/<number>`) to the apps' new home at ares-web.com/services.
Don't reuse or delete them:

- `scheduling-agent/index.html`, `work-orders/index.html`
- `scheduling-agent.html`, `work-order-manager.html`, `spreadsheet-to-app.html`,
  `work-instructions.html`, `quote-builder.html`, `privacy.html`, `terms.html`, `accessibility.html`

The new site's legal pages live at `/privacy-policy/` and `/terms-of-service/` for that reason.

## Docs

See `docs/MORNING-README.md` for the launch checklist, and the research and outreach plans
alongside it.
