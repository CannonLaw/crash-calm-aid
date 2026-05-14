# Measurement Plan

How the campaign's performance is measured weekly, who pulls each number,
where it comes from, and the rules for cutting or scaling ad groups.

A fillable weekly report template lives at the bottom — copy it into a
new file or spreadsheet row each Monday.

---

## Weekly Metrics

### Spend & volume metrics

| Metric | Source | Pulled by |
|---|---|---|
| Total spend (Google Ads) | Google Ads UI | Ad manager |
| Total spend (Meta) | Meta Ads Manager | Ad manager |
| Total spend (YouTube) | Google Ads UI | Ad manager |
| Impressions by ad group | Google Ads / Meta | Ad manager |
| Clicks by ad group | Google Ads / Meta | Ad manager |
| CTR by ad group | Computed | Ad manager |

### Funnel conversion metrics

| Metric | Source | Pulled by |
|---|---|---|
| App entries by `utm_campaign` × `utm_content` | App analytics (PostHog ⚑) | Ad manager |
| Step-4 starts (primary bidding conv.) by source | App analytics | Ad manager |
| Report completions by source | App analytics | Ad manager |
| Email captures by source | App analytics | Ad manager |
| Phone captures by source | App analytics | Ad manager |
| Account creations by source | App analytics | Ad manager |
| Inbound calls to tracked numbers | CallRail ⚑ | Ad manager |
| Total leads to Practice Panther | Practice Panther report | Intake team |

### Cost metrics

| Metric | Formula |
|---|---|
| Cost per app entry | Spend / app entries |
| Cost per step-4 start | Spend / step-4 starts |
| Cost per email capture | Spend / email captures |
| Cost per phone capture | Spend / phone captures |
| Cost per inbound call | Spend / inbound calls |
| Cost per lead (any contact) | Spend / unique leads |
| **Cost per signed case (CPSC)** | **Spend / signed cases** |

### Disposition metrics (lagging, populated as cases mature)

| Metric | Source | Pulled by |
|---|---|---|
| Leads → qualified | Practice Panther | Intake team |
| Leads → signed | Practice Panther | Intake team / managing attorney |
| Leads → disqualified | Practice Panther | Intake team |
| Average days from lead → signed | Practice Panther + computed | Ad manager |
| Signed-case value (est.) | Practice Panther | Managing attorney |

---

## Target Benchmarks

These are the targets the weekly review checks against. They are
**starting** targets — adjust at the day-45 and day-90 reviews based on
what the data actually shows.

| Metric | Starting target | Notes |
|---|---|---|
| CTR, scene-of-crash search | ≥ 6% | Emergency intent should pull hard |
| CTR, day-after search | ≥ 4% | |
| CTR, lawyer-shopping search | ≥ 5% | Conventional PI benchmark |
| Cost per app entry | ≤ $5 | |
| Cost per step-4 start | ≤ $25 | The optimization target |
| Cost per lead (any capture) | ≤ $75 | |
| Cost per inbound call | ≤ $200 | |
| **Cost per signed case** | **≤ $3,500** | ⚑ assumption — adjust based on the firm's historical avg case value |
| Lead → signed conversion | ≥ 8% | PI industry roughly 5–10% |

The CPSC target is the load-bearing number. Everything above it is leading.

⚑ The CPSC target of $3,500 is a placeholder. It should be set as a
fraction of average signed-case value at the firm. A common rule-of-thumb
ceiling is 25–35% of expected fee — needs to be set by the firm before
day 45.

---

## Decision Rules

Applied weekly. Cut or scale at the **ad-group** level, not the
campaign level — campaigns rarely fail evenly across all their groups.

### Cut rules (kill the ad group)

Trigger any of these and the ad group gets paused at the next review:

1. **Spent ≥ 2× target CPL with zero leads** — the group can't even
   prove it generates contact, not just signed cases.
2. **Spent ≥ 3× target CPL with leads, but CTR < 2%** — the targeting
   or copy is fundamentally off. Don't pour more money in.
3. **30+ days live with no signed cases AND spend > $1,500** — by day
   30, every group should have produced at least one signed case
   trajectory if it's viable. Exception: groups < 14 days old (cases take
   time to mature).
4. **Quality Score < 4 on 50%+ of keywords in the group** — Google's
   relevance algorithm is telling us the keyword/landing-page fit is bad.
   Fix or cut.

### Scale rules (increase budget)

Trigger any of these and the ad group gets +25–50% budget at next review:

1. **CPSC at or below target AND spend pacing at 90%+ of budget cap** —
   the group is working and limited by money, not performance.
2. **Cost per step-4 start at or below target AND signed-case
   trajectory healthy** — early signal that bidding optimization is
   working.
3. **CTR > 8% AND CPC trending down** — the algorithm is finding the
   pocket. Lean in.

### Hold rules (no change)

Default. If neither cut nor scale triggers fire, leave the ad group alone
for another week. Tinkering kills signal.

### Special case: lawyer-shopping campaign

The lawyer-shopping segment has fundamentally different economics — fewer
clicks, much higher cost per click, but the leads convert dramatically
better. The decision rules above still apply but the bar for cutting
should be raised:

- Cost per click ceiling: ~$30 (PI lawyer keywords routinely hit $20–80)
- Cost per signed case is the only metric that matters here
- Don't cut for low click volume — the segment is supposed to be low
  volume

---

## Cadence

| When | Activity | Who |
|---|---|---|
| Daily, first 14 days post-launch | Spot-check that conversions are firing | Ad manager |
| Daily, ongoing | Quick scan of Google Ads dashboard for anomalies | Ad manager |
| Weekly (Mondays) | Pull all metrics, fill out the template below, apply decision rules | Ad manager |
| Bi-weekly | Review with managing attorney | Ad manager + attorney |
| Day 45 | First major reallocation decision | Ad manager + attorney |
| Day 75 | Begin offline-conversion uploads (Priority 3 in code) | Ad manager |
| Day 90 | Go/no-go on continuing the campaign | Attorney + ad manager |

---

## Weekly Report Template

Copy this into a new spreadsheet row or doc each Monday. Cover the
preceding 7 days.

```
Week of: ___________ (Mon to Sun)
Prepared by: ___________

=== SPEND ===
Google Ads:           $______
Meta:                 $______
YouTube:              $______
Call-tracking fees:   $______
TOTAL:                $______

=== TOP-LINE FUNNEL ===
App entries:                    ______
  from scene-of-crash:          ______
  from day-after:               ______
  from lawyer-shopping:         ______
  from organic / direct:        ______

Step-4 starts (primary conv):   ______
Email captures (Screen A):      ______
Phone captures (post-download): ______
Account creations:              ______
Report PDF downloads:           ______
Inbound calls (tracked):        ______

=== LEAD QUALITY (from PP) ===
Total leads created:            ______
  qualified:                    ______
  disqualified:                 ______
  pending intake review:        ______
Signed this week:               ______
Signed cumulative to date:      ______

=== COSTS ===
Cost per app entry:             $______
Cost per step-4 start:          $______
Cost per email capture:         $______
Cost per inbound call:          $______
Cost per lead:                  $______
Cost per signed case (cumul.):  $______

=== AD GROUP ACTIONS ===
Cut this week:
  - ______________ (reason: ______________)
  - ______________ (reason: ______________)

Scaled this week:
  - ______________ (+__%, reason: ______________)

Held (no change):
  - all others

=== CREATIVE / KEYWORD CHANGES ===
- ______________
- ______________

=== NOTES & FLAGS ===
- Anomalies, suspected tracking issues, hypotheses:
  ______________
  ______________

=== NEXT WEEK ===
- Plan:
  ______________
- Things to watch:
  ______________
```

---

## What's NOT in this plan

- **Real-time alerting**: not building Slack alerts or anything fancy
  in phase 1. Daily eyeballing during launch + weekly review is enough
  for a $10K/mo campaign.
- **Multi-touch attribution modeling**: last-non-direct click is the
  attribution model. Multi-touch is premature at this scale.
- **A/B testing infrastructure on the app**: Google Ads' RSA rotation
  handles ad-level testing. The app-side conversion experiment (the
  Priority 1 work) is a single before/after comparison, not a split
  test — see `docs/app-conversion-baseline.md`.
