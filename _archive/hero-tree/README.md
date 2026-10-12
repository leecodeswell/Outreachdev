# Archived: hero tree animation

The animated "scattered information → your software → results" tree that used to sit
under the homepage headline (a gold gyroscope core, branches, leaves, light pulses).
It was removed from the live site in October 2026 and kept here in case it's wanted again.

This folder is **not published**. GitHub Pages builds the site with Jekyll, and Jekyll
skips any folder whose name starts with `_`, so nothing in `_archive/` goes online.

## Files

- `demo.html`: a standalone page that runs the animation. Open it from a local server at
  the repo root (for example `python -m http.server`, then visit
  `http://localhost:8000/_archive/hero-tree/demo.html`). It borrows the site's `style.css`
  for colors and fonts.
- `hero-tree.css`: all of the tree's styles (layout, leaves, the core's halo, responsive rules).
- `hero-tree.js`: the whole animation, self-contained.

## Putting it back on the homepage

1. Copy the `<div class="flow ...">` block from `demo.html` into `index.html`, inside the
   hero's `.container`, right after `.hero-copy`.
2. Paste `hero-tree.css` into `style.css` (or link it after `style.css`).
3. Paste the contents of `hero-tree.js` into `script.js`, or add
   `<script src="hero-tree.js"></script>` after `script.js`.

The last live version is in git history at commit `124a2c3`.
