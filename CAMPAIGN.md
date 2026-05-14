# Crash Genius Paid Marketing Campaign

**Status**: Living document. Decisions are appended to the Decisions Log with dates.
**Last revised**: 2026-05-14
**Owner**: Cannon Law

---

## Goal

Drive post-crash users to Crash Genius via Google Ads at the moment of crash,
then retarget through Meta and Google to convert a portion of them into signed
PI cases at Cannon Law. Crash Genius is the top-of-funnel utility; the firm is
the bottom-of-funnel outcome.

## Success Metrics

Primary:

- **Signed PI cases attributable to the campaign**
- **Cost per signed case (CPSC)**

Secondary (leading indicators):

- App entries from paid sources
- Step-4 starts (the bidding conversion — see `docs/tracking-spec.md`)
- Email captures (new Screen A)
- Phone captures (post-download)
- Consultation requests / calls to tracked numbers
- Report completions

Cost per signed case is the only metric that ultimately controls whether the
campaign continues. Leading indicators exist to tell us whether bidding is
healthy *before* signed-case volume can answer the question.

## Audience Segments

Three segments differentiated by intent and timing relative to the crash:

### Scene-of-crash

- **Who**: Someone who just crashed, still on or near the scene, on their phone.
- **State of mind**: Adrenaline, confusion, "what do I do right now."
- **Search behavior**: Emergency-intent queries — "what to do after a car
  accident," "car accident checklist," "do I call the police."
- **Conversion event for this audience**: App entry → step 4 start. They are
  too early in the cycle to be ready for a lawyer pitch.
- **Creative posture**: App is the hero. Lead with utility, not legal services.

### Day-after

- **Who**: People dealing with insurance, doctors, processing what happened in
  the 1–3 days after a crash.
- **State of mind**: Overwhelmed, looking for next steps, not yet shopping
  attorneys but increasingly aware they might need one.
- **Search behavior**: Informational keywords — "how to deal with insurance
  after car accident," "do I need to see a doctor after a fender bender,"
  "delayed pain after car accident."
- **Conversion event**: App entry + consultation request (lower priority on
  pure step-4 starts; this segment skews toward direct contact).
- **Creative posture**: App plus consultation. Educational, soft.

### Lawyer-shopping

- **Who**: 2–14 days post-crash, actively considering an attorney.
- **State of mind**: Comparison shopping, scrutinizing firm signals.
- **Search behavior**: Conventional PI keywords — "personal injury lawyer
  [city]," "car accident attorney near me," "no win no fee accident lawyer."
- **Conversion event**: Consultation request / phone call. App entry is a
  value-add, not the primary action.
- **Creative posture**: Firm-forward. App mentioned as a free utility we
  built, signal of seriousness and customer focus.

## Channel Allocation

Total budget: **$10,000/month for 90 days** = $30,000 total media + management.

| Channel | Share | Monthly | Notes |
|---|---|---|---|
| Google Ads (Search + PMax for the three segments) | ~65% | $6,500 | Primary acquisition |
| Meta retargeting (FB + IG, app-visitors and lookalikes) | ~15% | $1,500 | Bottom-funnel only — no cold targeting on Meta in phase 1 |
| YouTube pre-roll | ~7% | $700 | Light, "tier-three" exposure for awareness in CO market |
| Measurement + ad management | ~13% | $1,300 | Tracking infrastructure, weekly optimization labor, call-tracking line costs |

These percentages are starting points. The phased rollout (below) explicitly
reserves the right to reallocate at the day-45 and day-75 reviews based on
what the data shows.

## 90-Day Phased Rollout

### Days 1–14: Infrastructure

- App changes (Priority 1, 2, 3 in this repo) shipped to production
- Tracking pixels live, conversion events firing, UTM persistence verified
  with real test traffic
- Call-tracking numbers provisioned, one per ad group, routed to firm intake
- Practice Panther custom fields created and populated by the intake team on a
  staged dry-run
- Baseline measurement window for organic PI traffic (see
  `docs/tracking-spec.md` § Baseline measurement spec)
- Ad creative drafted and approved (see `docs/ad-copy.md`)
- Campaigns built in Google Ads and Meta Business Manager, paused

### Days 15–45: Launch

- Launch Google Ads, paused Meta retargeting until app-visitor audience size
  is large enough (~1,000 users) to be useful
- Daily monitoring of conversion-event firing for the first week
- Weekly performance review per `docs/measurement-plan.md`
- Defer Wyoming geo-targeting; CO only

### Days 46–75: Refine

- Cull underperforming ad groups based on the decision rules in
  `docs/measurement-plan.md`
- Begin uploading signed-case offline conversions to Google Ads (see
  Priority 3 in app code work). Cases signed in days 15–45 are the first
  batch eligible.
- Iterate creative on the surviving ad groups — at this point we should know
  which angles work for each segment.
- Meta retargeting fully active once audience seeded.

### Days 76–90: Decide

- Final assessment against CPSC target.
- Go/no-go decision: continue at $10K/mo, scale up, scale down, or pause.
- Wyoming expansion decision (deferred to this checkpoint).

## Constraints

### Brand standards (Cannon Law)

- **Typography**: Montserrat (400/500/600/700). Already loaded in
  `index.html`.
- **Colors**:
  - Primary orange: `#FE5200`. Confirmed in `src/index.css:10` as
    `--primary: 21 100% 49%`.
  - Neutral gray: `#545454`. Used for body text in firm collateral; the
    app's `--muted-foreground` should be audited against this during the
    Priority 2 report work but is not blocking.
- **Tagline**: "Firepower when you need it. Value when you don't." May be
  used in firm-forward ads (lawyer-shopping segment) but should be omitted
  from scene-of-crash creative — the tone is wrong for someone who just
  crashed.

### Jurisdiction

- **Colorado only** through day 90. Wyoming deferred to day 90+ for a
  separate go/no-go.

### App modifications (committed; see code priorities)

- **Email-capture-then-bypass** at end of flow, replacing today's "Download
  Only" leak (see Priority 1 in the spec at the bottom of this doc).
- **"What to Do Next" section** added to the report (Priority 2).
- **7-day symptom log** added to the report (Priority 2).
- **Analytics + UTM persistence + conversion pixels** (Priority 3).

### Brand placement

- The app sits as a Cannon Law product. Confirmed in code: the Home page
  treatment in `src/pages/CrashResponse/Home.tsx:54-58` renders "CRASH
  GENIUS from CANNON LAW," and the PDF footer attributes the service to
  Cannon Law.

---

## Decisions Log

Append new decisions with the date. Don't rewrite past entries — strike
through and add a new line if a prior decision is reversed.

- **2026-05-14** — Campaign B (post-crash audience) is the focus. Other
  candidate campaigns deferred.
- **2026-05-14** — Budget set at $10,000/month for 90 days.
- **2026-05-14** — Wyoming geo-targeting deferred until after day 90.
- **2026-05-14** — App will gain (a) email-capture-then-bypass screen
  replacing "Download Only," (b) "What to Do Next" + 7-day symptom log in
  the report, (c) analytics + UTM + conversion pixels.
- **2026-05-14** — App brand position confirmed as Cannon Law product
  (already integrated in code).
- **2026-05-14** — Primary Google Ads bidding conversion will be
  "started step 4" or "saved Your Information," not "completed report."
  Rationale: the report flow is long enough that optimizing on completion
  will starve the bidding algorithm of signal. (See
  `docs/tracking-spec.md`.)
- **2026-05-14** — Offline-conversion upload to Google Ads is in scope for
  Priority 3, despite most firms skipping it. Manual export from Practice
  Panther to start; API automation later.

---

## Open Items / Assumptions Flagged

These are things assumed-but-not-confirmed in this document. Resolve before
each becomes load-bearing.

- **Practice Panther API access**: documents assume Practice Panther is the
  intake CRM and that custom fields can be added. Confirmed by the brief, but
  the actual field-creation work in PP is out of scope for this repo —
  flagged in `docs/tracking-spec.md`.
- **Zapier as the leads-to-PP bridge**: recommended in Priority 1 of the
  brief. The code plan (below) will accept or counter that recommendation
  after looking at the existing Supabase Edge Functions pattern.
- **Call-tracking provider**: not yet selected. CallRail is the conventional
  pick for legal; assumed unless overridden.
- **Analytics platform**: brief asks for a recommendation. PostHog is the
  current leading candidate (self-host-friendly, privacy-tolerable, generous
  free tier, supports the funnel events we need natively). To be confirmed
  in the Priority 3 plan.
- **Meta business assets**: assumes the firm has an existing Meta Business
  Manager and ad account. Not yet verified.
- **Gray brand color match**: `#545454` not yet audited against the app's
  current `--muted-foreground` token. Likely a non-issue but flagged.
