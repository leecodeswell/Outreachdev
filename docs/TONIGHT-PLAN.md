# Overnight build plan — Nov 4–5, 2026

Written before starting, as the ordered task queue for the night. Each block is one self-contained
prompt I run in sequence. Nothing is pushed to GitHub; the draft is reviewed in the morning.

## Decisions carried in from Lee
- Brand word "Pari" appears only in page titles / meta and as the small wordmark top-left of the nav.
  It is not a marketing hook anywhere in the copy.
- Domain stays outreachdev.dev (GitHub Pages, CNAME kept).
- Audience: contractors and home-service businesses, skewing to higher-ticket trades
  (custom builders, remodelers, roofing, HVAC, landscaping, concrete, electrical).
- Marketing channels Lee will run: social, cold calls, email. Site's job: trust + Google/AI visibility.
- Aesthetic: glassmorphism + matte glass panels, cream/off-white base, royal blue accents.
  Five licensed photos (Dolomite peaks, fog peak, mirrored volcano, glass blobs, limestone wall)
  used as backgrounds and section art, some re-rendered as royal-blue sketch/duotone concept art.
- Keep the ten redirect stubs (QR codes) untouched. New legal pages get new file names.
- Contact email + Google Business Profile are created tomorrow: leave clearly marked placeholders.

## Task queue
1. **Tooling + images.** Copy the five photos into assets/img/src. Produce web-sized WebP variants
   (1600 / 1000 / 600 wide) and a royal-blue duotone/sketch version of each. Pick which role each
   image plays (hero, section backdrops, card art).
2. **Pattern research (fast).** Look at the websites of the largest contractor lead-gen players
   (Angi/HomeAdvisor, Thumbtack, Networx, CraftJack, Modernize, Porch, Houzz Pro) and 6–8 smaller
   contractor marketing agencies. Record shared page structure, hero copy patterns, trust signals,
   CTAs, and what the pricing/model pages look like. Feed this into the site IA before building.
3. **Keyword + AI visibility research.** Query clusters contractors use when looking for lead
   sources and marketing help; what Google and answer engines return; which schema and content
   formats get cited. Output docs/keyword-research.md plus the FAQ content for the site.
4. **Build the site.** Static HTML/CSS, no framework, no build step. Pages:
   /, /services/, /industries/, /about/, /contact/, /faq/, /privacy-policy/, /terms-of-service/,
   404.html. Shared nav/footer, glass design system in one stylesheet, tiny JS for nav and form.
   SEO layer: titles, descriptions, canonicals, OG/Twitter, robots.txt, sitemap.xml, llms.txt,
   JSON-LD (Organization, LocalBusiness/ProfessionalService, WebSite, FAQPage, BreadcrumbList,
   Service), favicon set, preload of hero image, lazy loading elsewhere.
5. **Deliverability + outreach playbook.** docs/outreach-deliverability-plan.md: email
   infrastructure (separate sending domain, Workspace, SPF/DKIM/DMARC, warm-up, caps), cold calling
   rules (TCPA, DNC, state rules for Iowa/Minnesota/Nebraska), social outreach limits per platform,
   reputation safeguards, daily operating checklist.
6. **Agency research report.** docs/research-lead-gen-agencies.md: business models, pricing,
   marketing at each size, website style patterns, starting from scratch in 2026, and the
   recommended model for Pari.
7. **Review + revise.** Open the site locally in the browser, check mobile and desktop, run an
   HTML validity pass, check contrast, check Lighthouse-style basics (image sizes, lazy load,
   no layout shift), fix copy. Second pass on creative details.
8. **Deliver.** Publish the homepage draft as an artifact, commit locally with clear messages,
   write docs/MORNING-README.md listing what to review, what needs real values, and the exact
   "push" step.

## Morning (with Lee)
- Create email, Google Business Profile, Analytics, Search Console, socials.
- Drop real values into assets/site-config (email, GBP link, GA tag, social URLs).
- Push; submit sitemap; verify Search Console; IndexNow ping.
