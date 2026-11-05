# outreachdev.dev

This repo is being rebuilt as the Outreachdev lead-generation site. The previous site and its apps
moved to **https://ares-web.com/services** (rebranded Ares Web Services; source in the
`leecodeswell/portfoliov1` repo under `hub/services`). Its full history is still in this repo's git log.

## Replace this first

`index.html` is a temporary placeholder that forwards to ares-web.com/services. Replace it with the
new homepage.

## Keep these paths

These redirect pages forward old links, bookmarks and printed Work Order Manager QR codes
(`outreachdev.dev/work-orders/#wo/<number>`) to the apps' new home. Build the new site around them;
don't reuse or delete them:

- `scheduling-agent/index.html`, `work-orders/index.html`
- `scheduling-agent.html`, `work-order-manager.html`, `spreadsheet-to-app.html`,
  `work-instructions.html`, `quote-builder.html`, `privacy.html`, `terms.html`, `accessibility.html`

The new site's own privacy policy and terms need different file names (or update the redirects).

Also keep `CNAME`: it holds the custom domain outreachdev.dev for GitHub Pages.
