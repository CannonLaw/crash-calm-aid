# Tracking Spec

The spec that feeds Priority 3 in `CAMPAIGN.md`. Defines UTMs, conversion
events, Practice Panther custom fields, call-tracking, and the
pre-launch baseline measurement.

Mark assumptions explicitly. Anywhere this doc says "TBD" or
"⚑ assumption," the value is not yet confirmed and should not be treated as
load-bearing until it is.

---

## 1. UTM Naming Convention

Every paid link gets all five UTM params. No exceptions. Inconsistent UTMs
are the most common reason attribution silently breaks two months in.

### Format rules

- All lowercase.
- Hyphen-separated, no spaces, no underscores. (Underscores are reserved for
  delimiters inside a single value — see `utm_content` below.)
- Use the exact values in the tables below. Do not invent variants.
- The app persists all five params from the entry URL through the whole
  session (see Priority 3 work). Captured leads carry the entry UTMs, not
  the UTMs of whatever page they happen to be on at conversion time.

### Param values

#### `utm_source` — the platform

| Value | Used for |
|---|---|
| `google` | Google Ads (Search, PMax, Display) |
| `meta` | Facebook + Instagram ads |
| `youtube` | YouTube pre-roll |
| `callrail` | ⚑ assumption — call-tracking visit attribution if provider supports it |

#### `utm_medium` — the channel type

| Value | Used for |
|---|---|
| `cpc` | Paid search |
| `pmax` | Google Performance Max |
| `paid-social` | Meta paid placements |
| `video` | YouTube pre-roll |
| `display` | Display network if used |

#### `utm_campaign` — segment + geo

Format: `crash-{segment}-{geo}`. Three campaigns at launch (Wyoming
deferred):

| Value | Segment | Geo |
|---|---|---|
| `crash-scene-co` | Scene-of-crash | Colorado |
| `crash-dayafter-co` | Day-after | Colorado |
| `crash-shopping-co` | Lawyer-shopping | Colorado |

Add `crash-{segment}-wy` variants only after the day-90 Wyoming decision.

#### `utm_content` — ad group + creative variant

Format: `{adgroup}__{variant}`. Double-underscore separator.

Examples:

- `checklist-app__v1-headline-a` — scene-of-crash, "checklist" ad group,
  creative variant 1, headline A
- `insurance-info__v2-image-b` — day-after, "insurance-info" ad group,
  variant 2, image B
- `pi-lawyer-fc__v1-firm-forward` — lawyer-shopping, "PI lawyer Fort
  Collins" ad group, "firm-forward" creative variant 1

Ad-group names live in `docs/ad-copy.md`. Keep them in sync with what's in
Google Ads / Meta.

#### `utm_term` — the keyword (search only)

For Google Ads Search, use `{keyword}` dynamic insertion. For everything
else, leave blank.

```
&utm_term={keyword}
```

### Reference URL templates (copy-paste)

Replace `{adgroup}__{variant}` per row. URL base is the app's production
domain.

**Google Ads Search — scene-of-crash:**

```
https://[domain]/?utm_source=google&utm_medium=cpc&utm_campaign=crash-scene-co&utm_content={adgroup}__{variant}&utm_term={keyword}
```

**Google Ads Search — day-after:**

```
https://[domain]/?utm_source=google&utm_medium=cpc&utm_campaign=crash-dayafter-co&utm_content={adgroup}__{variant}&utm_term={keyword}
```

**Google Ads Search — lawyer-shopping:**

```
https://[domain]/?utm_source=google&utm_medium=cpc&utm_campaign=crash-shopping-co&utm_content={adgroup}__{variant}&utm_term={keyword}
```

**Google PMax:**

```
https://[domain]/?utm_source=google&utm_medium=pmax&utm_campaign=crash-{segment}-co&utm_content={asset-group}__{variant}
```

**Meta retargeting:**

```
https://[domain]/?utm_source=meta&utm_medium=paid-social&utm_campaign=crash-{segment}-co&utm_content={adset}__{variant}
```

**YouTube pre-roll:**

```
https://[domain]/?utm_source=youtube&utm_medium=video&utm_campaign=crash-{segment}-co&utm_content={asset}__{variant}
```

---

## 2. Conversion Event Definitions

Three audiences for these events: Google Ads, Meta, and the in-app
analytics platform. Each row defines an event once and maps it across all
three.

The internal event name is the canonical id used in the app code. Platform
event names are what gets sent over the wire.

### Funnel events

| Internal name | Fires when | Google Ads conversion? | Meta event | Analytics event |
|---|---|---|---|---|
| `app_entry` | First page-view of session on `/` | No (volume metric) | `PageView` (auto) | `app_entry` |
| `step_1_safety_started` | User clicks "Start Crash Report" | No | `ViewContent` | `step_1_started` |
| `step_2_emergency_started` | Transition into emergency-contacts screen | No | — | `step_2_started` |
| `step_3_authorities_started` | Transition into authorities screen | No | — | `step_3_started` |
| `step_4_information_started` | Transition into information-gathering screen | **YES — primary bidding conversion** | `Lead` (value-less) | `step_4_started` |
| `step_4_information_completed` | User clicks Next on information screen, advancing to report | Secondary | `InitiateCheckout` | `step_4_completed` |
| `report_summary_viewed` | Report-generation page mounts | No | — | `report_summary_viewed` |
| `email_captured` | User submits email on Screen A | **YES — secondary** | `Lead` (with `content_name: email_capture`) | `email_captured` |
| `bypass_to_download` | User clicks "Just download to this device" on Screen A | No | — | `bypass_to_download` |
| `report_downloaded` | PDF blob.click() fires successfully | Secondary | `CompleteRegistration` | `report_downloaded` |
| `phone_captured` | User submits phone on post-download screen | **YES — secondary** | `Lead` (with `content_name: phone_callback`) | `phone_captured` |
| `callback_skipped` | User clicks Skip on post-download phone screen | No | — | `callback_skipped` |
| `account_created` | Supabase signUp success | Secondary | `CompleteRegistration` | `account_created` |
| `share_email_clicked` | User clicks "Share via Email" on completed screen | No | — | `share_email` |
| `share_text_clicked` | User clicks "Share via Text" on completed screen | No | — | `share_text` |
| `phone_call_to_firm` | Inbound call to tracked number (from call-tracking provider) | **YES** | `Lead` (server-side via Conversions API ⚑) | `phone_call` |
| `consultation_form_submit` | If/when a consultation form exists on the firm site | **YES** | `Lead` | `consultation_request` |

### Offline / case-stage events (uploaded back to Google Ads)

| Internal name | Fires when | Source |
|---|---|---|
| `signed_case` | Intake signs the engagement letter | Practice Panther export |
| `qualified_lead` | Intake-team disposition: viable PI case | Practice Panther export |
| `disqualified_lead` | Intake-team disposition: not a fit | Practice Panther export |

Offline upload mechanism: weekly CSV export from Practice Panther,
imported manually to Google Ads using the click-ID (gclid) captured on the
lead record. Manual is fine to start; explore API automation after the
day-90 review.

### Primary vs secondary bidding conversions

**Primary** (the conversion the algorithm optimizes for):
`step_4_information_started`. Rationale: report completion is too sparse
and too far down the funnel; bidding on completion starves the algorithm.
Step 4 is the first point where the user has shown sustained intent (got
past initial screens) but is common enough to give the algorithm signal.

**Secondary** (counted, valuable, but not what bidding optimizes for):
`email_captured`, `phone_captured`, `report_downloaded`, `account_created`,
`signed_case`, `phone_call_to_firm`.

Configure secondary conversions in Google Ads as "Observed," not "Primary."

### Enhanced conversions

Where the platform supports it, send hashed user data with each conversion
event:

- Email (for `email_captured`, `account_created`, `signed_case`)
- Phone (for `phone_captured`, `phone_call_to_firm`)
- First name + last name (for `signed_case`)

Hash client-side with SHA-256 before sending. Google Ads enhanced
conversions and Meta CAPI both expect lowercase, trimmed, SHA-256-hashed
PII.

---

## 3. Practice Panther Custom Fields

The intake team needs to capture these fields on every new lead so the
upload-back-to-Google-Ads pipeline works. Field creation in Practice
Panther is out of scope for this repo — the firm administrator does it
manually. This is the list to give them.

| Field name | Type | Required? | Populated by | Notes |
|---|---|---|---|---|
| `Crash Genius Lead ID` | Text (UUID) | Yes (for app leads) | App auto-fills via Zapier or webhook | UUID of the row in the app's leads table |
| `Source UTM Source` | Text | Yes | App auto-fills | One of: `google`, `meta`, `youtube`, `callrail`, `direct`, `organic` |
| `Source UTM Medium` | Text | Yes | App auto-fills | |
| `Source UTM Campaign` | Text | Yes | App auto-fills | e.g. `crash-scene-co` |
| `Source UTM Content` | Text | No | App auto-fills | Ad group + variant |
| `Source UTM Term` | Text | No | App auto-fills | Keyword if search |
| `Google Click ID (gclid)` | Text | Yes (for Google traffic) | App auto-fills | **Critical** — without this, offline conversion upload is impossible |
| `Meta Click ID (fbclid)` | Text | No | App auto-fills | For Meta CAPI offline matching |
| `App Entry Timestamp` | Date/Time | Yes | App auto-fills | When the user first arrived |
| `Report Flow Completed` | Yes/No | No | App auto-fills | Whether the user finished step 5 |
| `Capture Channel` | Picklist | Yes | App auto-fills | Values: `email-screen-a`, `phone-post-download`, `account-creation`, `inbound-call`, `consultation-form` |
| `Tracked Phone Number Dialed` | Text | No | Call-tracking provider sync | Which DID the caller dialed |
| `Disposition` | Picklist | Yes | Intake team sets | Values: `pending`, `qualified`, `disqualified`, `signed`, `lost` |
| `Disposition Date` | Date | Yes when disposition set | Intake team sets | Used for offline-conversion timing |
| `Signed Case Value (Est.)` | Currency | No | Attorney sets at signing | Estimated case value for value-based bidding |

### Where each gets populated in the intake process

1. **Lead arrives in PP** (via Zapier from app or via call-tracking sync):
   all UTM, click-ID, and timestamp fields are pre-filled. Intake team does
   not need to type these.
2. **Intake first contact**: intake team marks `Disposition: qualified`
   or `disqualified`.
3. **Engagement signed**: attorney/intake marks `Disposition: signed`,
   sets `Disposition Date`, and enters `Signed Case Value (Est.)`.
4. **Lost / closed without signing**: marked `lost` with date.

The weekly offline-conversion-upload job (see Priority 3 code work) reads
PP records where `Disposition = signed` and `Disposition Date` is in the
last 90 days, joins on `Google Click ID`, and uploads to Google Ads.

---

## 4. Call-Tracking Number Plan

**Provider**: CallRail ⚑ assumption — to be confirmed. CallRail is the
default for legal vertical and integrates natively with Google Ads and
Practice Panther.

**Volume**: minimum one tracked number per ad group, plus one per offline
asset that prints a phone number (no offline printed assets are planned in
phase 1, so the minimum stands as one-per-ad-group).

**Routing**: all tracked numbers forward to the firm's main intake line.
The tracked numbers exist for source attribution only — the caller's
experience is unchanged.

**Initial number provisioning** (CO area codes preferred — `970`, `720`,
`303`):

| Tracked DID purpose | UTM source/medium | Approx count |
|---|---|---|
| Google Search — scene-of-crash ad groups | google / cpc | 4–6 numbers (one per ad group) |
| Google Search — day-after ad groups | google / cpc | 4–6 numbers |
| Google Search — lawyer-shopping ad groups | google / cpc | 4–6 numbers |
| Google PMax — all segments | google / pmax | 3 numbers (one per segment) |
| Meta retargeting | meta / paid-social | 2–3 numbers |
| YouTube | youtube / video | 1 number |
| Organic-PI baseline (see § 5) | organic | 2 numbers |

**Dynamic Number Insertion (DNI)** on the app and firm site for visitors
arriving with UTMs — the displayed phone number swaps to match the
source. CallRail handles this with a JS snippet; install on app pages
that display the firm phone number (currently the Home page and the PDF
footer link, though the PDF cannot be DNI-swapped — it bakes the firm's
main number).

**Source tagging**: each call to a tracked DID gets logged with the
calling number, the DID dialed, the originating UTMs (CallRail captures
these from the visitor's session), and the call recording / duration.
That record syncs to PP nightly via CallRail's PP integration. ⚑ Confirm
PP integration exists for the firm's CallRail plan tier.

---

## 5. Baseline Measurement Spec

Before paid traffic starts, capture organic PI baseline so we can measure
cannibalization later. A common failure mode of paid PI campaigns is that
they buy clicks the firm would have gotten for free organically, and only
look like net gains.

### Capture window

Two weeks of clean baseline data minimum, ideally the two weeks
immediately before paid launch (i.e., days 1–14 of the infrastructure
phase). The Priority 3 analytics install must be live for the *full* two
weeks — partial windows are useless.

### What to capture (daily)

| Metric | Source | Notes |
|---|---|---|
| Sessions on `cannonlaw.com` PI pages | Site analytics | Filter to PI-relevant paths only |
| Sessions on app `/` from `organic` source | App analytics | `utm_source` absent or `direct` |
| Inbound calls to firm main line | Phone system or CallRail (un-tracked org baseline numbers) | |
| Consultation form submits on firm site | Firm site analytics | |
| App entries → step 4 completions | App analytics | Organic-only segment |
| Email captures on Screen A from organic | App analytics | Once Priority 1 is live |
| Signed PI cases attributable to organic | Practice Panther | UTM source = `organic` or `direct` |

### Baseline output

A single CSV: one row per day, columns per metric above. Reviewed at the
day-45 and day-90 checkpoints alongside paid numbers. Decision rule: if
organic on these metrics has dropped by more than 20% during paid launch,
treat that drop as cannibalization and subtract it from paid attribution
when computing true incremental signed cases.

⚑ Assumption: firm site (`cannonlaw.com`) is out of this repo's scope but
has comparable analytics. The Priority 3 plan will only install analytics
on the Crash Genius app domain; the firm site instrumentation needs to be
verified separately.
