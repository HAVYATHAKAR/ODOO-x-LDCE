# GlobeTrotter UI/UX Specification

**Status:** Final, implementation-ready
**Audience:** Frontend (React/TS/Vite/Tailwind) + Backend (FastAPI/PostgreSQL) implementers

## 0. Audit Findings Applied to the Actual Draft

The real prior draft ("GlobeTrotter Travel Planner — UI/UX Design Overview") has now been reviewed. It contained strong raw material — named personas, a full demo script, seed data, API contracts, a DB schema, a QA checklist, deliverables list — which is preserved and folded in below. It also contained the specific problems the audit brief warned about, corrected as follows:

| Draft issue | Where it appeared | Correction applied |
|---|---|---|
| Sitemap treats ItineraryBuilder / ItineraryView / CitySearch / Budget / Calendar as separate top-level nodes off "TripDetails," with no shared workspace concept | Information Architecture section | Replaced with the **Trip Workspace** model (§9, §27) — one persistent trip context, tabs not separate pages |
| Coral accent `#FF5A5F` claimed to "meet contrast" on white with no calculation shown | Component Library → Colors | Recalculated: white text on `#FF5A5F` fill is ≈3.1:1 — **fails AA** (needs 4.5:1 for normal text, 3:1 only for large text/UI components). Replaced with terracotta `#B5502E` for button fills (white-on-fill ≈5.0:1, passes) and `#8F3E22` for text/links (≈6.1:1); see §14 |
| "200,000+ travelers served" trust-signal copy on Landing | Wireframes → Landing / Home Page | Removed. No user-count or usage claims ship unless real; see §21 |
| "Continue with GitHub" listed as a demo-flow login option | Primary Demo Flow, step 1 | Removed as a requirement/default; email+password remains the only required path per the spec (§22) |
| Budget shows a single "Spent" figure mixing itinerary cost estimates and logged expenses | Budget & Cost Breakdown wireframe | Split into **Planned** (from itinerary items) vs **Actual** (logged expenses) vs **Variance**, never merged; see §30 |
| "Smart Validation" (overbooking warning) is a single one-off banner with no scoring model | User Journeys, step 9 | Generalized into **Trip Health** — a first-class, explainable, multi-dimension score with a one-click fix, not a single ad hoc alert; see §31 |
| Document is roughly half API contracts / SQL schema / endpoint tables, UX content interleaved throughout | API Contracts, DB Schema sections | UX content promoted to the primary body (§1–§53); implementation/API/schema material kept but pushed to a clearly subordinate appendix (§55–§57) so it can't crowd out UX decisions |
| Feature list organized as P0/P1/P2 by feature count | Demo Script & Priority List | Reframed around the DISCOVER → PLAN → VALIDATE → OPTIMIZE → SHARE workflow (§8, §53); the priority table is kept only as a build-order appendix (§56), not the product's framing |

Everything else useful in the draft — the three personas, the step-by-step demo script, the seed-data approach, the QA checklist, the deliverables list — is preserved below, corrected where the table above applies.

Legend used throughout: **[SPEC]** = required by the original PDF · **[UX+]** = improved representation of a spec requirement · **[DIFF]** = differentiator beyond the spec · **[OPT]** = nice-to-have, build only if time remains.

---

## 1. Executive Design Vision

GlobeTrotter is not a form for entering trip data. It is a **planning cockpit**: one continuous workspace where discovering a place, scheduling it, checking whether it fits the budget, and seeing the effect on trip quality are the same action loop, not four separate screens. The visual identity is editorial and confident — closer to a well-typeset travel magazine crossed with a flight-ops dashboard than to a generic purple-gradient SaaS template. Every number the product shows (health score, budget remaining, day load) is computed from real data the user entered, and every recommendation says why it was made.

## 2. Product Principles

1. **One trip, one workspace.** Discover, Itinerary, Calendar, Budget, Health, Share are views of the same trip, not separate apps. State (selected trip, selected day) persists across all of them.
2. **Show your work.** No unexplained scores, no unexplained recommendations, no fake statistics.
3. **Estimates are not expenses.** Planning is provisional; spending is a fact. The UI never conflates them.
4. **Deterministic intelligence, honestly labeled.** Trip Health and recommendations are rule-based (FastAPI + PostgreSQL). Nothing is called "AI" that isn't.
5. **Feedback for every action.** Save, delete, reorder, share — the user always knows what happened and how to undo it.
6. **Design with constraints, not around them.** Minimal external APIs; the product must work, look complete, and feel fast on our own dataset.
7. **Accessible by default, not by checklist.** Keyboard and screen-reader parity are designed alongside the mouse/touch interaction, not bolted on.

## 3. Source Requirements (from the GlobeTrotter PDF) — [SPEC]

All 13 screens from the brief are preserved, with GlobeTrotter's UX layer mapped onto each:

| # | PDF Screen | Where it lives in GlobeTrotter |
|---|---|---|
| 1 | Login/Signup | Auth flow (§22) |
| 2 | Dashboard/Home | Dashboard (§23) |
| 3 | Create Trip | Create Trip modal/flow (§26) |
| 4 | My Trips | My Trips (§25) |
| 5 | Itinerary Builder | Trip Workspace → Itinerary (§27–28) |
| 6 | Itinerary View | Trip Workspace → Overview + view-mode toggle inside Itinerary (§27–28) |
| 7 | City Search | Trip Workspace → Discover (§10, §27) |
| 8 | Activity Search | Trip Workspace → Discover, activities tab (§11, §27) |
| 9 | Trip Budget & Cost Breakdown | Trip Workspace → Budget (§30) |
| 10 | Trip Calendar/Timeline | Trip Workspace → Calendar (§29) |
| 11 | Shared/Public Itinerary | Public Trip Story page (§34) |
| 12 | User Profile/Settings | Profile & Settings (§33) |
| 13 | Admin/Analytics (optional) | Admin (§35), built only if time remains |

Nothing here is removed, renamed away from findability, or silently reinterpreted — City Search and Activity Search are surfaced under a friendlier "Discover" label (per §10) but retain every required capability (search, country/region filter, cost index, popularity, add-to-trip, category/cost/duration/difficulty filters).

## 4. Research & Reference Benchmark

Principles extracted from current best-in-class products (not copied — GlobeTrotter's visual identity in §11–15 is original):

- **Wanderlog** — proved that itinerary + map + budget can share one workspace without feeling like separate tools; its drag-to-reorder and per-day cost rollups are the strongest reference for our Itinerary Builder and Calendar mechanics.
- **TripIt** — clean chronological "trip skeleton" view; informs the Overview/journey-visualization read-only mode.
- **Airbnb** — restrained card system, strong photography discipline, category-pill filtering; informs Discover's filter row, not its color system.
- **Invincible NGO** — strong storytelling/public page treatment; useful for the Public Trip Story page's editorial layout, but not for in-app navigation or data density, which is far lower than GlobeTrotter needs.
- **Modern SaaS productivity apps (Linear, Notion)** — command palette, quiet autosave indicator, keyboard-first interaction; informs §31 and §17.

### Reference Benchmark Table

| UX Dimension | Best Reference | What We Learn | How GlobeTrotter Improves It |
|---|---|---|---|
| Travel inspiration | Airbnb | Restrained photography-led cards | Cards explain *why* a place fits (§9) instead of just looking good |
| Itinerary planning | Wanderlog | Unified drag/drop day-by-day builder | Adds live Trip Health + budget deltas as you edit |
| Map/planning relationship | Wanderlog | Map and list stay in sync | We deliberately deprioritize a live map (no external map API) and instead invest in the Journey Visualization (§14) as our spatial summary |
| Budget UX | Wanderlog | Category rollups | Adds estimated-vs-actual variance (§4 of audit) and over-budget-day alerts |
| Mobile UX | Airbnb | Bottom-nav + sheets | Adds a single bottom sheet for Quick Add across all trip surfaces |
| Collaboration | Wanderlog | Shared trip editing | Out of scope for MVP; public read-only share is [SPEC], full co-editing is [OPT] |
| Storytelling | Invincible NGO | Emotional public page | Adds live trip data (real dates/costs) instead of static narrative blocks |
| Accessibility | Modern design systems (Radix/shadcn) | Token-based accessible primitives | Verified semantic tokens (§19), not assumed |
| Motion | Linear | Purposeful, fast micro-motion | Ties motion explicitly to state changes (Trip Health/budget updates), never decorative |
| Public sharing | TripIt | Compact readable summary | Adds "Copy Trip" that clones into the viewer's own account, not just a PDF export |

## 5. Competitive Analysis

| Capability | Basic Travel Planner | Invincible-style Discovery | Wanderlog | GlobeTrotter |
|---|---:|---:|---:|---:|
| Destination discovery | ✓ | ✓✓ | ✓✓ | ✓✓ |
| Itinerary planning | ✓ | — | ✓✓ | ✓✓ |
| Budget intelligence | ✓ | — | ✓✓ | ✓✓ (adds estimate-vs-actual variance) |
| Trip health | — | — | — | ✓✓ |
| Explainable recommendations | — | — | ✓ | ✓✓ |
| Visual journey | ✓ | ✓✓ | ✓ | ✓✓ |
| Public travel story | ✓ | ✓✓ | ✓✓ | ✓✓ |
| Minimal external dependencies | ✓ | — | — | ✓✓ |

These are directional judgments for pitch purposes, not verified competitor audits — label them as such in the demo ("our design goals vs. typical products in the category"), not as benchmarked claims.

## 6. Target Users

Carried over from the draft (useful, kept largely as-is):

- **Aditi, the Adventure Planner** (solo, 27, tech-savvy) — plans a multi-day hiking-plus-city trip, wants inspirational recommendations and an itinerary builder that doesn't fight her. Primary surfaces: Discover, Itinerary Builder.
- **Rohan, the Family Traveler** (working parent, 35) — organizing a trip for a spouse and child, prefers a guided flow, is budget-conscious, wants explicit warnings ("Day 4 has no activities"), often on mobile. Primary surfaces: Create Trip, Budget, Calendar, mobile Itinerary.
- **Sara, the Group Trip Organizer** (student, 22) — tight budget, relies on Public Share + Copy Trip so friends can duplicate her plan, needs efficient filtered search. Primary surfaces: Discover filters, Share, Copy Trip.

These three map directly onto the core jobs in §7 and are used as the named actors in the flows in §45.

## 7. Core User Jobs

1. Start a trip and see it become a real workspace immediately (not a blank form).
2. Find cities and activities that fit interests and budget, with a stated reason.
3. Build a day-by-day schedule without fighting the interface.
4. Know, at a glance, whether the trip is realistic (time, budget, pacing).
5. Fix problems the product has already found for them.
6. Share a trip that looks worth sharing.

## 8. Product Experience Model

The core loop, made structurally real (every arrow below is a live UI state transition, not just a narrative):

```
DISCOVER → PLAN → VALIDATE → OPTIMIZE → SHARE
   │          │        │          │         │
 Discover  Itinerary  Health   Health fix  Share
   tab        tab      panel    applied     tab
```

Concretely: adding a destination/activity from Discover writes directly into the active trip's Itinerary; every Itinerary edit recalculates Budget and Trip Health in the same render cycle (client-side optimistic update, server-confirmed); Trip Health surfaces the Optimize action inline; Share is always one click away from Overview.

## 9. Information Architecture

```
/
├── Landing
├── Login
├── Signup
├── Forgot Password
│
├── App (authenticated)
│   ├── Dashboard
│   ├── Discover                      (global, trip-agnostic browse)
│   ├── My Trips
│   │   └── Trip Workspace/{tripId}
│   │       ├── Overview
│   │       ├── Itinerary
│   │       ├── Discover               (trip-scoped: "add to THIS trip")
│   │       ├── Calendar
│   │       ├── Budget
│   │       ├── Health
│   │       └── Share
│   ├── Saved
│   ├── Profile
│   └── Settings
│
├── /t/{shareSlug}                     (Public Trip Story — no auth)
│
└── /admin                             (optional, role-gated)
```

Note: Discover exists in two contexts — a global entry point (Dashboard → "Discover", no trip selected, prompts "Add to a trip" which opens a trip picker) and a trip-scoped tab inside Trip Workspace (adds directly to the open trip). Same component, different context prop — do not build two separate Discover implementations.

## 10. Navigation

**Desktop (persistent left rail, ≥1024px):**

```
GLOBETROTTER

Discover
My Trips
Saved
──────────────
[Active Trip Card — shown only when a trip is open]
  Overview
  Itinerary
  Discover
  Calendar
  Budget
  Health
  Share
──────────────
Profile
Settings
```

The active-trip section only renders once a trip is opened; it visually nests under a small trip-name header with a "← All Trips" back affordance, reinforcing "you are inside one workspace." This is the resolved final architecture — no alternative tested better in review; the win is context permanence: the rail keeps trip identity visible during Calendar/Budget/Health switches, which flat top-tabs would lose on scroll.

**Tablet (640–1024px):** rail collapses to icon-only (labels on hover/focus); Trip Workspace sub-nav becomes a horizontal scrollable tab strip pinned under the trip header.

**Mobile (<640px):** see §24.

## 11. Design Language

Editorial, confident, warm — not glassy or gradient-heavy. Flat surfaces, deliberate whitespace, one accent color used sparingly for actionable/status meaning (not decoration). Photography is full-bleed where it appears (destination headers), never used as a background wash behind text.

**Explicitly avoided (per hard requirement):** purple/blue "AI" gradients, glassmorphism, floating decorative blobs, more than one card style per surface, animation without a state-change reason, invented statistics.

## 12. Design Tokens

```
--radius-sm: 6px
--radius-md: 10px
--radius-lg: 16px
--radius-pill: 999px      (used only for status/category chips)

--space-1: 4px   --space-2: 8px   --space-3: 12px  --space-4: 16px
--space-5: 24px  --space-6: 32px  --space-7: 48px  --space-8: 64px

--shadow-sm: 0 1px 2px rgba(15,23,42,0.06)
--shadow-md: 0 4px 12px rgba(15,23,42,0.08)
--shadow-lg: 0 12px 32px rgba(15,23,42,0.12)

--border-hairline: 1px solid var(--border)
--icon-sm: 16px  --icon-md: 20px  --icon-lg: 24px

--control-h-sm: 32px  --control-h-md: 40px  --control-h-lg: 48px
```

One radius scale, used consistently: inputs/buttons = `--radius-sm`, cards/panels = `--radius-md`, modals/sheets = `--radius-lg`. No arbitrary radii anywhere else in the app.

## 13. Typography

- **Display/headings:** a high-contrast serif or slab (e.g. "Fraunces" or "Newsreader") — gives the editorial, non-generic feel required. Used for H1/H2 only.
- **UI/body:** a clean grotesk (e.g. "Inter" or "Public Sans") for everything else — forms, tables, labels, buttons.
- **Numeric data (budget figures, dates):** tabular-nums variant of the UI font so budget columns align.

Scale (rem, 16px base):

```
display-xl  3.0   / 1.1   (Landing hero only)
display-lg  2.25  / 1.15  (page H1)
heading-md  1.5   / 1.25  (section H2)
heading-sm  1.125 / 1.3   (card titles)
body-lg     1.0   / 1.5
body-sm     0.875 / 1.5
caption     0.75  / 1.4   (metadata, timestamps)
```

Line length capped at ~72ch for narrative text (Public Trip Story, empty-state copy).

## 14. Color System

Semantic tokens only — never a raw hex in component code.

```
--background            #FFFFFF   (light) / #12151A (dark)
--surface               #F7F5F2   (light) / #1B1F27 (dark)
--surface-elevated      #FFFFFF   (light) / #232833 (dark)
--foreground            #1A1D23   (light) / #F3F4F6 (dark)
--foreground-muted      #5B6472   (light) / #A2AAB8 (dark)
--border                #E4E1DB   (light) / #2D323C (dark)

--brand                 #B5502E   (terracotta — primary accent)
--brand-strong          #8F3E22   (hover/active state of brand)
--success               #1E7A4C
--warning               #B7791F
--danger                #C13333
--info                  #2A6FB0
```

**Verified contrast (WCAG 2.2, sRGB relative-luminance calculation, light theme, rounded):**

| Pair | Approx. ratio | Passes |
|---|---|---|
| `--foreground` (#1A1D23) on `--background` (#FFF) | ~16.5:1 | AAA |
| `--foreground-muted` (#5B6472) on `--background` | ~5.1:1 | AA (body text) |
| `--brand` (#B5502E) on `--background`, used as **button fill with white text** | white on #B5502E ≈ 5.0:1 | AA |
| `--brand` (#B5502E) as **text** on `--background` (e.g. links) | ~4.6:1 | AA (normal text, borderline — use `--brand-strong` #8F3E22 (~6.1:1) for small link text to keep margin) |
| `--success`/`--warning`/`--danger`/`--info` as text on `--background` | all ≥4.5:1 by design (chosen darker than typical "pastel" status colors) | AA |
| `--border` against `--surface` | decorative only, not required to hit text contrast | n/a |

Rule going forward: any new color added to the palette must be run through a contrast checker against both `--background` and `--surface-elevated` before use as text; if it fails, it is restricted to non-text decorative use (chip fill under 3:1 large-graphic exemption, icon-only where redundant with text/label).

Dark theme uses the same relationships inverted; specific dark hexes above are provided as defaults and must be independently contrast-checked before ship — do not assume light-mode ratios transfer.

Category colors (Adventure/Nature/Culture/Food/etc.) are chip **fills with dark-on-light text**, never color-only meaning (always paired with an icon + label so color-blind users aren't relying on hue).

## 15. Spacing & Grid

- Base unit: 4px (see §12 scale).
- Desktop content max-width: 1280px, 12-column grid, 24px gutters.
- Trip Workspace three-pane layout (§28): fixed 240px left rail, fluid center (min 480px), fixed 320px right insights pane; right pane collapses below 1280px viewport (see §20).
- Card internal padding: 16px (compact rows) / 24px (standard cards) — two padding scales only, chosen by density need, documented per component.

## 16. Component System

**Navigation:** Navbar (public/marketing), SideRail (app), TripSubNav, MobileTabBar, Breadcrumbs (Admin only).

**Forms:** Input, DatePicker (range-aware, blocks invalid end<start), Select, SearchField (debounced), Textarea, Slider (budget target), Toggle, ImageUpload.

**Travel:** DestinationCard, ActivityCard, TripCard, DaySection, ItineraryItem, JourneyNode, TripHealthGauge, BudgetBar.

**Data:** BudgetChart (bar + category donut), ProgressBar, Stat, Timeline, VarianceRow (estimated vs actual).

**Feedback:** Toast, InlineAlert, EmptyState, ErrorState, Skeleton, Modal, Sheet (mobile), SaveIndicator, UndoToast, CommandPalette.

Every component in this list must be implemented with the full state set in §17 before it is considered "done" — partial state coverage is a QA-blocking defect, not a follow-up.

## 17. Interaction System — Component States

Every interactive component defines: **default, hover, focus (visible ring, `--brand` at 2px offset), active, selected, disabled, loading, error, success.** Do not ship a component missing any applicable state (disabled/loading may be N/A for purely static components like Stat).

Standard interaction contract used across all mutating actions (add activity, reorder, delete, save trip, share):

```
Before   → control shows default/idle state, prior data visible
During   → optimistic UI update fires immediately; SaveIndicator → "Saving…"
After    → SaveIndicator → "✓ Saved just now" (auto-dismiss after 3s);
           dependent panels (Budget, Health) recompute in the same tick
Failure  → optimistic change reverts; InlineAlert or Toast states the cause
           in plain language ("Couldn't save — check your connection")
           with a Retry action
Recovery → Retry re-attempts the same mutation; persistent failure surfaces
           a "still trying" state rather than silently giving up
```

## 18. Motion System

```
Micro     100–180ms   hover/focus feedback, checkbox/toggle flips
Standard  180–300ms   panel/tab switches, card entrance, drawer open
Emphasis  300–500ms   Trip Health score count-up, budget bar fill, modal open
```

Motion is only ever attached to a state change the user caused or a value that changed (score updates, budget bar re-filling, item reordering with FLIP-style position animation). No ambient/looping decorative motion anywhere. `prefers-reduced-motion: reduce` disables count-up/fill animations and cross-fades in favor of instant state changes; drag-and-drop reordering still functions with reduced motion (position updates without the FLIP animation).

## 19. Accessibility

Target: **WCAG 2.2 AA**, treated as an acceptance criterion per screen (see §44), not a final pass.

- Color contrast: see §14's verified table; re-check any new token before merge.
- Keyboard: every action reachable via Tab/Shift+Tab, activated with Enter/Space; itinerary reordering has a full keyboard path (see below), not just drag.
- Focus: visible 2px `--brand` focus ring on every focusable element, never `outline: none` without a replacement.
- Screen reader labels: all icon-only buttons have `aria-label`; DestinationCard/ActivityCard expose name, cost, duration, and category via accessible text, not color alone.
- Semantic HTML: headings in order (no skipped levels), lists as `<ul>/<ol>`, forms with associated `<label>`.
- Form errors: inline, associated via `aria-describedby`, announced via `aria-live="polite"` region, not color-only.
- Touch targets: minimum 44×44px on mobile controls.
- Reduced motion: honored per §18.
- **Drag-and-drop accessible alternative:** every ItineraryItem has a visible "Move" affordance (kebab menu → "Move to…" opens a small dialog: pick day + position, or use Up/Down buttons that appear on keyboard focus) that performs the identical reorder mutation as drag. Drag is the fast path; the alternative is not degraded functionality.
- **Accessible charts:** BudgetChart and TripHealthGauge always render an adjacent data table or text summary (e.g., "Transport ₹9,200, Stay ₹18,000…") toggleable via a "View as table" control, and the SVG chart carries `role="img"` with a full `aria-label` summary.
- **Accessible dialogs:** focus trap, `Esc` to close, focus returns to the trigger element on close, `aria-modal="true"`.

## 20. Responsive Strategy

**Mobile** <640px · **Tablet** 640–1024px · **Desktop** >1024px

| Aspect | Mobile | Tablet | Desktop |
|---|---|---|---|
| Navigation | Bottom tab bar (5 items) + sheet for overflow | Icon rail + horizontal sub-nav | Full left rail + nested trip sub-nav |
| Itinerary layout | Single column, day switcher as horizontal scroller | Two columns (days list + itinerary), insights in a drawer | Three columns (days / itinerary / insights) |
| Dialogs | Full-height bottom sheets | Centered modals, 560px | Centered modals, 480–640px depending on content |
| Discover | Single column cards, filters in a sheet | 2-column grid, filters as sidebar chips | 3-column grid, filters as sidebar |
| Density | Larger touch targets, 16px card padding | 20px padding | 24px padding |
| Typography | display-lg capped at 1.875rem | as defined in §13 | as defined in §13 |
| Budget chart | Stacked bar + collapsible category list | Bar + donut side by side (stacked if narrow) | Bar + donut side by side |

## 21. Landing

Public marketing page: hero statement ("Plan the trip. Not the spreadsheet." — placeholder copy, confirm final line against §38 tone), primary CTA "Start planning" → Signup, secondary "See a sample trip" → a real Public Trip Story page. No invented stats, no testimonials unless real. A single illustrative sample itinerary strip (clearly labeled "Sample trip") is allowed as demo content.

## 22. Authentication — [SPEC]

Fields exactly as required: **email, password, Login button, Signup link, Forgot Password.** [SPEC]

Signup adds: name, email, password, confirm password, terms checkbox. No social/GitHub login is introduced as a requirement or default path — it is not built in v1; if added later it must appear as a clearly secondary option below the email/password form, never replacing or complicating it (per audit correction #4).

States: idle → validating (inline, on blur) → submitting (button shows spinner, disabled) → success (redirect to Dashboard with a one-time welcome toast) → error (inline field errors for validation; a single InlineAlert above the form for server/auth errors — "Incorrect email or password," never a generic "Error occurred"). Password field has a visibility toggle. Forgot Password is a two-step flow: enter email → "Check your inbox" confirmation screen (does not reveal whether the email exists, for security). Session persists via httpOnly cookie/token refresh; expired session redirects to Login with a "Your session expired — log back in to continue" message, and returns the user to their prior route after re-auth.

## 23. Dashboard

Answers "what do I need to know about my travel," not a generic admin dashboard:

```
Good morning, {name}

Your next trip
  {Trip name} — starts in {N} days
  {Destination sequence, e.g. Tokyo → Kyoto → Osaka}
  Readiness {pct}%   ████████████░░░░
  ₹{spent-est} / ₹{budget-target}
  {N} days · {N} cities · {N} activities
  [ Continue Planning ]

Needs your attention
  ⚠ Day 4 is overloaded (10h 30m scheduled)
  ⚠ Budget is 8% above target
  ○ Day 6 has no activities yet

Discover something new
  {3–4 DestinationCards, "For You" reasoning shown per §9}
```

All numbers are computed from the user's real trip data. If the user has no trips, this whole block is replaced by the empty state in §36. "Needs your attention" only renders items that are actually true (no placeholder warnings); if the trip is healthy, this section is replaced by a single positive line ("Everything's on track for {trip name}.").

## 24. Discover — [SPEC: City Search + Activity Search]

```
Discover
Where do you want to go?
[ Search destinations… ]

Filters: Country ▾  Region ▾  Cost index ▾  Popularity ▾
Pills: Popular · For You · Budget Friendly · Adventure · Nature · Culture · Food

[ DestinationCard grid ]
  City, country
  Cost index (₹/day band)
  Popularity indicator
  "Add to Trip" (opens trip-picker if no trip is active; adds directly if inside a Trip Workspace)
```

Selecting a destination opens a detail panel/sheet with an **Activities** tab: filter by category (Adventure/Nature/Culture/Food/Sightseeing/Shopping/Nightlife/Relaxation), cost, duration, difficulty; each ActivityCard shows description, image, cost, duration, and an add/remove toggle reflecting current trip membership. This satisfies both PDF screens 7 and 8 as one connected surface rather than two disconnected search pages.

Empty search state, loading skeletons, and debounced search (300ms) per §26/§37.

## 25. My Trips — [SPEC]

Trip cards show: cover image, title, date range, destination count, activity count, budget summary, progress bar, status badge. Statuses: **Planning · Ready · Upcoming · Active · Completed** (computed from dates + readiness score, not manually set). Card actions: View, Edit, Duplicate, Share, Delete (Delete requires confirmation — destructive, per §30). Toolbar: search, sort (recent/date/name), filter by status. Empty state per §36.

## 26. Create Trip — [SPEC]

Required fields: trip name, start date, end date, description, cover image (optional upload with a curated fallback image if skipped). Improved with optional: budget target, currency, travel style (Adventure/Relaxation/Backpacking/Luxury/Family/Cultural/Food/Nature/Road Trip), interest tags (feeds "For You" reasoning in Discover). Date picker blocks end < start and shows trip length live ("7 days"). On Save, the trip is created and the user is taken directly into its Trip Workspace Overview — not back to My Trips — reinforcing the "create → workspace" continuity from §4 of the master prompt.

## 27. Trip Workspace

The architectural core (audit correction #1). One persistent trip context object (trip id, name, dates, currency, budget target) is held in a shared client store and read by every tab below — switching tabs never re-fetches trip identity, only tab-specific data. Tabs: **Overview · Itinerary · Discover · Calendar · Budget · Health · Share**, always in this order, always with the trip name + date range visible in a slim header regardless of which tab is active.

**Overview** = read-only summary: Journey Visualization (§14 of concept), readiness %, quick stats, "Needs attention" list (same logic as Dashboard, trip-scoped), shortcuts into Itinerary/Budget/Health.

## 28. Itinerary Builder — [SPEC, hero surface]

Three-pane desktop layout:

```
┌ DAYS ──────┬ ITINERARY ─────────────────┬ INSIGHTS ─────────┐
│ Day 1      │ 09:00 Breakfast            │ Trip Health  92    │
│ Day 2      │ 10:30 Museum   ₹800        │                     │
│ Day 3  ●   │ 13:00 Lunch    ₹350        │ Budget              │
│ Day 4  ⚠   │ 15:00 Temple   ₹0          │ ₹8,400 remaining    │
│ Day 5      │ 19:00 Dinner   ₹1,200      │                     │
│ + Add day  │ + Add activity              │ Suggestions         │
└────────────┴─────────────────────────────┴────────────────────┘
```

- **Drag/drop:** pick up an ItineraryItem, drop between two existing items or onto a different day in the left rail; a horizontal insertion-line indicator shows exact drop position; drop is invalid (rejected, item springs back) only if it would place an item before the trip's start date or after its end date.
- **Keyboard:** item receives focus → `Space` picks it up (announces "Grabbed. Use arrow keys to move, Space to drop" via live region) → Arrow Up/Down moves within day, Arrow Left/Right moves to adjacent day → `Space` drops, `Esc` cancels and returns to original position. This is the same underlying mutation as the "Move to…" dialog in §19, so both stay in sync by construction.
- **Touch:** long-press (150ms) to pick up, drag with a lifted-shadow visual, auto-scroll near the edges of the day list when dragging.
- **Insertion points:** an always-visible "+ Add activity" row at the end of each day, plus a thin hover-revealed "+" between any two existing items.
- **States:** hover (raise shadow), selected (brand-colored left border), edit (inline field editing on click: time, cost, note), deletion (item collapses with a 200ms height animation, replaced by an UndoToast for 6s — see §30), loading (skeleton rows while a day's data fetches), empty (per-day empty state: "This day still has room for something memorable" + "Explore activities" CTA into Discover), error (row shows a small inline error icon + retry if its own save failed, without blocking the rest of the day).
- **Autosave & conflict handling:** every edit autosaves per §17's contract; if a second device/tab has modified the same day since last sync, the client detects a version mismatch on save and shows "This day changed elsewhere — reload to see the latest" rather than silently overwriting (last-write-wins is explicitly rejected for itinerary data because it can silently drop a user's edits).
- **View mode toggle** (satisfies PDF Itinerary View screen): a segmented control switches the center pane between this day-by-day builder and a compact read-only grouped-by-city list view, used for quick review before sharing.

## 29. Calendar / Timeline — [SPEC]

Not a generic embedded calendar widget. A vertical timeline grouped by day, each day expandable/collapsible, showing time-blocked activities with cost, and city context headers when the trip spans multiple stops ("KYOTO — Day 3 of 3"). Drag-to-reorder here uses the identical interaction/mutation as the Itinerary Builder (§28) — this view is a different lens on the same data, not a separate editable model. Quick-editing (tap a block → inline time/cost edit) is available without leaving the timeline.

## 30. Budget — [SPEC]

Distinguishes **Estimated/Planned Cost** from **Actual Expense** explicitly (audit correction #5) — these are separate fields on every itinerary item and separate rollups at the trip level:

```
TRIP BUDGET

Planned            ₹42,600  of ₹50,000 target   ████████████░░░ 
Actual so far       ₹18,300  (entered expenses only)
Variance            +₹2,300 vs. plan (if any actual expenses logged)

By category (planned):
  Transport   ₹9,200
  Stay        ₹18,000
  Activities  ₹7,400
  Food        ₹6,000
  Misc        ₹2,000

Daily breakdown, highest-cost day flagged, over-budget days flagged
```

Users can optionally log an Actual Expense against any itinerary item (separate "Log expense" action, distinct field, distinct visual treatment — actual amounts render in `--foreground`, planned amounts in `--foreground-muted`, both always labeled with their kind, never bare numbers). If no actual expenses are logged, the Actual/Variance rows are simply omitted rather than shown as ₹0 (which would misleadingly imply nothing was spent). Contextual insight line beneath the chart states the single most useful fact ("Day 4 is your most expensive day at ₹6,200" or "You're ₹7,400 under target — nice work").

## 31. Trip Health — [DIFF, first-class]

```
Trip Health
92 / 100

Budget              94
Schedule balance    82
Destination flow    96
Activity density    87
Completeness        91
```

Deterministic scoring only, computed in FastAPI from real trip data (no ML, no external call):

- **Budget** — planned total vs. target, penalized for over-budget days.
- **Schedule balance** — variance in scheduled hours per day; a day >9h scheduled or >2h gaps flagged.
- **Destination flow** — geographic/order sanity (no backtracking between stops without transport logged).
- **Activity density** — activities-per-day vs. a reasonable band for the trip's pace/style.
- **Completeness** — % of days with at least one activity, required trip fields filled.

Each sub-score is clickable and expands to the exact rule and the specific offending item, e.g.: *"Day 4 contains 10.5 hours of scheduled activities. Move one activity to Day 5 to improve schedule balance."* with a **[ Move it for me ]** one-click fix that opens the same Move dialog from §19/§28 pre-filled with the suggested target day — this is the "Optimize" step of the core loop (§8) made concrete. The overall score and each sub-score recalculate live (Emphasis-duration count-up animation, §18) whenever the itinerary or budget changes.

## 32. Recommendations — [DIFF]

Never a bare "Recommended for you." Every DestinationCard/ActivityCard recommendation carries one explicit reason, chosen from the strongest matching signal:

- "Recommended because you like {interest tags}"
- "Fits your budget — est. ₹{x}, your target is ₹{y}/day"
- "Good fit for Day {n} — {duration} currently open"

Reasoning is computed from stored trip/interest data (interest tags from Create Trip, remaining budget from §30, open time blocks from §28/§29) — deterministic, not a black box.

## 33. Profile & Settings — [SPEC]

Required: name, photo, email, language, saved destinations list, delete account (destructive — confirmation per §30 of interaction rules). Added: currency, default travel-style preference, notification preferences, accessibility preferences (reduced motion toggle mirroring `prefers-reduced-motion`, high-contrast mode toggle). Delete account is a two-step confirmation (type trip/account name to confirm) — never a single click.

## 34. Public Sharing — [SPEC]

A premium "travel story" page at a readable slug (`/t/{trip-name}-xyz123`, not a raw ID), not `localhost/shared/123`. Read-only: journey visualization header, day-by-day summary, cover imagery, trip stats (dates, cities, days) — no budget figures unless the owner explicitly opts to show cost, and never actual-expense data on the public page even if opted in (privacy default: show planned totals only, never a full expense ledger). Actions: **Copy Trip** (clones the full itinerary into the viewer's own account, prompting signup/login first if needed), social share (native share sheet on mobile, copy-link + share icons on desktop). No editing controls, no owner-only data leak (verify server-side, not just hidden client-side).

## 35. Admin — [OPT, per PDF]

Build only if time remains. Tables/charts of: trips created over time, top cities, top activities, engagement stats, basic user management. All charts pull from real Postgres aggregates — no fabricated numbers, ever, even as placeholder demo content (use "No data yet" empty states instead of fake bars).

## 36. Empty States

Never "No data found." Always product-voiced with a recovery action:

- No trips: **"Your next adventure starts here."** → [ Plan your first trip ]
- No activities on a day: **"This day still has room for something memorable."** → [ Explore activities ]
- No search results: **"Nothing matches yet — try a different city or filter."** → [ Clear filters ]
- No saved destinations: **"Save places you're curious about — they'll show up here."**
- No expenses logged: (Budget) omit the row entirely, per §30 — not an empty-state card.

## 37. Loading States

Skeleton placeholders (not spinners, not blank screens) matching final layout shape for: Dashboard cards, Trip cards grid, Destination/Activity cards, Itinerary day rows, Budget chart, Profile form. Skeletons appear only after a short delay threshold (~150ms) to avoid flashing on fast responses.

## 38. Error States

Every error has an explanation in plain language + a recovery action, never a raw error code shown to the user:

| Case | Message pattern | Recovery |
|---|---|---|
| Network failure | "You're offline — changes are saved locally." | Auto-retry on reconnect (§39) |
| Validation failure | Inline, field-specific, on blur and on submit | Fix and resubmit |
| Server error (5xx) | "Something went wrong on our end." | [ Try again ] |
| Unauthorized/session expired | "Your session expired." | Redirect to Login, return to prior route after |
| Empty search | see §36 | Clear filters |
| Failed save | Toast: "Couldn't save that change." | [ Retry ] inline on the affected row |
| Failed share | "Couldn't create the share link." | [ Try again ] |
| Stale data (conflict) | see §28 | [ Reload day ] |

## 39. Offline / Degraded Network UX

Current trip (last-loaded state) is cached client-side. Read access continues offline; an offline indicator (small persistent banner, not a blocking modal) appears; edits made offline are queued locally and marked "Pending sync" on the affected rows; on reconnect, queued edits sync automatically with the same conflict-detection path as §28 (a queued edit that now conflicts is surfaced for the user to resolve, never silently dropped or silently overwritten).

## 40. Performance UX

Lazy-load below-the-fold Discover results and images (native `loading="lazy"` + explicit width/height to prevent layout shift); debounce search inputs 300ms; paginate/virtualize long trip lists and activity grids; cache trip/discover queries client-side (TanStack Query) with background revalidation; skeletons per §37 so nothing renders blank; images served at appropriate responsive sizes from local/bundled assets per §41.

## 41. Content / UX Writing

Tone: **confident + warm + concise + adventurous.** No corporate/system-speak.

| Avoid | Use instead |
|---|---|
| "Trip data successfully persisted." | "Your trip is saved." |
| "No records available." | "Your next adventure starts here." |
| "Error occurred during processing." | "Something went wrong on our end." |
| "User authentication failed." | "Incorrect email or password." |
| "Item deleted successfully." | "Removed. [ Undo ]" |

Numbers are always paired with their unit and kind (₹, "planned" vs "actual," "days" vs "hours") — never a bare figure.

## 42. Do Not Make It Look AI-Generated / Do Not Overuse Cards

Explicit constraints carried into every screen above: no purple/blue gradient "AI" aesthetic, no glassmorphism, no decorative gradient blobs, no more than one card style per surface, no animation without a state-change reason, no fake statistics anywhere (including Admin). Visual rhythm is varied deliberately: Itinerary Builder is a list/timeline, Calendar is a timeline, Budget is charts + a data table, Journey Visualization is a vertical node sequence, Public Trip Story is full-bleed editorial imagery — cards are reserved for genuinely card-shaped content (trips, destinations, activities), not used as a default container for everything.

## 43. Image Strategy

Local/bundled optimized images and SVG illustration for destinations without a user-uploaded cover photo (curated fallback set keyed by region/category, not a live external image API) — the app must remain fully usable if no external image service is reachable, per the minimal-dependency constraint in §8/§54 (implementation target).

## 44. Implementation Guidance (subordinate to UX — kept brief deliberately, per audit correction #7)

- **Stack:** React + TypeScript + Vite + Tailwind (tokens from §12/§14 as CSS variables/Tailwind theme extension) + Motion (Framer Motion) + Lucide icons + React Hook Form + Zod + TanStack Query + Recharts (Budget/Health charts) + dnd-kit (Itinerary drag/drop, with the keyboard path in §28 as dnd-kit's built-in keyboard sensor). Backend: FastAPI + Pydantic + SQLAlchemy + PostgreSQL. Keep the API surface small; no third-party maps/places/booking APIs (per §8 of the master prompt).
- **Data-model relationships the UX depends on** (audit correction #6 — stated at the level the frontend needs, not a full schema):

```
Trip (name, dates, currency, budget target, style, interests, share slug)
  └─ TripStop (city/destination, order index, start date, end date)
       └─ Day (date, derived from stop's date range)
            └─ ItineraryItem (type: activity | transport | meal | note,
                               time, duration, estimated_cost, position index,
                               optional linked ActivityCatalog entry)
                 └─ ActualExpense (amount, date logged) — zero or one per item, optional
```

  - A **Trip Stop** is a city/destination the trip visits, with its own date sub-range within the trip's overall dates.
  - A **Day** is derived (one row per calendar date within a stop's range) and is the unit the Itinerary Builder's left rail iterates over.
  - An **Itinerary Item** belongs to exactly one Day and has a position index within that day (this index is what drag/drop and the keyboard path both mutate).
  - **Estimated Cost** lives on the Itinerary Item; **Actual Expense** is a separate, optional record referencing it — Budget's planned totals sum estimated_cost, actual totals sum logged ActualExpense only where present (§30).
  - Moving an item (day or position change) updates its Day reference and position index only; estimated_cost is untouched by moving, which is what makes Trip Health's schedule-balance recalculation and Budget's day-grouping recompute correctly from the same write.
  - Transport items are itinerary items with `type: transport`, contributing to Destination Flow health scoring when present between stops.

## 45. User Flows

Each flow: entry → actions → feedback → success → failure → recovery.

1. **Signup → Dashboard:** Landing → Signup form → submit (validating→submitting states, §22) → success toast → Dashboard (empty state if no trips, §36). Failure: inline/server error per §22; recovery: correct and resubmit.
2. **Dashboard → Create Trip → Trip Workspace:** [ Plan New Trip ] → Create Trip form (§26) → Save (loading state on button) → lands directly in Overview of the new Trip Workspace. Failure: validation inline; recovery: fix fields, resubmit.
3. **Discover → Destination → Add to Trip:** search/filter → open DestinationCard detail → [ Add to Trip ] (trip picker if none active) → optimistic add, SaveIndicator, Itinerary/Overview update. Failure: revert + retry toast (§17).
4. **Trip → Add Activity → Schedule:** Discover (trip-scoped) → activity detail → Add → item appears in the trip's first open day → user drags/keyboard-moves it to the desired day/time (§28). Failure: invalid drop (outside trip dates) springs back with an inline reason.
5. **Reorder activity → Trip Health updates:** drag or keyboard move (§28) → position/day updates optimistically → Health sub-scores recalc with count-up animation (§18/§31) → autosave confirms.
6. **Budget changes → visualization updates:** add/edit/remove an item's estimated_cost or log an actual expense → Budget bar, category breakdown, and Health "Budget" sub-score all recompute in the same render cycle.
7. **Share → Public itinerary → Copy Trip:** Trip Workspace → Share tab → toggle "show budget totals" (optional) → [ Copy public link ] → visit `/t/{slug}` → viewer clicks [ Copy Trip ] → if unauthenticated, prompted to sign up/login → trip clones into their account → lands in their own new Trip Workspace.
8. **Mobile planning:** bottom tab bar (§24) → Itinerary tab → day switcher (horizontal scroll) → long-press to drag or tap kebab → "Move to…" sheet (§19) → confirm → sheet closes, SaveIndicator confirms.
9. **Offline/degraded network:** offline banner appears → user edits itinerary → item marked "Pending sync" → reconnect → auto-sync → conflict (if any) surfaced per §28/§39, else silent success.

## 46. Demo Flow (3–5 minutes)

```
Landing → Dashboard → Create trip → Add 3 cities (Discover)
→ Drag/reorder in Itinerary → Add activities → Calendar view
→ Trip Health flags an overloaded day → [ Move it for me ] fixes it live
→ Budget updates automatically → Discover shows a "Fits your budget" pick
→ Add it → Share tab → open Public Trip Story in a new tab → Copy Trip
```

This sequence visibly demonstrates design + interaction + deterministic intelligence + real database-backed state in one continuous narrative, matching the DISCOVER→PLAN→VALIDATE→OPTIMIZE→SHARE loop rather than jumping between disconnected screens.

## 47. WOW Moments

1. Creating a trip drops the user straight into a live Trip Workspace, not a confirmation screen.
2. Dragging an activity visibly moves the Trip Health score (count-up animation) in the same view.
3. Adding an activity updates the Budget bar before the user even leaves the Itinerary tab.
4. Every recommendation states its reason in one line — no black-box "Recommended for you."
5. The Public Trip Story page looks like a finished travel feature, not a raw data dump — and "Copy Trip" actually clones working data into a new account, live, on stage.

## 48. UX Acceptance Criteria (per screen, minimum bar)

A screen is not "done" until: all applicable states in §17 exist; keyboard path exists per §19; empty/loading/error states exist per §36–38; any data-changing action follows the autosave/undo/confirm contract in §17/§30 below; mobile layout per §20 has been designed, not just reflowed; contrast has been checked against §14, not assumed.

## 49. Autosave, Undo & Confirmation Rules

- **Autosave:** all Itinerary/Budget/Trip edits autosave per the §17 contract; no explicit Save button for these surfaces.
- **Undo:** reversible actions (remove activity, remove destination, unschedule item) show an UndoToast for 6 seconds: *"Activity removed. [ Undo ]"*. No confirmation dialog for these.
- **Confirmation required (destructive, non-undoable within the session):** delete trip, delete account. Both require typing the trip/account name to confirm — a checkbox or single click is not sufficient.

## 50. Quick Add / Command Palette — [OPT, P1 if time-limited]

`Cmd/Ctrl+K` opens a palette: search across Destination / Activity / Note / Expense / Transport, scoped to the active trip if one is open. Mobile equivalent: a persistent "+" floating action button opening the same options as a bottom sheet. Build after core Itinerary/Budget/Health flows are solid — this is a velocity feature, not core to the demo narrative.

## 51. Trip Templates — [OPT]

Optional starter templates (Weekend Escape, Japan Adventure, European Backpacking, Mountain Retreat, Family Holiday) pre-populate a new trip's stops/activities/style, fully editable afterward via [ Use Template ] on the Create Trip screen. Build only if core flows are complete.

## 52. Design QA Checklist

```
[ ] No generic dashboard appearance
[ ] No arbitrary colors — every token traced to §14
[ ] No contrast failures — checked, not assumed
[ ] No dead buttons
[ ] No fake statistics anywhere, including Admin
[ ] No fake AI — Trip Health/recommendations are rule-based and explained
[ ] No unexplained recommendations
[ ] No inconsistent components — one style per component type
[ ] No random border radii — one scale, §12
[ ] No excessive cards — layouts vary per §42
[ ] No excessive gradients
[ ] No excessive animation — every motion tied to a state change
[ ] Mobile intentionally designed, not just reflowed
[ ] Keyboard navigation works, including itinerary reorder
[ ] Focus states visible everywhere
[ ] Reduced motion supported
[ ] Loading states exist on every data surface
[ ] Empty states exist and are product-voiced
[ ] Error states exist with explanation + recovery
[ ] Success states exist (SaveIndicator, toasts)
[ ] Autosave feedback exists
[ ] Undo exists for reversible actions
[ ] Destructive actions require typed confirmation
[ ] Trip context persists across all Workspace tabs
[ ] Budget updates dynamically from real itinerary data
[ ] Trip Health updates dynamically and explains itself
[ ] Public sharing works and hides private data server-side
[ ] Copy Trip works end-to-end, including signup detour
[ ] No unnecessary third-party API dependency (maps/places/booking)
[ ] Estimated cost and actual expense are visually and semantically distinct
```

## 53. Why GlobeTrotter Wins

Not "we have more features." GlobeTrotter connects discovery, planning, validation, budget intelligence, and sharing into one continuous workflow around a single persistent Trip Workspace — every edit anywhere in that workspace visibly changes the Budget and Trip Health in the same interaction, and every number and recommendation the product shows explains where it came from. That loop, not the screen count, is the product.

---

## Appendix (subordinate to UX — build/ops reference only)

The following is carried forward from the draft's technical material. It exists to support implementation, not to define the product; if anything here ever conflicts with §1–§53, the UX sections win.

### 54. Data Contracts (illustrative, not exhaustive)

Endpoints mirror the data model in §44: `/auth/*`, `/trips/*`, `/trips/{id}/stops/*`, `/trips/{id}/activities/*`, `/destinations/search`, `/activities/search`, `/budget?trip_id=`, `/calendar?trip_id=`, `/trips/{id}/share`, `/profile`, `/admin/analytics`. Every mutating endpoint returns enough of the updated trip/day/budget/health payload for the client to reconcile its optimistic update without a second round-trip. Budget responses must return `planned` and `actual` as distinct fields (never a single merged `spent`), per §30.

### 55. Database Schema Reference

Core tables: `users`, `trips`, `trip_stops`, `destinations` (seeded catalog), `activities` (seeded catalog), `categories`, `itinerary_items`, `actual_expenses` (separate from planned cost, per §30/§44), `shared_trips` (holds the readable `public_slug`), `saved_destinations` (M:N users↔destinations), `user_preferences`, and optionally `audit_events`. This is the same relationship shape as §44's model, expressed as tables; `itinerary_items.estimated_cost` and `actual_expenses.amount` remain separate columns/tables, never one field.

### 56. Seed Data

The app must never look empty or hard-coded in a demo. Seed with: ~50 destinations (`name, country, cost_index, popularity, image_url`), ~200 activities across the 8 categories in §11/§24 tied to those destinations, and at least one fully-built demo trip (multi-city, multiple days, a deliberately overloaded day, a deliberately over-budget category) under a test account so Trip Health, Budget, and the Journey Visualization all render meaningfully the moment a judge logs in. All demo data is real rows in Postgres, not client-side mocks — satisfies the "no static JSON" constraint.

### 57. Build-Order Priority (not the product's framing — see §8/§53 for that)

- **P0 (must work for the demo):** Auth (§22), Dashboard (§23), Create Trip → Trip Workspace (§26–27), Discover (§24), Itinerary Builder (§28), Budget with planned/actual split (§30), Calendar (§29), Public Share + Copy Trip (§34), responsive layouts (§20).
- **P1:** Drag-and-drop polish + keyboard/accessible alternative (§19/§28), Trip Health (§31), autosave/undo (§49), micro-motion (§18).
- **P2 (time-permitting):** Admin analytics (§35), Quick Add/Command Palette (§50), Trip Templates (§51), deeper personalization in Discover reasoning (§32).

### 58. Deliverables & Handoff

Git repo with `/frontend` (Vite+React+TS) and `/backend` (FastAPI+SQLAlchemy+Alembic), `docker-compose.yml` for Postgres + both services, a README covering env setup and seeding, FastAPI's auto-generated OpenAPI docs, migration/seed scripts (§56), this document as the design spec, and one pre-built demo account/credentials so judges can log in with data already populated rather than building a trip live from zero.

### 59. QA Checklist (build/test reference — the product-level checklist is §52)

Auth flows and error states; trip CRUD + duplicate; search + filters; itinerary add/remove/reorder with no data loss across list/calendar views; budget totals reconcile from real itinerary + expense rows, including the planned/actual split; public share renders correctly logged-out and Copy Trip clones all data; profile updates persist; authorization (a user cannot read/write another user's trip; admin routes gated); form validation and friendly error messages (§38); responsive check on real breakpoints (§20); Lighthouse/axe accessibility pass (§19); simulated network failure shows the offline/error states in §38–39, not a blank screen; passwords hashed, sessions expire correctly.
