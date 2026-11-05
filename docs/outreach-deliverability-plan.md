# Outreach without getting flagged: the operating plan

Prepared November 5, 2026 for Lee Thompson / Pari. This is the playbook for cold email, cold calls and
social outreach to contractors, written so that the new accounts stay clean. It draws on Google's
published sender guidelines, the FCC/FTC rules, and the consensus of deliverability practitioners;
where sources disagree the conservative number is used. It is not legal advice. Verify the state
telemarketing points with the Iowa AG, Minnesota Department of Commerce and Nebraska PSC pages
before the first calling day.

## 0. Why the last agency's accounts got flagged

The October campaigns had every risk factor stacked at once:

1. Sending cold pitches from **free @gmail.com accounts**. Gmail treats consumer accounts sending
   unsolicited B2B mail as the textbook spam pattern, and there is no domain reputation to earn.
2. **Long, link-heavy pitches** going out to strangers who had never heard of the sender.
3. **Bursts** (ten an hour on a fixed schedule) rather than a slow, human-looking cadence.
4. **Two accounts hitting the same prospects** without a shared suppression list.
5. Automation clicking Send, so there was no per-message judgment and the "sending pattern" looked
   like a bot.
6. Replies and bounces never fed back into the list.

Everything below is designed to remove those factors. The short version: **cold email goes out from
a separate, warmed, authenticated domain, in small daily volumes, as short personal notes; the
primary domain outreachdev.dev is reserved for the website, Google Business Profile and replies.**

## 1. Email infrastructure (set up tomorrow, send in 3 to 4 weeks)

### 1.1 Domains
- **Primary domain: outreachdev.dev.** Used for the website, the Google Business Profile email,
  signatures, invoices and replying to inbound. It never sends cold mail. Its reputation is the
  business's reputation.
- **Buy one or two "sending" domains** that look like the brand but are expendable, for example
  `parileads.com` (unregistered as of tonight), `pari-marketing.com`, `hellopari.com`. Register
  for two years, set them to redirect (HTTP 301) to outreachdev.dev so a curious prospect lands on
  the real site.
- Never send cold mail from a brand-new domain in week one. Domain age matters; the warm-up
  schedule below covers it.

### 1.2 Mailboxes
- **Google Workspace** (Business Starter is enough) on the sending domain, 2 mailboxes:
  `lee@parileads.com` and `hello@parileads.com`. Workspace, not free Gmail: it has a domain, DKIM
  signing, Postmaster Tools, and far higher trust.
- Add a Workspace mailbox on the primary domain too: `hello@outreachdev.dev` (already referenced on
  the site) and `lee@outreachdev.dev`. These answer inbound and send proposals.
- Set real names and a photo on every mailbox. Fill out the signature: name, Pari, phone, the
  outreachdev.dev link, Clear Lake IA.

### 1.3 DNS, authentication, and the records Google checks
For **every** domain that sends (sending domains and the primary):
- **SPF**: `v=spf1 include:_spf.google.com ~all`
- **DKIM**: generate a 2048-bit key in the Workspace admin, publish the TXT record, turn signing on.
- **DMARC**: start at `v=DMARC1; p=none; rua=mailto:dmarc@outreachdev.dev; adkim=r; aspf=r`.
  After 2 to 4 weeks of clean reports move to `p=quarantine`, later `p=reject` on the primary domain.
- **MX** records from Workspace; valid **forward and reverse DNS** is automatic with Workspace.
- **Google Postmaster Tools**: add each domain and watch spam rate, domain reputation and
  authentication daily during the first two months. Google's hard line is 0.3% spam rate; the
  guidance target is **under 0.1%**.
- Enable **2-step verification** on every account. A compromised mailbox is the fastest way to a
  domain-wide block.

### 1.4 Warm-up schedule (per mailbox)
Use a reputable warm-up service (Instantly, Smartlead, Lemwarm, Mailreach or Warmup Inbox) that
exchanges real conversational mail between seed inboxes, plus manual human mail.

| Week | Warm-up service sends/day | Manual real emails/day | Cold emails/day |
| --- | --- | --- | --- |
| 1 | 5 to 10 | 3 to 5 (friends, your other accounts, replies) | 0 |
| 2 | 15 to 20 | 5 | 0 |
| 3 | 25 to 30 | 5 | 5 to 8 |
| 4 | 30 to 40 | 5 | 10 to 15 |
| 5+ | keep 10 to 15 running in the background | as needed | **25 to 30 max** |

Hard caps once warm: **30 cold emails per mailbox per day, 60 total across two mailboxes, never
more than ~120 per domain per week in month two.** Volume can grow in month three if spam rate is
under 0.1% and reply rate is healthy. Scaling further means more domains and mailboxes, not more
volume per mailbox.

Spread sends between 8:30 a.m. and 4:30 p.m. recipient time, Tuesday to Thursday preferred, with
random gaps of several minutes. No sends on holidays or weekends.

### 1.5 List hygiene before any send
- Every address is **verified** with a bulk verification service (NeverBounce, ZeroBounce,
  MillionVerifier). Remove invalid, catch-all-risky and role addresses (`info@` is acceptable for
  very small shops, but prefer a person).
- Target **bounce rate under 2%**. Two hard bounces in a day pauses the campaign until the list is
  rechecked.
- One **shared suppression list** (a spreadsheet is fine) across every mailbox and account: anyone
  contacted in the last 90 days, anyone who replied "no", anyone who unsubscribed, the entire
  domain of any company that complained. Check it before every batch.
- Source prospects by hand from Google Maps, the Iowa/MN/NE contractor registries, Houzz, BBB and
  association directories. **No purchased lists.** Purchased lists are where spam traps live.

### 1.6 What a cold email looks like now
- **Plain text**, no HTML template, no images, no tracking pixel, no link shortener.
- **Under 120 words.** The October drafts were essays; the manifesto goes in a follow-up or a call.
- **One link at most**, and not in the first email of a sequence. The first email should be
  answerable with a one-word reply.
- Subject line: lowercase, specific, 3 to 6 words, never "free", "guarantee", "100%", all-caps or
  emojis. Good: `question about your Mason City jobs`, `your roofing site`, `one contractor per market`.
- The **observation** about their business is still the heart of the message, exactly as the
  October handoff described, just in two sentences instead of five.
- A **real signature** with phone, business name and a postal address (CAN-SPAM requires the
  address and an opt-out method).
- An opt-out line that is human: `If this isn't useful, reply "no thanks" and I won't write again.`
  Reply-to-opt-out is compliant under CAN-SPAM for B2B. Google's one-click `List-Unsubscribe`
  header requirement applies to bulk senders (5,000+/day to Gmail); at this volume it does not, but
  a reply opt-out must be honored within 10 business days (do it the same day).
- Sequence: email 1, wait 4 business days, email 2 (shorter, with the one link), wait 6 days,
  email 3 (close the loop: "I'll assume the timing's off"). Three touches maximum, then
  suppression for 90 days.
- Send from the **person**, as a person. "Lee" not "Pari Team".
- **No AI-generated mass personalization.** Lee writes or edits every observation. The handoff
  doc's research-first approach is the right one; it is also what keeps complaint rates near zero.

### 1.7 Monitoring and stop rules
Daily during the first 60 days:
- Postmaster Tools: spam rate, domain reputation (must stay "High" or "Medium"), auth pass rates.
- Reply rate: healthy cold B2B is 3% to 8% with this level of personalization. Under 1% after 100
  sends means the list or the message is wrong; stop and fix rather than add volume.
- Bounce rate under 2%. Complaint rate: any complaint at all is a review trigger.
- Seed test: send one copy of the day's message to a personal Gmail, an Outlook and a Yahoo address
  and confirm Inbox placement before the batch goes. (The October captainleea tests were right in
  spirit; do them from the real sending mailbox, with the real message, every day for the first
  month, then weekly.)

Stop immediately and wait 48 hours if: a mailbox is rate-limited, Postmaster reputation drops to
"Low", two messages land in Spam on the seed test, or any recipient replies angrily. Investigate
before resuming. Do not rotate to another account to "get around" a block; that is how domains get
burned permanently.

## 2. Cold calling

Cold calling B2B is the channel with the fewest platform-reputation risks and the clearest legal
rules. It is also, for contractors, the channel most likely to produce a conversation, because
they answer their phones.

### 2.1 Federal rules that apply
- **TCPA**: No autodialers, prerecorded voices, AI voices or robotexts to any number without prior
  express consent. This applies to business numbers too. Rule for Pari: **every call is dialed by
  hand by a person, every text is typed by a person and only to someone you have spoken with.**
  Penalties are $500 to $1,500 per call or text.
- **Do Not Call Registry**: calls to businesses are generally exempt from the National DNC, but a
  huge share of contractors list a **personal cell phone** as the business number. Treat any number
  that could be a personal cell as covered. Register the business with the National DNC Registry
  (telemarketing.donotcall.gov), get the Subscription Account Number, and scrub the list against it
  monthly (the first five area codes are free). Keep the scrub records.
- **Internal do-not-call list**: anyone who says "don't call" goes on it within 24 hours, permanently,
  across every account and campaign. This applies regardless of B2B status.
- **Calling hours**: 8 a.m. to 9 p.m. in the recipient's local time, federally. Practical window for
  contractors: 7:45 to 9:30 a.m. (before they leave for the site) and 3:30 to 5:30 p.m. Minnesota's
  state rule is stricter, 9 a.m. to 9 p.m., so Minnesota calls start at 9.
- **Caller ID** must be accurate and must display a number that can be called back. Use the real
  business line (641-596-0111 or a dedicated business number on Google Voice / OpenPhone registered
  to the business name).
- **Identify yourself** in the first sentence: name, business, why you're calling.
- A November 25, 2026 FCC order changes consent-revocation handling. It is aimed at
  autodialed/prerecorded programs; manual B2B calling is not directly affected, but the practice of
  honoring any reasonable opt-out immediately, in any form, is the safe rule regardless.

### 2.2 State notes (verify before day one)
- **Iowa**: no standalone telemarketing registration; the Consumer Fraud Act (Iowa Code 714.16)
  governs. No special B2B registration found. Keep records of DNC scrubs.
- **Minnesota**: sources conflict on whether registration under Minn. Stat. 325E.311-.317 applies to
  a sole proprietor making manual B2B calls; most registration requirements target sellers of
  consumer goods with high-pressure or prize elements. Call the Minnesota Department of Commerce
  consumer services line and ask directly, note who you spoke to and when. Honor the 9 a.m. start.
- **Nebraska**: the Telemarketing and Prize Promotions Act is the governing statute. ADAD permits are
  only for automated dialers, which Pari does not use. As with Minnesota, make one confirming call to
  the Nebraska AG's consumer protection office.

### 2.3 Operating rules
- 20 to 40 dials a day is plenty for one person, with research done the night before. Quality of
  the list beats quantity of dials.
- Script in two sentences: who you are, the one thing you noticed about their business, and a
  permission question ("Is it a bad time for a 90-second question?"). Then listen.
- Log every call: number, business, outcome, follow-up date. A simple spreadsheet or a free CRM
  (HubSpot free, Notion, Folk) is enough. The log is also the compliance record.
- Voicemail: one, short, with the callback number. Never more than two voicemails per prospect per
  month.
- **Text follow-up only after a live conversation** in which they agreed to it, and only from the
  business number. No cold texting. Cold texting is where the TCPA lawsuits are.
- Never record a call without consent (Iowa, Minnesota and Nebraska are one-party states, but say
  so if you record; simpler not to).

## 3. Social outreach (LinkedIn, Facebook, Instagram)

Platforms do not publish limits; they use behavioral trust scores. New accounts have very low
tolerance. The strategy is **be a real, active account first, outreach second.**

### 3.1 Account setup (tomorrow)
- Create with the new business email, from the same device and home network you will always use.
  No VPN, no phone-farm, no "aged account" purchases.
- Full profile: real photo, real name, Pari in the headline, link to outreachdev.dev, location.
  LinkedIn: 50+ connections with people you actually know before any outreach.
- 2FA on everything. Same recovery phone across accounts.
- **Do not install any automation tool or browser extension that acts on your behalf.** Automation
  is detectable and is the main cause of restrictions. The Claude-driven sending in October would
  count as automation if it ran against a social account.

### 3.2 Two-week warm-up, every platform
Post 3 to 4 times a week (project before/afters from clients, short takes on contractor marketing,
behind-the-scenes), comment on 5 to 10 contractor posts a day with real sentences, follow 20 to 30
relevant accounts a day. No DMs to strangers for the first 14 days.

### 3.3 Limits after warm-up (conservative)
| Platform | Connection/follow requests | Cold DMs to non-connections | Notes |
| --- | --- | --- | --- |
| LinkedIn | 10 to 15 per day, ~80 per week | 0 in the request note; 15 to 20 DMs/day to accepted connections | Never pitch in the connection note. Withdraw pending invites older than 3 weeks. |
| Instagram | 20 to 30 follows/day | 15 to 25/day, only after engaging with their posts | Mostly for contractors who post their work. |
| Facebook | friend requests sparingly; use Pages and local trade groups | 10 to 15 Page-to-Page or group-member messages/day | Facebook is the strongest for Midwest contractors; group posts answering questions outperform DMs. |

Ramp from half of these numbers in week three. Spread activity across the day. If any platform
shows a warning, stop all outreach on it for seven days and keep posting normally.

### 3.4 Message shape
Same rule as email: short, specific observation, one question, no link in the first message. Move
to a call as fast as possible. The platforms reward conversations that go back and forth and
punish one-way broadcasts.

## 4. Shared rules across every channel

1. **One prospect, one channel at a time.** Email, then call to follow up the email, then maybe a
   LinkedIn connection. Not all three on the same day. The shared suppression list has a column for
   last-touch channel and date.
2. **No lead "borrowing" from other accounts.** The old leeathomp990 and thompsontechnologiesleet
   mailboxes stay as they are. Their 64 drafts are not sent from the new infrastructure without
   rewriting to the short format; most should be rewritten or discarded.
3. **Honest identity everywhere.** Same name, same business, same phone, same address. This is both
   the law and the single biggest deliverability signal.
4. **Volume is the last lever**, never the first. If results are poor, fix the list, the
   observation, or the offer. Doubling volume doubles the complaint count.
5. **Every opt-out, in any form, in any channel, is honored the same day** and recorded.
6. **Weekly review** (Friday, 20 minutes): sends, replies, bounces, complaints, calls, conversations,
   meetings booked, Postmaster screenshots. Decide next week's volume from the data.

## 5. Setup checklist for tomorrow, in order

1. Buy the sending domain(s). Set 301 redirect to outreachdev.dev.
2. Google Workspace on outreachdev.dev (hello@, lee@) and on the sending domain (lee@, hello@).
3. SPF, DKIM (2048), DMARC p=none, MX for every domain. Verify with MXToolbox and Google's checker.
4. Postmaster Tools: add and verify every domain.
5. 2FA on all accounts.
6. Start warm-up service on the sending mailboxes. Mark the calendar: first cold send no earlier than
   November 26.
7. National DNC Registry: create the account, get the SAN, download the first area codes.
8. Business phone line for calling (or confirm 641-596-0111 is the one), caller ID name set.
9. Social accounts created from the new email, profiles completed, first posts scheduled.
10. Create the suppression list and the call log spreadsheet. Add every October contact to the
    suppression list with date and channel.
11. One confirming call each to the Minnesota Department of Commerce and the Nebraska AG on
    registration for manual B2B calls; note the answers in this file.

## Sources consulted
- Google, Email sender guidelines: https://support.google.com/a/answer/81126
- FTC, Telemarketing Sales Rule and National Do Not Call Registry business pages (telemarketing.donotcall.gov)
- FCC TCPA consent-revocation order summaries: https://www.bhfs.com/insight/new-tcpa-revocation-of-consent-rules-take-effect-on-november-25/ and https://www.lw.com/en/insights/fcc-revamps-rules-on-consent-to-calls-and-texts-under-the-tcpa
- State registration charts: https://www.wipfli.com/insights/articles/telemarketing-registration-state-by-state-guide and the Shipkevich August 2026 chart
- Minnesota rules summary: https://aaronhall.com/how-to-comply-with-minnesota-telemarketing-regulations/
- Warm-up and volume consensus: https://mailivery.io/blog/email-warmup-guide, https://www.unifygtm.com/explore/cold-email-2026-domain-setup-deliverability-sequences, https://outreach2day.com/blog/email-warm-up-schedule
- Social limits consensus: https://taplio.com/blog/linkedin-connection-request-limit, https://www.usecarly.com/blog/instagram-dm-limit/, https://leadx.dev/blog/linkedin-outreach-limits-and-etiquette
- Lee's October 17, 2026 campaign handoff (Desktop) for what went wrong.
