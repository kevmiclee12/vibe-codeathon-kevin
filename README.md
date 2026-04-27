# Verification Layer · Private Markets Demo

A demo dashboard that builds a **truth layer for private markets** by
cross-checking what GPs report in their pitch deck against what they file
with the SEC (EDGAR Form D).

The product framing is deliberately soft: instead of accusing GPs of
inconsistencies, every datapoint gets a **confidence label** —

- 🟢 **Verified** · cross-checks with regulatory filings
- 🟡 **Partially Verified** · GP-disclosed with limited third-party validation
- ⚪ **Self-reported** · provided by the GP, not independently verified

The featured GP is **Sequoia Capital**. SEC EDGAR is **live** — pitch-deck
inputs are seeded for illustration.

---

## Stack

- **Client**: Vue 3 + TypeScript + Vite + Pinia + Tailwind CSS
- **Server**: Node 20 + Express + TypeScript (`tsx watch`) — proxies SEC EDGAR
  with a proper `User-Agent`, parses Form D `primary_doc.xml`, and caches
  responses in-memory
- **EDGAR endpoints used** (live):
  - `https://efts.sec.gov/LATEST/search-index` (full-text search)
  - `https://data.sec.gov/submissions/CIK{cik}.json` (per-CIK submissions)
  - `https://www.sec.gov/Archives/edgar/data/{cik}/{acc}/primary_doc.xml`
    (Form D structured data — total offering, total sold, investor count,
    related persons)

---

## Getting started

Requires Node ≥ 20 and npm ≥ 10.

```bash
# 1. Install all dependencies (root, server, client)
npm run install:all

# 2. Run server + client together
npm run dev
```

This starts:

- **EDGAR proxy** at `http://localhost:5174`
- **Vue client** at `http://localhost:5180` (or next free port)

Open the client URL in your browser. Live EDGAR data loads automatically on
first paint; the header has a **Refresh** button.

> **Note on SEC EDGAR**: SEC requests that all clients identify themselves via
> a `User-Agent` header. The server sets one by default, but you can override
> it via the `SEC_USER_AGENT` env var:
>
> ```bash
> SEC_USER_AGENT="Acme Inc. ops@acme.com" npm run dev
> ```

---

## What you see

### Summary view (default)

- **Verification Hero** — overall **Data Confidence** %, verification tier
  badge (Fully / Partially / Self-reported), and **Data Completeness** bar.
- **Verification by datapoint** — one card per metric showing source coverage
  (Deck / EDGAR / both) and a confidence chip with a soft, non-accusatory
  explainer where filings differ.
- **Deck × EDGAR cross-check** — side-by-side context, designed to imply
  rather than accuse.
- **Verification opportunities** — gaps that, when filled, upgrade the
  profile's tier (positive reinforcement, not policing).
- Sections for **Fundraising**, **EDGAR live filings**, **Team**,
  **Performance**, **LP Base** — clearly labeled by source and confidence.

### Sources view (toggle in header)

- Compact provenance table: Metric · Deck · EDGAR · Source(s) · Confidence.
- For power users (LPs) who want to see exactly where each number came from.

---

## Verification dimensions

Every datapoint is scored along seven dimensions, each with internal
weights. The score is presented as **tiers** (badges) and a **% Data
Confidence**, never as a raw "credibility number" pointing at the GP.

| Dimension              | Weight | Comparison                                                                  |
| ---------------------- | ------ | --------------------------------------------------------------------------- |
| 💰 Capital Raised      | 30%    | Deck "raised to date" vs largest matching entity's latest Form D `totalAmountSold` |
| 👥 Investor Count      | 15%    | Deck LP count vs EDGAR `totalNumberAlreadyInvested`                         |
| 🎯 Target vs Reality   | 15%    | Deck-implied % to target vs EDGAR-implied % to target                       |
| ⏱️ Fundraising Timeline | 10%    | Deck first-close date vs first Form D filing                                |
| 🏛️ Entity Structure    | 10%    | Deck-named fund vs distinct related entities on EDGAR                       |
| 🧑‍💼 Key Personnel       | 10%    | Deck partner list vs Form D `relatedPersonsList`                            |
| 💵 Minimum Investment  | 10%    | Deck minimum vs Form D `minimumInvestmentAccepted`                          |

### Numeric tolerances

- Drift ≤ 10% → **Verified**
- Drift > 10% → **Partially Verified** with a soft, non-accusatory explainer
- We never escalate to a public "Conflicted" label — the framing is always
  "may differ due to timing or fund structure"

### Master/feeder & cumulative-amendment handling

Form D amendments are **cumulative**, not deltas. To avoid double-counting:

- `latestPerEntity()` keeps only the most recent filing per CIK.
- `largestLatestFund()` picks the single largest entity (by `totalAmountSold`)
  as the proxy for "the fund" — useful for permanent-fund / master-feeder
  structures where summing across entities would mislead.

---

## Project structure

```
.
├── package.json                    # Orchestrates server + client via concurrently
├── server/                         # EDGAR proxy + Form D parser
│   └── src/
│       ├── index.ts                # Express routes, in-memory cache
│       └── edgar.ts                # SEC fetch + XML parsing
└── client/                         # Vue 3 dashboard
    └── src/
        ├── App.vue
        ├── components/
        │   ├── Dashboard.vue
        │   ├── HeaderBar.vue       # View toggle + EDGAR live indicator
        │   ├── VerificationHero.vue
        │   ├── VerificationGrid.vue
        │   ├── ReconciliationPanel.vue   # Deck × EDGAR cross-check
        │   ├── ProfileGapsPanel.vue       # Verification opportunities
        │   ├── SourcesView.vue            # Power-user provenance table
        │   ├── sections/
        │   │   ├── FundraisingSection.vue
        │   │   ├── EdgarLiveSection.vue
        │   │   ├── TeamSection.vue
        │   │   ├── PerformanceSection.vue # Self-reported (no EDGAR equivalent)
        │   │   └── LPBaseSection.vue      # Self-reported (no EDGAR equivalent)
        │   └── ui/                        # ConfidenceBadge, TierBadge, ScoreRing, etc.
        ├── data/sequoia.ts                # Seeded GP profile (deck-side only)
        ├── services/
        │   ├── edgar.ts                   # Frontend EDGAR client (calls /api/...)
        │   └── verification.ts            # Per-datapoint confidence engine
        ├── stores/gp.ts                   # Pinia store + view toggle
        └── types/gp.ts
```

---

## Endpoints (server)

| Method | Path                                | Purpose                                            |
| ------ | ----------------------------------- | -------------------------------------------------- |
| GET    | `/api/health`                       | Liveness                                           |
| GET    | `/api/edgar/search?q=...&forms=D`   | Full-text Form D search                            |
| GET    | `/api/edgar/submissions/:cik`       | Recent filings for a single CIK                    |
| GET    | `/api/edgar/form-d?cik=&accession=` | Parsed Form D primary doc                          |
| GET    | `/api/edgar/sequoia/overview`       | Search Sequoia + parse top N + aggregate (default) |

In-memory cache: 5 minutes (search/overview), 24 hours (parsed Form Ds).

---

## Design principles

The product follows the philosophy that **soft enforcement via visibility**
shapes GP behavior more than blunt accusations.

- **Never accuse, always show confidence.** "This GP is inconsistent" → "Here
  is how verified and complete this data is."
- **Three tiers, not red/green.** Red is reserved for genuinely critical
  states; the default escalation is `verified → partial → self`.
- **Discrepancies are implied, not declared.** Soft language ("may differ
  due to timing or fund structure") preserves trust on both sides.
- **Positive reinforcement.** "Profile is now 90% verified" is more useful
  than "missing 4 fields."

These choices aim to make the platform feel like a **data-quality
amplifier** — institutional-grade transparency that GPs *want* to optimize
toward.

---

## Notes

- Pitch-deck inputs for Sequoia in `client/src/data/sequoia.ts` are
  illustrative only. They are tuned to produce a realistic demo narrative
  (a small capital-raised drift, a larger investor-count drift on the LP
  side) without claiming anything about the real firm's actual metrics.
- The EDGAR data is **real**, fetched live from SEC.
- Designed to be re-pointable to any other GP by editing `sequoiaProfile`
  and the search query in `client/src/services/edgar.ts`.
