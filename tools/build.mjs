// Assembles src/pages/*.html into the static site. Run: node tools/build.mjs
// Each page starts with a JSON block:  <!--meta { ... } -->
// Optional: node tools/build.mjs --artifact <dir>  also writes a relative-path copy for previews.
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const SITE = "https://outreachdev.dev";
const layout = readFileSync(join(ROOT, "src/layout.html"), "utf8");

const artIdx = process.argv.indexOf("--artifact");
const ART = artIdx > -1 ? process.argv[artIdx + 1] : null;

const ORG = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["Organization", "ProfessionalService"],
      "@id": SITE + "/#org",
      "name": "Pari",
      "alternateName": ["Pari Lead Generation & Marketing", "Outreachdev"],
      "slogan": "Verified leads and marketing for businesses ready to grow.",
      "url": SITE + "/",
      "logo": SITE + "/assets/icons/icon-512.png",
      "image": SITE + "/assets/og-image.jpg",
      "description": "Hand-researched, verified lead generation and marketing (social media, outreach, ads, sales support, websites and SEO) for growing businesses.",
      "founder": { "@type": "Person", "@id": SITE + "/about/#lee", "name": "Lee Thompson" },
      "telephone": "+1-641-596-0111",
      "email": "hello@outreachdev.dev",
      "address": { "@type": "PostalAddress", "streetAddress": "500 Bedford St.", "addressLocality": "Clear Lake", "addressRegion": "IA", "postalCode": "50428", "addressCountry": "US" },
      "areaServed": { "@type": "Country", "name": "United States" },
      "priceRange": "$$",
      "knowsAbout": ["lead generation", "B2B lead research", "lead verification", "social media marketing", "cold email deliverability", "Google Ads", "Meta ads", "sales follow-up", "web design", "search engine optimization", "AI search visibility"],
      // TODO morning: add Google Business Profile URL, LinkedIn, Facebook, Instagram, YouTube once created
      "sameAs": []
    },
    {
      "@type": "WebSite",
      "@id": SITE + "/#website",
      "url": SITE + "/",
      "name": "Pari",
      "publisher": { "@id": SITE + "/#org" },
      "inLanguage": "en-US"
    }
  ]
};

const pagesDir = join(ROOT, "src/pages");
const urls = [];
for (const file of readdirSync(pagesDir).filter(f => f.endsWith(".html"))) {
  const raw = readFileSync(join(pagesDir, file), "utf8");
  const m = raw.match(/^<!--meta\s*([\s\S]*?)-->/);
  if (!m) throw new Error("No meta block in " + file);
  const meta = JSON.parse(m[1]);
  const body = raw.slice(m[0].length).trim();
  const canonical = SITE + meta.path;
  let html = layout
    .replaceAll("{{title}}", esc(meta.title))
    .replaceAll("{{ogTitle}}", esc(meta.ogTitle || meta.title))
    .replaceAll("{{description}}", esc(meta.description))
    .replaceAll("{{canonical}}", canonical)
    .replace("{{robots}}", meta.noindex ? '<meta name="robots" content="noindex, follow">' : '<meta name="robots" content="index, follow, max-image-preview:large">')
    .replace("{{preload}}", meta.preload ? `<link rel="preload" as="image" href="${meta.preload}" fetchpriority="high">` : "")
    .replace("{{orgJsonLd}}", JSON.stringify(ORG))
    .replace("{{jsonld}}", (meta.jsonld || []).map(o => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join("\n"))
    .replace("{{body}}", body);
  html = html.replace(/\{\{cur:([a-z]+)\}\}/g, (_, k) => (meta.nav === k ? ' aria-current="page"' : ""));
  const relPath = meta.path.replace(/\/$/, "/index.html").replace(/^\//, "");
  const out = join(ROOT, relPath);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
  console.log("wrote", relPath);

  if (ART) {
    const depth = relPath.split("/").length - 1;
    const up = "../".repeat(depth);
    const toRel = (p) => {
      // "/" -> index.html ; "/x/" -> x/index.html ; "/x/#a" -> x/index.html#a ; "/assets/.." -> assets/..
      if (p === "/") return up + "index.html";
      const mm = p.match(/^\/([a-z0-9-]+)\/(#.*)?$/);
      if (mm) return up + mm[1] + "/index.html" + (mm[2] || "");
      return up + p.slice(1);
    };
    let rel = html
      .replace(/(href|src|action)="(\/[^"]*)"/g, (_, a, p) => `${a}="${toRel(p)}"`)
      .replace(/srcset="([^"]*)"/g, (_, v) => `srcset="${v.split(",").map(s => s.trim().replace(/^\//, up)).join(", ")}"`)
      .replace(/<link rel="canonical"[^>]*>\n?/, "")
      .replace(/<link rel="manifest"[^>]*>\n?/, "");
    const outA = join(ART, relPath);
    mkdirSync(dirname(outA), { recursive: true });
    writeFileSync(outA, rel);
  }

  if (!meta.noindex) urls.push({ loc: canonical, priority: meta.priority ?? "0.7", changefreq: meta.changefreq ?? "monthly" });
}

const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u.loc}</loc><lastmod>${today}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`).join("\n")}
</urlset>
`;
writeFileSync(join(ROOT, "sitemap.xml"), sitemap);
console.log("wrote sitemap.xml with", urls.length, "urls");

function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;"); }
