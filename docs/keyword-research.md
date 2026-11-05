# Keyword and AI-visibility plan for outreachdev.dev

Prepared November 5, 2026. Search volumes were not pulled from a paid tool tonight; the clusters
below come from competitor page titles, Google autocomplete patterns, vendor keyword lists and the
language contractors use in forums. Tomorrow, confirm volumes in Google Keyword Planner (free with
the Ads account) and watch Search Console for the queries that actually appear.

## 1. Who searches, and what they type

Two very different searchers land on a contractor-marketing site:

1. **Contractors looking for help** (the buyer). Queries are "lead generation for contractors",
   "roofing leads", "exclusive roofing leads", "marketing company for contractors", "how to get
   more remodeling jobs", "best way to get construction leads", "Angi alternative for contractors".
2. **Homeowners looking for a contractor** (the client's buyer). "roofing contractors Mason City",
   "custom home builder near me", "kitchen remodel contractor Des Moines". These belong on the
   *clients'* websites, not on outreachdev.dev, but they are the terms Pari sells visibility for, so
   the site should speak about them fluently.

The site targets group 1 and demonstrates competence on group 2.

## 2. Keyword clusters mapped to pages

| Cluster (buyer intent) | Example queries | Page | Status |
| --- | --- | --- | --- |
| Core service | lead generation for contractors; contractor lead generation company; exclusive contractor leads | `/` and `/services/#lead-generation` | built |
| Marketplace alternatives | Angi alternative; HomeAdvisor alternative for contractors; are Thumbtack leads worth it; shared leads vs exclusive leads | `/` comparison block, `/faq/` | built; a dedicated article later |
| Trade + leads | roofing leads; exclusive roofing leads; HVAC leads; remodeling leads; custom home builder leads; landscaping leads; concrete leads | `/industries/#roofing` etc. | built as anchors; promote to standalone pages when there is a case study each |
| Trade + marketing | roofing marketing agency; HVAC marketing company; remodeler marketing; marketing for home builders; contractor SEO | `/services/#websites`, `/industries/` | built |
| Websites | contractor website design; website for roofing company; home builder website design | `/services/#websites` | built |
| Local SEO / GBP | Google Business Profile for contractors; local SEO for contractors; how to rank in Google Maps contractor | `/services/#websites`, future article | partial |
| Geography | lead generation Iowa; marketing agency Clear Lake Iowa; Mason City marketing; Des Moines contractor marketing; Minneapolis contractor leads; Omaha roofing leads | footer, schema `areaServed`, future city pages | partial |
| How-to (informational) | how to get more roofing jobs; how to get construction leads; how to get remodeling clients; cost per lead roofing | future `/guides/` articles | not yet |
| Pricing | how much does contractor lead generation cost; lead generation pricing for contractors | `/services/#pricing`, `/faq/` | built without numbers |

Titles and descriptions on every page already carry the core cluster. Each H1 is a benefit statement
with the trade words in the H2s and body, which matches how the competitors that rank are written.

## 3. Content to add over the first 90 days (in order)

1. **Guide: "Exclusive leads vs shared leads: what contractors need to know"** (targets the
   marketplace-alternative cluster; links to `/services/`). 1,200 words, answer-first opening.
2. **Guide: "How to get more roofing jobs without buying marketplace leads"**, then the same shape
   for remodeling and custom homes. These are the highest-intent informational queries.
3. **Trade pages** promoted from anchors to their own URLs (`/roofing-leads/`,
   `/remodeling-leads/`, `/home-builder-leads/`) once there is one real example per trade.
4. **City pages** for the markets Lee is actually selling into (Mason City, Des Moines, Cedar
   Rapids, Rochester MN, Minneapolis, Omaha), each with local specifics, not boilerplate. Only build
   these for markets with real activity; thin city pages are a known way to get ignored.
5. **Case studies** at day 30 and day 90 with a client, with a number.
6. **"Cost of contractor lead generation in 2026"** once pricing is set.

## 4. AI visibility (AI Overviews, AI Mode, ChatGPT, Perplexity)

Google's own guidance (Search Central, "AI features and your website", 2026): no special markup,
no llms.txt requirement, no chunking tricks; the same fundamentals that rank in classic search get
cited in AI answers. Google explicitly lists over-indexing on structured data for AI, llms.txt and
"chunking" as things not worth doing. ChatGPT search draws on Bing's index, so Bing Webmaster Tools
verification matters as much as Google's.

What the site already does that helps:
- Clear, factual, answer-first paragraphs ("Yes. We sign one contractor per trade…").
- FAQPage, Organization/ProfessionalService, Person, Service, BreadcrumbList and ContactPage schema
  that mirrors visible text exactly.
- Consistent name, address, phone on every page and in schema.
- `llms.txt` published anyway because it costs nothing and some smaller assistants read it.
- Fast, static, crawlable HTML with no JS-dependent content.

Tomorrow:
- **Google Business Profile** with the primary category "Marketing agency" (secondary: "Internet
  marketing service", "Advertising agency"), address hidden, service areas set to the Iowa, Minnesota
  and Nebraska metros, services listed, hours, the business description from the homepage, photos,
  and the website link. Address hidden is the correct setting for a home-based business.
- **Search Console**: verify `outreachdev.dev` as a Domain property (DNS TXT), submit
  `sitemap.xml`, request indexing of each URL, check the old URLs still 301/redirect correctly.
- **Bing Webmaster Tools**: import from Search Console, submit the sitemap, enable IndexNow with a
  new key (replace the old key file; the previous key was tied to the Ares Web Services site).
- **Analytics**: GA4 property, tag added to `src/layout.html` once created.
- **Mentions**: get listed on 3 to 5 directories AI engines draw from: Clutch, DesignRush, Google
  Business Profile, Bing Places, the Iowa Secretary of State record under the trade name, local
  Chamber of Commerce. These third-party mentions are the biggest lever for being named in "best
  contractor marketing agency in Iowa" answers.
- **Test prompts monthly**: "best lead generation company for roofers in Iowa", "exclusive leads
  for home builders Minnesota", "Angi alternative for contractors" in Google AI Mode, ChatGPT and
  Perplexity. Record who gets named.

## 5. On-page checklist already applied
- Unique title (under 60 characters where possible) and meta description per page.
- One H1 per page; H2s carry the trade and service terms.
- Canonical on every page; `index, follow, max-image-preview:large`; 404 is `noindex`.
- Open Graph and Twitter card with a 1200x630 image.
- Sitemap with priorities and lastmod; robots.txt excludes `/src/`, `/tools/`, `/docs/`.
- Images: WebP, explicit width/height (no layout shift), lazy below the fold, hero preloaded.
- Fonts: preconnect, `display=swap`.
- All content server-rendered static HTML; JS only for the menu, form and reveal animation.

## 6. Sources
- Google Search Central, AI features and your website: https://developers.google.com/search/docs/appearance/ai-features
- Google Business Profile address and service-area guidance (Whitespark): https://whitespark.ca/blog/should-service-area-businesses-show-or-hide-their-address-for-local-seo/
- Roofing keyword lists: https://www.jobnimbus.com/blog/150-roofing-keywords-for-seo-amp-ppc, https://comradeweb.com/blog/roofing-seo-how-to-climb-search-engines/
- Construction keyword mapping: https://diakachimba.agency/blog/construction-seo-keywords/
- AI citation practice for local businesses: https://cited.so/blog/how-to-get-your-local-business-cited-by-ai-search
