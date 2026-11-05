# Setup today: step by step

Written November 5, 2026. Do every **You** step in the browser pane inside the Claude app, so your
sign-ins carry over when you hand it to me. Never paste a password, code or card number into the
chat. Type those only into the website.

The website itself is already live at outreachdev.dev (pushed this morning). Everything below is
email, accounts and the outreach setup.

**Decisions already made (change them if you want):**
- Sending domain: **parileads.com** (available as of this morning). Backups: teampari.com, meetpari.com.
- Lean setup: one paid mailbox per domain (`lee@`), with `hello@` as a free alias that lands in it.
- Two separate Google Workspace accounts, one per domain. If cold email ever gets the sending
  account suspended, your main outreachdev.dev email is not affected.
- Warm-up by hand (no paid warm-up service). First cold email no earlier than **November 26**.
- Keep 641-596-0111 as the calling line for now.

Rough cost: about $17/month for the two mailboxes plus about $11 for the domain's first year.

---

## Part 1: You (about 45 minutes)

### 1. Buy the sending domain at Porkbun
1. Go to **porkbun.com** and sign in (this is where outreachdev.dev is registered).
2. Search **parileads.com** and add it to the cart.
3. At checkout, leave WHOIS privacy on (it's free) and pay.
4. Turn on two-factor login for Porkbun if it isn't already: **Account → Account Settings →
   Two-Factor Authentication**.

### 2. Google Workspace for outreachdev.dev
1. Go to **workspace.google.com** and click **Get started**.
2. Business name: **Pari**. Number of employees: **Just you**. Region: **United States**.
3. Your name, and a current email for contact (your Gmail is fine).
4. "Does your business have a domain?" → **Yes, I have one I can use** → enter **outreachdev.dev**.
5. Username: **lee** (so the address is lee@outreachdev.dev). Create a strong password.
6. Complete any "I'm not a robot" or phone check.
7. Plan: **Business Starter**. Billing: **Flexible** (monthly, cancel any time). Enter payment.
8. When it lands in the Admin console and asks you to **verify your domain** or "sign in to your
   domain host", **stop there**. I'll do the DNS.
9. Turn on 2-Step Verification: **myaccount.google.com → Security → 2-Step Verification**. Use
   the Google Authenticator app or your phone. Save the backup codes somewhere safe, not in this
   repo.

### 3. Google Workspace for parileads.com (separate account)
1. Open a new tab, go to **workspace.google.com** again, and repeat Step 2 with these changes:
   - Business name: **Pari Outreach**
   - Domain: **parileads.com**
   - Username: **lee** (lee@parileads.com)
2. Stop again at domain verification.
3. Turn on 2-Step Verification for lee@parileads.com too.

### 4. Postmaster Tools
1. Go to **postmaster.google.com** and sign in as **lee@outreachdev.dev**.
2. Accept the terms if it asks. Stop there. I'll add both domains.

### 5. Hand over
Tell me "take over, part 2".

---

## Part 2: Me (about 45 minutes)

- Verify both domains in their Workspace accounts (DNS records at Porkbun).
- Add MX, SPF and DMARC (`p=none`, reports to lee@outreachdev.dev) for both domains.
- Generate 2048-bit DKIM keys in both Admin consoles, publish them, and switch signing on.
- Add **hello@** as a free alias on both mailboxes.
- Set parileads.com to 301-redirect to https://outreachdev.dev in Porkbun.
- Add and verify both domains in Postmaster Tools.
- Check every domain in MXToolbox and Google's Check MX tool, and fix anything they flag.
- Add a "First cold send" reminder for November 26 to the lee@outreachdev.dev calendar.
- Build the suppression list and the call log as Google Sheets in lee@outreachdev.dev's Drive.
  Send me the October contacts (or tell me where they are) and I'll add them with date and channel.
- Write the hand warm-up schedule for lee@parileads.com.

I'll ask you before sending any email, including test messages.

---

## Part 3: You (about 45 minutes, once email works)

Your new address can receive verification codes after Part 2, so this part has to come second.

### 6. Google Business Profile
1. Go to **business.google.com**, signed in as lee@outreachdev.dev.
2. Add your business: name **Pari**, category **Marketing agency**.
3. "Add a location customers can visit?" → **No** (this keeps your home address private and makes
   you a service-area business).
4. Service area: start with your county and nearby cities. Phone 641-596-0111, website
   https://outreachdev.dev.
5. Do the verification Google asks for (often a short video). If it says verification comes later,
   that's fine. Stop after that. I'll fill in the description, services and hours.

### 7. LinkedIn company page
1. Sign in to your personal LinkedIn (a company page needs a personal admin).
2. Go to **linkedin.com/company/setup/new** → **Company**.
3. Name **Pari**, LinkedIn URL e.g. **pari-leads**, website outreachdev.dev, industry **Marketing
   Services**, size **0-1 employees**, type **Self-employed**.
4. Tick the verification box and click **Create page**. Stop there.

### 8. Facebook page and Instagram
1. Sign in to your personal Facebook. Go to **facebook.com/pages/create**.
2. Page name **Pari**, category **Marketing Agency**. Create. Stop there.
3. Instagram: sign up with **lee@outreachdev.dev**, username e.g. **@pari.leads**. Then
   **Settings → Account type → Switch to professional → Business**. Link it to the Facebook page
   when asked.
4. Turn on two-factor login for LinkedIn, Facebook and Instagram.

### 9. Google Analytics
1. Go to **analytics.google.com**, signed in as lee@outreachdev.dev → **Start measuring**.
2. Account name **Pari**. Property name **outreachdev.dev**, time zone **Central**, currency **USD**.
3. Fill in the business details and accept the terms. Stop at "Choose a platform". I'll create
   the web stream and add the tag to the site.

### 10. Search Console and Bing
1. Go to **search.google.com/search-console**. If outreachdev.dev already shows up under one of
   your Google accounts, use that account. Otherwise sign in as lee@outreachdev.dev. Stop there.
2. Go to **bing.com/webmasters** and sign in with Google as lee@outreachdev.dev. Approve the
   sign-in. If it offers **Import from Google Search Console**, approve that too. Stop there.

### 11. Contact form
1. Go to **formspree.io** and sign up with lee@outreachdev.dev. Confirm the email.
2. Create a new form called **Contact**. Stop there. I'll wire it into the site.

### 12. Do Not Call registry
1. Go to **telemarketing.donotcall.gov** → **Create a profile**, as a seller calling for your
   own business.
2. Enter your business and contact details.
3. Choose Iowa's five area codes, which are free: **319, 515, 563, 641, 712**. Add Minnesota or
   Nebraska codes later ($85 each per year) once you call there.
4. Submit and note your **SAN** (Subscription Account Number) somewhere safe. Stop there.

### 13. Phone line
- Keeping 641-596-0111: check your carrier's app or website for a **Caller ID name** setting and
  set it to **Pari**. Many carriers don't offer this on personal lines. If yours doesn't, it can
  wait.
- If you'd rather have a separate business line, that's a $15 to $19/month service such as Quo.
  Your call.

### 14. Hand over
Tell me "take over, part 4".

---

## Part 4: Me (about an hour)

- Fill in the Google Business Profile, LinkedIn, Facebook and Instagram: description, services,
  logo, cover image, links.
- Draft the first two weeks of posts. **Nothing gets posted or scheduled until you approve it.**
- Create the Analytics web stream, add the tag to the site, verify Search Console by DNS, submit
  the sitemap to Google and Bing, and set up IndexNow.
- Add the Formspree endpoint to the contact form and test it, after you OK a test submission.
- Add the profile links to the site's search data, then rebuild and push the site.
- Download the Do Not Call files for your five area codes (I'll ask before each download) and
  build the scrub step into the call log.

---

## Part 5: You (whenever today)

### 15. The two state calls
Call each and ask the same three questions. Write the answers below, with the name of the person
and the date.

1. "I run a small marketing business in Iowa. I make **manually dialed** calls to **businesses**,
   not consumers, to offer lead generation and marketing services. Do I need to register as a
   telemarketer in your state?"
2. "Does that change if some of the business numbers are cell phones?"
3. "Is there anything else I should file or keep on record?"

- **Minnesota Department of Commerce** (search "Minnesota Commerce telemarketing" for the
  current number): answer:
- **Nebraska Attorney General, Consumer Protection** (search "Nebraska AG consumer protection"
  for the current number): answer:

### 16. Daily hand warm-up (starts tomorrow)
I'll write the full schedule in Part 2. The short version: 3 to 5 real emails a day from
lee@parileads.com in week one, to people who will open and reply. Then 8 to 12 a day in week
two, and 15 to 20 in week three. No cold email before November 26.
