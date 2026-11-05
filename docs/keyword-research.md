# Keyword and AI-visibility plan for outreachdev.dev

Prepared November 5, 2026. Search volumes were not pulled from a paid tool tonight; the clusters
below come from competitor page titles, Google autocomplete patterns, vendor keyword lists and the
language contractors use in forums. Tomorrow, confirm volumes in Google Keyword Planner (free with
the Ads account) and watch Search Console for the queries that actually appear.

## 1. Who searches, and what they type

Revised November 5, 2026: the site now speaks to businesses in general, not contractors only, and is
organized around two services, lead generation and marketing.

1. **Owners and sales leads who need more customers** (the buyer). Queries are "lead generation
   company", "verified B2B leads", "buy verified leads", "lead research service", "appointment
   setting service", "outsourced prospecting", "how to find new clients for my business".
2. **Owners who need marketing help.** "social media management for small business", "cold email
   agency", "cold email deliverability", "Google Ads management small business", "small business
   website design", "local SEO services", "how to show up in ChatGPT answers".

## 2. Keyword clusters mapped to pages

| Cluster (buyer intent) | Example queries | Page | Status |
| --- | --- | --- | --- |
| Core lead gen | lead generation company; verified leads; B2B lead generation; lead research service | `/`, `/lead-generation/` | built |
| Lead quality | verified email leads; how to verify B2B leads; contact data decay; bad lead lists | `/lead-generation/#what-you-get`, `/faq/` | built |
| Social media | social media management for small business; social media manager for local business | `/marketing/#social-media` | built |
| Outreach | cold email agency; cold email without spam; email deliverability service; cold calling service | `/marketing/#outreach`, `/faq/` | built |
| Ads | Google Ads management small business; Facebook ads agency small business | `/marketing/#ads` | built |
| Sales | speed to lead; sales follow-up system; appointment setting | `/marketing/#sales` | built |
| Websites & SEO | small business website design; local SEO services; AI search visibility; GEO | `/marketing/#websites-seo` | built |
| Pricing | lead generation pricing; how much does lead generation cost | `/lead-generation/#pricing`, `/faq/` | built without numbers |
| Geography | marketing agency Clear Lake Iowa; lead generation Iowa; Mason City marketing | footer, schema address | partial |
| Industry + leads | dental practice leads; HVAC leads; law firm marketing; manufacturing leads | future pages | not yet; build once there is a real example per industry |

## 3. Content to add over the first 90 days (in order)

1. **Guide: "What makes a lead verified (and why most lead lists fail)"**, linking to
   `/lead-generation/`. Answer-first, cite the data-decay research.
2. **Guide: "Cold email in 2026 without landing in spam"**, built from
   `docs/outreach-deliverability-plan.md`. High-intent and shows real expertise.
3. **Guide: "Speed to lead: why the first hour decides the sale"**, citing the HBR study.
4. **Industry pages** for the first two industries where Lee lands a client, each with a real,
   anonymized example.
5. **Case studies** at day 30 and day 90 with a client, with a number. These replace the
   third-party stats as the strongest proof on the site.
6. **"How much does lead generation cost in 2026"** once pricing is set.

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
