# App Conversion Baseline

The empirical record of how well the app converts users to captured contact,
before and after the Priority 1 changes go live. This document is the
answer to the question: "did the email-capture-then-bypass change actually
work, or did we just lose a bunch of completions for nothing?"

The numbers in this document are filled in once data exists. Targets and
hypotheses are written now.

---

## How to read this document

Two snapshots: **pre-modification** (current production behavior, before
Priority 1 ships) and **post-modification** (the new flow). Each snapshot
covers the same metrics over comparable windows.

Capture method is the same for both: app analytics events as defined in
`docs/tracking-spec.md` § 2. The pre-modification snapshot can't measure
events that don't exist yet (Screen A, phone capture) — those rows are
N/A for the baseline.

---

## Pre-modification Baseline

**Window**: 14 days, ending the day before Priority 1 deploys.
**Status**: ⚑ to be populated. Cannot start until analytics from Priority
3 is live.

### Funnel completion (% of step entries that reach the next step)

| Metric | Baseline value | Notes |
|---|---|---|
| Sessions → step 1 started | TBD | |
| Step 1 → step 2 | TBD | |
| Step 2 → step 3 | TBD | |
| Step 3 → step 4 | TBD | This is the bidding-conversion fire point |
| Step 4 → step 5 (report) | TBD | |
| Step 5 → "Download Only" path selected | TBD | The leak this work fixes |
| Step 5 → "Create Account & Save" selected | TBD | Captured-contact, today's only path |
| Step 5 → "Sign In & Save" selected | TBD | Returning users |
| Step 5 → confirm-download-only → download | TBD | Captured: nothing |
| Step 5 → any path → final PDF download | TBD | Overall completion |
| Account-creation conversion (of users on step 5) | TBD | |
| Captured-contact rate of step-5 reachers | TBD | (account-create + sign-in) / step-5 reachers |

### Source segmentation (organic only)

The pre-modification window is necessarily organic — paid hasn't launched
— so segmenting by source is largely a sanity check.

| Metric | Value |
|---|---|
| Sessions, `utm_source` absent or `direct` | TBD |
| Sessions, `utm_source = google` (organic ref) | TBD |
| Sessions, other organic | TBD |

---

## Post-modification Snapshot

**Window**: rolling 14-day window, refreshed at days 14, 30, 45, 75, 90
post-launch of Priority 1.
**Status**: ⚑ to be populated post-launch.

### Funnel completion

| Metric | Day 14 | Day 30 | Day 45 | Day 75 | Day 90 |
|---|---|---|---|---|---|
| Sessions → step 1 started | | | | | |
| Step 1 → step 2 | | | | | |
| Step 2 → step 3 | | | | | |
| Step 3 → step 4 | | | | | |
| Step 4 → step 5 | | | | | |
| Step 5 → "Create Account & Save" | | | | | |
| Step 5 → "Sign In & Save" | | | | | |
| Step 5 → Screen A (the new default) | | | | | |
| Screen A → email captured | | | | | |
| Screen A → "Just download to this device" (bypass) | | | | | |
| Screen B → download | | | | | |
| Post-download → phone captured | | | | | |
| Post-download → callback skipped | | | | | |
| Step 5 → any path → final PDF download | | | | | |
| Overall captured-contact rate | | | | | |

### Definitions

- **"Captured-contact rate"** post-modification = (email_captures +
  phone_captures + account_creations + sign_ins) / step_5_reachers,
  counting a user only once even if they hit multiple capture surfaces.
- **"Email capture rate"** = email_captured / Screen A views.
- **"Bypass rate"** = bypass clicks / Screen A views.

The numerator-counted-once rule matters: a user who submits both an email
and a phone number is one captured contact, not two.

### Source segmentation (paid + organic)

Once paid traffic is live, segment the same metrics by `utm_source` and
`utm_campaign`. The campaign-attributable figures are what drive the
day-45 and day-90 decisions in `CAMPAIGN.md`.

---

## Targets

These are the success/failure thresholds the campaign will be judged on at
the app level. CPSC sits in `docs/measurement-plan.md` — these are the
app-flow numbers.

| Metric | Target | Rationale |
|---|---|---|
| Captured-contact rate of step-5 reachers | **≥ 60%** (vs. estimated 15–25% today through account creation) | The whole point of the work. Floor for declaring the change a success. |
| Step 4 → step 5 completion | **Hold within 10% of pre-mod baseline** | We're not changing steps 1–4. Any drop signals an unrelated regression. |
| Email capture rate on Screen A | **≥ 50%** | Floor for the screen to be worth keeping over a plain download button |
| Bypass rate on Screen A | **≤ 50%** | Inverse of email capture |
| Overall final-PDF-download rate from step 5 | **Hold within 5% of pre-mod baseline** | We must not lose completions to "win" captures. If users abandon the new screen rather than choosing a path, that's a coercion failure and we revert. |
| Phone capture on post-download screen | **≥ 15%** | This is icing; lower bar. If under 10% for a month, kill the screen. |

### Decision rules

- **Captured-contact ≥ 60% AND overall PDF download within 5% of
  baseline**: change is a win. Keep.
- **Captured-contact ≥ 60% BUT PDF download down >5%**: change is
  ambiguous — captured more contacts at the cost of users who abandoned.
  Investigate: are the lost users a real loss (low-intent dropoff is fine)
  or are we coercing people away? Decide at day 45.
- **Captured-contact < 60% AND PDF download within 5%**: Screen A copy
  isn't pulling its weight. Iterate on copy before reverting.
- **Captured-contact < 60% AND PDF download down >5%**: clear failure.
  Revert to the pre-mod three-card flow.

---

## What this document does NOT cover

- **Cost per signed case** — that's in `docs/measurement-plan.md`.
- **Attribution-by-channel funnel breakdown** — that's also in the
  measurement plan, populated weekly.
- **Practice Panther lead disposition rates** — that's in measurement
  plan + tracking spec.

This document is the app-flow conversion record alone.
