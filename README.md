# Verification Layer · Private Markets Demo

A demo dashboard that builds a **truth layer for private markets** by
cross-checking a GP's platform-submitted fund record against what they file
with the SEC — both **EDGAR Form D** (offerings) and **IAPD** (adviser
registry).

The product framing is deliberately soft: instead of accusing GPs of
inconsistencies, every datapoint gets a **confidence label** —

- 🟢 **Verified** · GP-submitted value aligns with a regulatory source
- 🟡 **Partially Verified** · regulatory source exists but with material drift
- ⚪ **Self-reported** · provided by the GP, no public regulatory equivalent
- ⏳ **Pending** · GP hasn't disclosed this datapoint yet

The featured fund is **Pershing Square, L.P.** (PSLP), filed under
**Pershing Square Capital Management, L.P.** (CRD 132982). Both EDGAR Form D
and IAPD are queried **live**; the GP-submitted side is seeded.

---

## Stack

- **Client**: Vue 3 + TypeScript + Vite + Pinia + Tailwind CSS
- **Server**: Node 20 + Express + TypeScript (`tsx watch`) — proxies SEC
  EDGAR and IAPD with a proper `User-Agent`, parses Form D
  `primary_doc.xml`, and caches responses in-memory
- **Live SEC endpoints used**:
  - `https://efts.sec.gov/LATEST/search-index` — EDGAR full-text search
  - `https://data.sec.gov/submissions/CIK{cik}.json` — per-CIK submissions
  - `https://www.sec.gov/Archives/edgar/data/{cik}/{acc}/primary_doc.xml`
    — Form D structured data (offering size, amount sold, investor count,
    minimum investment, related persons)
  - `https://api.adviserinfo.sec.gov/search/firm` — IAPD adviser search
    (registration scope, SEC#, disclosure flags, profile + ADV brochure URLs)

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

- **EDGAR / IAPD proxy** at `http://localhost:5174`
- **Vue client** at `http://localhost:5180` (or next free port)

Open the client URL in your browser. Live SEC data loads automatically on
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

The dashboard is a single page, organised top-to-bottom:

### 1. Header bar

Sticky header with the fund name, firm name, and a live status chip
(`Fetching SEC…` / `SEC live · 2m ago` / `SEC error`). A **Refresh** button
re-runs the live queries against EDGAR and IAPD.

### 2. Fund banner

Hero card with the fund's identity (name, firm, location, inception,
strategy), short description, fundraising-status pill, the overall
**Verification Tier** badge, and a **Data Confidence** ring (0–100%, rolled
up from the per-check scores). Three small counters underneath show how
many datapoints are Verified / Partial / Self-reported.

### 3. Fund stats row

Six KPI cards covering the headline numbers an LP scans first:

| Stat | Confidence |
| ----------------------- | ------------------------------------ |
| Fund AUM (USD)          | tied to Fundraising Cross-check      |
| Inception               | tied to Filing Timeline check        |
| Minimum Investment      | tied to Minimum Investment check     |
| Annualized Return       | self-reported (no SEC equivalent)    |
| Largest Drawdown        | self-reported (no SEC equivalent)    |
| Sharpe Ratio            | self-reported (no SEC equivalent)    |

Each card carries its own confidence chip so the LP knows at a glance which
numbers are externally verifiable and which are GP-only.

### 4. Regulatory cross-check panel

The core of the demo. One card per dimension, each with:

- **GP-submitted** value (left)
- **Regulatory source** value (right) — clickable through to EDGAR / IAPD
- A confidence chip, a neutral one-line headline, and a soft explainer if
  there's drift
- A delta line (`Aligned`, `−6% on regulatory source`, etc.) where numeric

Below the cards, a **Data discrepancy flags** list summarises any
`watch` / `review` / `info`-severity observations — phrased as data
differences, not verdicts.

### 5. Detail sections

Two columns of section cards, each with its own confidence chip:

- **About this fund** — strategy, manager bio, sectors, geography (self)
- **Service Providers** — prime brokers, legal, admin, auditor (self)
- **Investment Team** — partner roster; names corroborated against Form D's
  related-persons list when possible
- **Fund Performance** — return / drawdown / risk metrics with a sparkline
  (self)
- **Fund Terms** — fees, lock-up, redemption frequency, hurdle (self)
- **Documents** — links to deck, ADV PDF, analytics, etc.
- **Live SEC filings** — the raw EDGAR hits for the matched entity, plus
  parsed Form D rows (latest per CIK, deduped to handle cumulative
  amendments)

---

## Verification dimensions

Every cross-check is scored 0–100 internally and rolled up into a weighted
**Data Confidence** %. Scores are surfaced as **tiers** (🟢 / 🟡 / ⚪ /
⏳) and a confidence ring — never as a raw "credibility number" pointing
at the GP.

| # | Check                          | Weight | Source        | Comparison                                                                  |
| - | ------------------------------ | ------ | ------------- | --------------------------------------------------------------------------- |
| 1 | 🪪 Entity Match                | 15%    | EDGAR         | Reported fund name vs largest matching filer entity (master/feeder-aware)   |
| 2 | 📋 ADV Registration            | 25%    | IAPD          | Reported firm legal name vs SEC-registered adviser scope + disclosure flag  |
| 3 | 💰 Fundraising Claim           | 25%    | EDGAR Form D  | Reported AUM vs largest entity's latest `totalAmountSold` (cumulative)      |
| 4 | 👥 Investor Count              | 15%    | EDGAR Form D  | Cumulative `totalNumberAlreadyInvested` — context, no deck-side equivalent  |
| 5 | 💵 Minimum Investment          | 10%    | EDGAR Form D  | Reported minimum vs Form D `minimumInvestmentAccepted`                      |
| 6 | ⏱️ Filing Timeline             | 5%     | EDGAR Form D  | Reported inception vs first → latest Form D filing series                   |
| 7 | 🧑‍💼 Key Personnel              | 5%     | EDGAR Form D  | InvestmentTeam roster vs Form D `relatedPersonsList`                        |

### Numeric tolerances

- Drift ≤ 10% → **Verified**
- Drift > 10% → **Partially Verified** with a soft, non-accusatory explainer
- We never escalate to a public "Conflicted" label — the framing is always
  "may differ due to timing or fund structure"

### Master/feeder & cumulative-amendment handling

Form D amendments are **cumulative**, not deltas, and many private funds
file under multiple master/feeder/parallel entities. To avoid
double-counting:

- `latestPerEntity()` keeps only the most recent filing per CIK.
- `largestLatestFund()` picks the single largest entity (by
  `totalAmountSold`) as the proxy for "the fund" — useful for
  permanent-capital and master/feeder structures where summing across
  entities would mislead.

The fundraising explainer also calls out that Form D's amount-sold is
**cumulative gross subscriptions**, not current NAV, so drift between
reported AUM and Form D is expected and contextualised rather than flagged
as a discrepancy.

### Discrepancy flags

The cross-check panel surfaces three flag severities:

- ℹ️ **Info** — a gap (`pending`) that, when filled, upgrades the tier
- ⚠️ **Watch** — a `partial`-confidence check with material drift
- 🔎 **Review** — adviser disclosures present on IAPD; LPs should read the
  ADV brochure for context before evaluating

---

## Project structure

```
.
├── package.json                        # Orchestrates server + client via concurrently
├── server/                             # SEC proxy + Form D parser
│   └── src/
│       ├── index.ts                    # Express routes, in-memory cache
│       └── edgar.ts                    # EDGAR + IAPD fetch + XML parsing
└── client/                             # Vue 3 dashboard
    └── src/
        ├── App.vue
        ├── components/
        │   ├── Dashboard.vue
        │   ├── HeaderBar.vue           # Live SEC status + refresh
        │   ├── FundBanner.vue          # Hero with confidence ring + tier badge
        │   ├── FundStatsRow.vue        # 6 KPI cards, each with a confidence chip
        │   ├── RegulatoryCrossCheckPanel.vue   # Per-check rows + discrepancy flags
        │   ├── sections/
        │   │   ├── AboutFundSection.vue
        │   │   ├── ServiceProvidersSection.vue
        │   │   ├── InvestmentTeamSection.vue
        │   │   ├── FundPerformanceSection.vue
        │   │   ├── FundTermsSection.vue
        │   │   ├── DocumentsSection.vue
        │   │   └── SecFilingsSection.vue       # Live EDGAR hits + parsed Form Ds
        │   └── ui/                             # ConfidenceBadge, TierBadge, ScoreRing,
        │                                       # SectionShell, StatCard, Sparkline
        ├── data/pershing.ts            # Seeded fund record (typed as HedgeFund)
        ├── services/
        │   ├── edgar.ts                # Frontend client for /api/fund/overview
        │   └── verification.ts         # Per-datapoint confidence engine
        ├── stores/gp.ts                # Pinia store (fund + EDGAR overview + verification)
        └── types/gp.ts                 # HedgeFund schema + verification model
```

The `HedgeFund` type in `client/src/types/gp.ts` mirrors the production
`FundsHedge` DB schema, and `data/pershing.ts` is shaped to drop into a
real backing table later — the verification layer is just a derived view
on top of it.

---

## Endpoints (server)

| Method | Path                                            | Purpose                                                          |
| ------ | ----------------------------------------------- | ---------------------------------------------------------------- |
| GET    | `/api/health`                                   | Liveness                                                         |
| GET    | `/api/edgar/search?q=...&forms=D`               | EDGAR full-text Form D search                                    |
| GET    | `/api/edgar/submissions/:cik`                   | Recent filings for a single CIK                                  |
| GET    | `/api/edgar/form-d?cik=&accession=`             | Parsed Form D primary doc (XML → JSON)                           |
| GET    | `/api/fund/overview?fund=&firm=&parseTop=`      | Composite: EDGAR search + parse top N + IAPD lookup, aggregated  |
| GET    | `/api/iapd/firm?q=`                             | IAPD firm search (adviser registration + disclosures)            |

In-memory cache: 5 minutes for search/overview/IAPD; 24 hours for parsed
Form Ds.

---

## Design principles

The product follows the philosophy that **soft enforcement via visibility**
shapes GP behavior more than blunt accusations.

- **Never accuse, always show confidence.** "This GP is inconsistent" → "Here
  is how verified and complete this data is."
- **Three tiers, not red/green.** Red is reserved for genuinely critical
  states (e.g. ADV disclosures requiring review); the default escalation is
  `verified → partial → self`.
- **Discrepancies are implied, not declared.** Soft language ("may differ
  due to timing or fund structure") preserves trust on both sides.
- **Positive reinforcement.** "Profile is now 90% verified" is more useful
  than "missing 4 fields."

These choices aim to make the platform feel like a **data-quality
amplifier** — institutional-grade transparency that GPs *want* to optimize
toward.

---

## Notes

- Pershing Square is a deliberate choice: PSLP files real Form Ds on EDGAR
  (CIK 0001313682) and the manager has an active ADV on IAPD
  (CRD 132982), so all live cross-checks return non-empty data.
- GP-submitted figures in `client/src/data/pershing.ts` are illustrative
  only. They're tuned to produce a realistic demo narrative (a small
  capital-raised drift versus the cumulative Form D figure) without
  claiming anything about the real firm's actual metrics.
- The SEC data is **real**, fetched live from EDGAR + IAPD on each
  refresh.
- Re-pointable to any other GP by editing `data/pershing.ts` and the
  `SEC_FUND_QUERY` / `SEC_FIRM_QUERY` constants exported from that file.
