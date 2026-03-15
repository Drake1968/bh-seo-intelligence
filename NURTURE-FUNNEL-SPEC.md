# Lead Nurture Funnel & Summary Report — Build Spec

## Product Ladder

| Tier | Price | Delivery | Content |
|------|-------|----------|---------|
| Free SEO Score | $0 | Instant on-screen | Overall score + 3 quick wins |
| Summary Report | $197 | Emailed PDF | Same format as Full Report but key sections blurred. $197 credited toward Full Report if purchased within 14 days. |
| Full Report | $1,997 ($1,800 with credit) | Emailed PDF + Dashboard access | All 6 agents, everything visible, complete recommendations |
| Basic Plan | $395/mo | Dashboard | Ongoing monitoring + monthly reports |
| Premium Plan | $595/mo | Dashboard | Weekly monitoring + priority support |
| Enterprise Plan | $995/mo | Dashboard | Daily monitoring + dedicated analyst |

## Summary Report — Blurred vs. Visible

### Visible (give enough to prove value)
- Overall SEO health score with letter grade
- Basic technical issues list (SSL, mobile, page speed)
- Their top 5 keyword rankings (position only, no strategy)
- Number of competitors found (names visible, scores visible)
- High-level admissions estimate (single number, no breakdown)

### Blurred (create FOMO for full report)
- Detailed technical recommendations and fix-it steps
- Competitor strategy analysis (what competitors are doing differently)
- Full admissions revenue projections with monthly breakdown
- Content roadmap with specific page topics and priority order
- Local SEO action plan (GBP optimization, citation list, review strategy)
- Backlink opportunities and outreach targets
- Schema markup code snippets
- Priority-ranked action items with estimated impact

### Visual Treatment
- Use CSS `filter: blur(8px)` on blurred sections
- Overlay each blurred section with a CTA box: "Unlock this section — Upgrade to Full Report"
- Include a persistent banner: "Your $197 credit expires in X days — Upgrade now for $1,800"
- Report header shows "SUMMARY REPORT" watermark vs "FULL REPORT"

## Checkout Flow (after Free Score)

1. User completes free score → sees results on screen
2. Below results, CTA: "Get Your Full Summary Report — $197"
   - Subtext: "Credited toward your Full Report if you upgrade within 14 days"
3. Stripe Checkout for $197 Summary Report product
4. On payment success:
   - Generate summary report (blurred version)
   - Email report to customer
   - Create lead record with `type: "summary_purchased"` and `creditExpiresAt: +14 days`
   - Start 5-touch nurture sequence timer
5. Dashboard shows "Summary Report" status with upgrade CTA

## 5-Touch Email Nurture Sequence (Manual for MVP)

### Day 0 — Score Delivery + Summary Upsell
**Subject:** Your SEO Health Score: {score}/100 — Here's What It Means for Admissions
**Content:**
- Their score with visual gauge
- 3 quick wins they can implement today
- CTA: "Get the full breakdown → Summary Report for $197"
- If already purchased summary: "Your Full Report upgrade credit is active for 14 days"

### Day 2 — Competitor Wake-Up Call
**Subject:** {competitor_name} is outranking you for "{top_keyword}" — here's why
**Content:**
- Show 1-2 competitor names and their scores vs. the lead's score
- Tease what the competitor is doing differently (visible in full report)
- "Your competitors aren't waiting. Neither should you."
- CTA: Summary Report or Full Report depending on status

### Day 5 — Revenue Impact (The Money Email)
**Subject:** You're leaving an estimated ${lost_revenue}/month in admissions on the table
**Content:**
- Admissions estimate teaser (high-level number)
- "Every month without SEO optimization costs your center approximately ${monthly_loss}"
- Break down: X missed searches → Y missed clicks → Z missed admissions → $revenue
- CTA: "See exactly where the money is going → Full Report"

### Day 9 — Urgency + Credit Reminder
**Subject:** Your $197 credit expires in 5 days
**Content:**
- If they bought summary: "Your $197 credit toward the Full Report expires {date}"
- Limited-time bonus: "Upgrade this week and get a free competitor deep-dive"
- Show a blurred preview of what they're missing
- CTA: "Upgrade to Full Report — $1,800 (with your credit)"

### Day 14 — Final Follow-Up
**Subject:** Your SEO score hasn't changed. Here's what happens next.
**Content:**
- "It's been 14 days since we scored your site. Nothing has changed."
- "Meanwhile, {competitor} is still outranking you for {X} keywords"
- If they had credit: "Your $197 credit has expired, but we're extending it 48 hours as a courtesy"
- Final CTA with full price or extended credit

## Lead Management Dashboard Tab (New)

### Features
- Table of all leads from free score tool
- Columns: Name, Email, Website, Score, Date, Status, Actions
- Status options: New, Contacted, Nurturing, Summary Purchased, Converted, Lost
- Click to expand: see their full free score data, competitor names, suggested email to send
- Filter by status, date range, score range
- Notification badge on tab when new leads arrive

### Lead Detail View
- Full free score results
- Nurture sequence tracker (which emails sent, which pending)
- Notes field for manual follow-up notes
- "Mark as Converted" with order linking
- Credit expiration countdown (if summary purchased)

## Stripe Products Needed (New Account: acct_1TB3FFRakNZtn9v4)

- **Summary Report**: $197 one-time (NEW — add to Stripe)
- **Full Report**: $1,997 one-time (already created as "Audit")
- Basic, Premium, Enterprise subscriptions (already created)

## Technical Implementation

### Backend Changes
1. New endpoint: `POST /api/free-score/purchase-summary` — creates Stripe checkout for summary report
2. New endpoint: `GET /api/leads` (admin) — list all leads with filtering
3. New endpoint: `PATCH /api/leads/:id` — update lead status, notes
4. Update `generateFreeScoreReport` to return both full and blurred versions
5. Add `creditExpiresAt` field to leads table
6. Add `summaryPurchasedAt` field to leads table
7. Add email notification trigger on new lead creation

### Frontend Changes
1. Update free score results page with Summary Report upsell CTA
2. New "Leads" tab in dashboard (admin only)
3. Lead detail view with nurture sequence tracker
4. Blurred report component with overlay CTAs
5. Credit expiration countdown component

### Report Generator Changes
1. New function: `generateSummaryReport(websiteUrl, data)` — same as full but with blur markers
2. Report template: shared layout, conditional blur based on report type
3. Blur overlay component with "Unlock" CTA

## Environment Variables Needed
- `VITE_STRIPE_PUBLISHABLE_KEY` — already pending (add to Railway)
- Stripe product/price IDs for Summary Report — add after Stripe activation

## Dependencies on Stripe Activation
- Cannot create payment links until new Stripe account is active
- Summary Report product needs to be created in Stripe
- Can build everything except live checkout while waiting
