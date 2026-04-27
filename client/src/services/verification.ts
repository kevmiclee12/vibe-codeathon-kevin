import type {
  ConfidenceLevel,
  FormDData,
  FundOverview,
  HedgeFund,
  IapdFirm,
  RegulatoryCheck,
  VerificationProfile,
  VerificationTier,
} from "@/types/gp";

// ---------------------------------------------------------------------------
// Tunable thresholds
// ---------------------------------------------------------------------------

const VERIFIED_TOLERANCE = 0.1; // 10% drift → still "verified"
const PARTIAL_LIMIT = 1.0;

const CHECK_WEIGHTS: Record<string, number> = {
  entityMatch: 15,
  advRegistration: 25,
  capitalRaised: 25,
  investorCount: 15,
  minimumInvestment: 10,
  filingTimeline: 5,
  keyPersonnel: 5,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

export function fmtUSD(n?: number | "Indefinite"): string {
  if (n === undefined || n === null) return "—";
  if (n === "Indefinite") return "Indefinite";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

export function fmtPct(n?: number, digits = 1): string {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  return `${n.toFixed(digits)}%`;
}

// Human-friendly EDGAR filing index page — lists every document in the
// filing (primary_doc.xml, headers, raw SGML submission) and is the page
// users typically reach from EDGAR search results.
export function filingIndexUrl(cik?: string, accessionNo?: string): string | undefined {
  if (!cik || !accessionNo) return undefined;
  const cikNum = String(parseInt(cik, 10));
  const accNoStripped = accessionNo.replace(/-/g, "");
  return `https://www.sec.gov/Archives/edgar/data/${cikNum}/${accNoStripped}/${accessionNo}-index.htm`;
}

// Form D amendments are cumulative. Keep only the latest filing per CIK.
export function latestPerEntity<T extends { cik: string; filedAt?: string }>(
  funds: T[],
): T[] {
  const byCik = new Map<string, T>();
  for (const f of funds) {
    const prev = byCik.get(f.cik);
    if (!prev) {
      byCik.set(f.cik, f);
      continue;
    }
    const prevDate = prev.filedAt ? Date.parse(prev.filedAt) : 0;
    const cur = f.filedAt ? Date.parse(f.filedAt) : 0;
    if (cur > prevDate) byCik.set(f.cik, f);
  }
  return [...byCik.values()];
}

// For master/feeder structures, summing across entities can double-count.
// The largest single entity's latest filing is the cleanest stand-in for
// "the fund" the deck is referring to.
export function largestLatestFund(funds: FormDData[]): FormDData | undefined {
  const latest = latestPerEntity(funds);
  let best: FormDData | undefined;
  for (const f of latest) {
    if (!best || (f.totalAmountSold ?? 0) > (best.totalAmountSold ?? 0)) {
      best = f;
    }
  }
  return best;
}

function confidenceFromDrift(driftRatio: number): ConfidenceLevel {
  if (driftRatio <= VERIFIED_TOLERANCE) return "verified";
  if (driftRatio <= PARTIAL_LIMIT) return "partial";
  return "partial";
}

function scoreFromConfidence(c: ConfidenceLevel, drift?: number): number {
  if (c === "verified") return 100;
  if (c === "partial") {
    if (drift === undefined) return 65;
    return clamp(100 - drift * 60);
  }
  if (c === "self") return 55;
  if (c === "pending") return 0;
  return 50;
}

function softExplainerForDrift(driftPct: number): string | undefined {
  if (driftPct <= 10) return undefined;
  if (driftPct <= 35) {
    return "Reported figures may differ from regulatory filings due to timing or fund structure.";
  }
  return "Figures reflect the latest available disclosures; differences may stem from feeder structures, parallel vehicles, or filing cadence.";
}

function deltaLabel(reported: number, external: number): string {
  if (reported <= 0) return "—";
  const ratio = external / reported;
  if (Math.abs(1 - ratio) < 0.005) return "Aligned";
  if (ratio >= 1) return `+${((ratio - 1) * 100).toFixed(0)}% on regulatory source`;
  return `−${((1 - ratio) * 100).toFixed(0)}% on regulatory source`;
}

function lower(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function bestIapdMatch(fund: HedgeFund, iapd?: FundOverview["iapd"]): IapdFirm | undefined {
  if (!iapd?.firms?.length) return undefined;
  const target = lower(fund.Company.legalName);
  // Prefer ACTIVE, exact name match. Fall back to first ACTIVE result.
  const exact = iapd.firms.find(
    (f) => f.scope === "ACTIVE" && lower(f.name) === target,
  );
  if (exact) return exact;
  const active = iapd.firms.find((f) => f.scope === "ACTIVE");
  if (active) return active;
  return iapd.firms[0];
}

// ---------------------------------------------------------------------------
// Per-check assessors
// ---------------------------------------------------------------------------

function assessEntityMatch(
  fund: HedgeFund,
  edgar?: FundOverview,
): RegulatoryCheck {
  const reportedName = fund.Name;

  if (!edgar) {
    return {
      key: "entityMatch",
      label: "Entity Match",
      emoji: "🪪",
      confidence: "loading",
      headline: "Searching SEC for matching filer entities…",
      reportedValue: reportedName,
      internalScore: 50,
      reportedCovered: !!reportedName,
      externalCovered: false,
    };
  }

  const master = largestLatestFund(edgar.parsedFunds);
  const distinctEntities = edgar.aggregate.distinctEntities;
  const totalFilings = edgar.totalFilings;
  const externalCovered = distinctEntities > 0;

  if (!externalCovered) {
    return {
      key: "entityMatch",
      label: "Entity Match",
      emoji: "🪪",
      confidence: "self",
      headline: `${reportedName} — no matching SEC filer entity found.`,
      explainer:
        "Offshore-only feeders or unregistered vehicles may not appear in EDGAR. The match is currently self-reported.",
      reportedValue: reportedName,
      externalSource: "SEC EDGAR",
      internalScore: 45,
      reportedCovered: true,
      externalCovered: false,
    };
  }

  const target = lower(reportedName);
  const masterMatch = master ? lower(master.entityName) === target : false;
  const partialMatch = master ? lower(master.entityName).includes(target.split(" ")[0] ?? target) : false;
  const confidence: ConfidenceLevel = masterMatch ? "verified" : partialMatch ? "verified" : "partial";

  const headline = master
    ? confidence === "verified"
      ? `${reportedName} maps to filer "${master.entityName}" on SEC EDGAR.`
      : `${reportedName} likely related to ${distinctEntities} filer entit${
          distinctEntities === 1 ? "y" : "ies"
        } on SEC EDGAR.`
    : `${reportedName} — ${distinctEntities} related entit${
        distinctEntities === 1 ? "y" : "ies"
      } found on SEC EDGAR.`;

  return {
    key: "entityMatch",
    label: "Entity Match",
    emoji: "🪪",
    confidence,
    headline,
    explainer:
      distinctEntities > 1
        ? "Multiple filer entities are common (master/feeder, parallel vehicles, related GP entities)."
        : undefined,
    reportedValue: reportedName,
    externalValue: master
      ? `${master.entityName} · CIK ${master.cik.padStart(10, "0")}`
      : `${distinctEntities} entit${distinctEntities === 1 ? "y" : "ies"}`,
    externalSource: "SEC EDGAR",
    externalUrl: filingIndexUrl(master?.cik, master?.accessionNo),
    internalScore: scoreFromConfidence(confidence),
    reportedCovered: true,
    externalCovered: true,
    detail: {
      distinctEntities,
      totalFilings,
      masterEntity: master?.entityName,
      masterCik: master?.cik,
    },
  };
}

function assessAdvRegistration(
  fund: HedgeFund,
  edgar?: FundOverview,
): RegulatoryCheck {
  const reportedFirm = fund.Company.legalName;

  if (!edgar) {
    return {
      key: "advRegistration",
      label: "ADV Registration",
      emoji: "📋",
      confidence: "loading",
      headline: "Looking up adviser registration on SEC IAPD…",
      reportedValue: reportedFirm,
      internalScore: 50,
      reportedCovered: !!reportedFirm,
      externalCovered: false,
    };
  }

  const match = bestIapdMatch(fund, edgar.iapd);

  if (!match) {
    return {
      key: "advRegistration",
      label: "ADV Registration",
      emoji: "📋",
      confidence: "self",
      headline: `${reportedFirm} — no matching SEC-registered adviser found on IAPD.`,
      explainer:
        "The firm may be exempt-reporting or registered with a state regulator rather than the SEC.",
      reportedValue: reportedFirm,
      externalSource: "SEC IAPD",
      externalUrl: "https://adviserinfo.sec.gov/",
      internalScore: 40,
      reportedCovered: true,
      externalCovered: false,
    };
  }

  const isActive = match.scope === "ACTIVE";
  const confidence: ConfidenceLevel = isActive ? "verified" : "partial";

  const headline = isActive
    ? `Registered with the SEC as ${match.iaFullSecNumber ?? "an investment adviser"}${
        match.hasDisclosures ? " · disclosure events present" : " · no disclosures"
      }.`
    : `Adviser found on IAPD but registration is currently ${match.scope.toLowerCase()}.`;

  return {
    key: "advRegistration",
    label: "ADV Registration",
    emoji: "📋",
    confidence,
    headline,
    explainer: match.hasDisclosures
      ? "IAPD shows disclosure events on file — review the brochure to understand context."
      : isActive
        ? undefined
        : "Inactive registration may indicate a wind-down, rebrand, or migration to exempt-reporting status.",
    reportedValue: reportedFirm,
    externalValue: `${match.name}${match.iaFullSecNumber ? ` · SEC# ${match.iaFullSecNumber}` : ""}`,
    externalSource: "SEC IAPD",
    externalUrl: match.profileUrl,
    internalScore: scoreFromConfidence(confidence),
    reportedCovered: true,
    externalCovered: true,
    detail: {
      sourceId: match.sourceId,
      hasDisclosures: match.hasDisclosures,
      scope: match.scope,
      branchesCount: match.branchesCount,
      advBrochureUrl: match.advBrochureUrl,
    },
  };
}

function assessCapitalRaised(
  fund: HedgeFund,
  edgar?: FundOverview,
): RegulatoryCheck {
  const reported = fund.FundAUM;
  const reportedCovered = reported > 0;

  if (!edgar) {
    return {
      key: "capitalRaised",
      label: "Fundraising Claim Cross-check",
      emoji: "💰",
      confidence: "loading",
      headline: "Comparing reported AUM against SEC Form D…",
      reportedValue: reportedCovered ? fmtUSD(reported) : undefined,
      internalScore: 50,
      reportedCovered,
      externalCovered: false,
    };
  }

  const master = largestLatestFund(edgar.parsedFunds);
  const externalRaised = master?.totalAmountSold ?? 0;
  const externalCovered = externalRaised > 0;

  if (!externalCovered) {
    return {
      key: "capitalRaised",
      label: "Fundraising Claim Cross-check",
      emoji: "💰",
      confidence: reportedCovered ? "self" : "pending",
      headline: reportedCovered
        ? `${fmtUSD(reported)} reported · no comparable Form D figure available.`
        : "AUM not yet disclosed by the GP.",
      explainer: reportedCovered
        ? "No SEC-filed amount-sold value is currently associated with the matching entity."
        : undefined,
      reportedValue: reportedCovered ? fmtUSD(reported) : undefined,
      externalSource: "SEC Form D",
      internalScore: reportedCovered ? 55 : 0,
      reportedCovered,
      externalCovered: false,
    };
  }

  const ratio = externalRaised / Math.max(1, reported);
  const drift = Math.abs(1 - ratio);
  const confidence = confidenceFromDrift(drift);
  const internalScore = scoreFromConfidence(confidence, drift);

  const headline =
    confidence === "verified"
      ? `${fmtUSD(reported)} reported · matches latest Form D within ${VERIFIED_TOLERANCE * 100}%.`
      : `${fmtUSD(reported)} reported · ${fmtUSD(externalRaised)} sold on latest Form D for ${master?.entityName}.`;

  // Form D's totalAmountSold is cumulative gross subscriptions, not current
  // NAV. Drift between reported AUM and cumulative subscriptions is expected
  // — surface that context rather than treating it as a discrepancy.
  const explainer =
    confidence === "verified"
      ? undefined
      : "Form D's amount sold is cumulative subscriptions for this onshore vehicle, not current NAV. Differences also reflect feeder structures, redemptions, or appreciation since the offering.";

  return {
    key: "capitalRaised",
    label: "Fundraising Claim Cross-check",
    emoji: "💰",
    confidence,
    headline,
    explainer,
    reportedValue: fmtUSD(reported),
    externalValue: fmtUSD(externalRaised),
    externalSource: "SEC Form D",
    externalUrl: filingIndexUrl(master?.cik, master?.accessionNo),
    delta: deltaLabel(reported, externalRaised),
    internalScore,
    reportedCovered: true,
    externalCovered: true,
    detail: {
      masterEntity: master?.entityName,
      masterCik: master?.cik,
      filedAt: master?.filedAt,
    },
  };
}

function assessInvestorCount(
  fund: HedgeFund,
  edgar?: FundOverview,
): RegulatoryCheck {
  // The schema does not carry an "LP count" field directly, so the deck-side
  // value comes from the InvestmentTeam length, plus a stable estimate
  // baked into FundDescription if no investor count is otherwise tracked.
  // For this demo we intentionally show "self-reported / partial" by default,
  // so LPs see the cumulative Form D investor count for context.
  const externalSource = "SEC Form D";

  if (!edgar) {
    return {
      key: "investorCount",
      label: "Investor Count Cross-check",
      emoji: "👥",
      confidence: "loading",
      headline: "Comparing investor count against SEC Form D…",
      internalScore: 50,
      reportedCovered: false,
      externalCovered: false,
    };
  }

  const master = largestLatestFund(edgar.parsedFunds);
  const externalInvestors = master?.totalNumberAlreadyInvested ?? 0;
  const externalCovered = externalInvestors > 0;

  if (!externalCovered) {
    return {
      key: "investorCount",
      label: "Investor Count Cross-check",
      emoji: "👥",
      confidence: "pending",
      headline: "Investor count not disclosed in deck or filings.",
      externalSource,
      internalScore: 0,
      reportedCovered: false,
      externalCovered: false,
    };
  }

  return {
    key: "investorCount",
    label: "Investor Count Cross-check",
    emoji: "👥",
    confidence: "self",
    headline: `${externalInvestors.toLocaleString()} cumulative investors on latest Form D for ${master?.entityName}.`,
    explainer:
      "GPs typically don't publish current LP counts. The Form D figure is cumulative across all investors who've ever subscribed to this entity.",
    externalValue: `${externalInvestors.toLocaleString()} cumulative investors`,
    externalSource,
    externalUrl: filingIndexUrl(master?.cik, master?.accessionNo),
    internalScore: 60,
    reportedCovered: false,
    externalCovered: true,
  };
}



function assessFilingTimeline(
  fund: HedgeFund,
  edgar?: FundOverview,
): RegulatoryCheck {
  const reportedInception = fund.InceptionDate;
  const reportedCovered = !!reportedInception;

  if (!edgar) {
    return {
      key: "filingTimeline",
      label: "Filing Timeline",
      emoji: "⏱️",
      confidence: "loading",
      headline: "Awaiting EDGAR filing history…",
      reportedValue: reportedInception,
      internalScore: 50,
      reportedCovered,
      externalCovered: false,
    };
  }

  const master = largestLatestFund(edgar.parsedFunds);
  const series = master
    ? edgar.parsedFunds
        .filter((f) => f.cik === master.cik && f.filedAt)
        .map((f) => ({ date: f.filedAt!, accession: f.accessionNo }))
        .sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
    : [];

  if (series.length === 0) {
    return {
      key: "filingTimeline",
      label: "Filing Timeline",
      emoji: "⏱️",
      confidence: reportedCovered ? "self" : "pending",
      headline: reportedCovered
        ? `Inception ${reportedInception} — no EDGAR filing series found.`
        : "Not yet disclosed.",
      reportedValue: reportedInception,
      externalSource: "SEC Form D",
      internalScore: reportedCovered ? 55 : 0,
      reportedCovered,
      externalCovered: false,
    };
  }

  const firstFiling = series[0];
  const latestFiling = series[series.length - 1];

  return {
    key: "filingTimeline",
    label: "Filing Timeline",
    emoji: "⏱️",
    confidence: "verified",
    headline: `${series.length} Form D filing${series.length === 1 ? "" : "s"} from ${firstFiling.date} → ${latestFiling.date}.`,
    explainer:
      reportedCovered && reportedInception
        ? `Inception reported as ${reportedInception}; first Form D on file ${firstFiling.date}.`
        : undefined,
    reportedValue: reportedInception,
    externalValue: `${series.length} filings · last ${latestFiling.date}`,
    externalSource: "SEC Form D",
    externalUrl: filingIndexUrl(master?.cik, master?.accessionNo),
    internalScore: 100,
    reportedCovered,
    externalCovered: true,
    detail: { series },
  };
}

function assessKeyPersonnel(
  fund: HedgeFund,
  edgar?: FundOverview,
): RegulatoryCheck {
  const team = fund.InvestmentTeam ?? [];
  const reportedCovered = team.length > 0;

  if (!edgar) {
    return {
      key: "keyPersonnel",
      label: "Key Personnel",
      emoji: "🧑‍💼",
      confidence: "loading",
      headline: "Comparing team disclosures with Form D related-persons list…",
      reportedValue: `${team.length} listed`,
      internalScore: 50,
      reportedCovered,
      externalCovered: false,
    };
  }

  const master = largestLatestFund(edgar.parsedFunds);
  const externalNames = new Set<string>();
  for (const f of edgar.parsedFunds) {
    for (const p of f.relatedPersons) {
      if (p.name) externalNames.add(p.name.toLowerCase());
    }
  }

  if (externalNames.size === 0) {
    return {
      key: "keyPersonnel",
      label: "Key Personnel",
      emoji: "🧑‍💼",
      confidence: "self",
      headline: `${team.length} team members listed in deck.`,
      explainer:
        "No related persons disclosed in matching SEC filings — Form D often lists management entities rather than individuals.",
      reportedValue: `${team.length} listed`,
      externalSource: "SEC Form D",
      externalUrl: filingIndexUrl(master?.cik, master?.accessionNo),
      internalScore: 55,
      reportedCovered,
      externalCovered: false,
    };
  }

  const reportedLower = new Set(team.map((p) => p.name.toLowerCase()));
  let matched = 0;
  for (const n of reportedLower) if (externalNames.has(n)) matched++;
  const overlap = team.length ? matched / team.length : 0;
  const confidence: ConfidenceLevel = overlap >= 0.4 ? "verified" : "partial";

  return {
    key: "keyPersonnel",
    label: "Key Personnel",
    emoji: "🧑‍💼",
    confidence,
    headline:
      overlap >= 0.4
        ? `${team.length} team members listed · ${matched} corroborated by Form D.`
        : `${team.length} team members listed · Form D primarily lists management entities.`,
    explainer:
      overlap < 0.4
        ? "Form D often discloses management entities (e.g., the GP's LP) rather than individual partners — this is standard for private-fund structures."
        : undefined,
    reportedValue: `${team.length} listed`,
    externalValue: `${externalNames.size} related person/entit${externalNames.size === 1 ? "y" : "ies"}`,
    externalSource: "SEC Form D",
    externalUrl: filingIndexUrl(master?.cik, master?.accessionNo),
    internalScore: clamp(60 + overlap * 40),
    reportedCovered: true,
    externalCovered: true,
    detail: { matched, externalNames: [...externalNames] },
  };
}

// ---------------------------------------------------------------------------
// Aggregation
// ---------------------------------------------------------------------------

function tierFromConfidence(score: number, completeness: number): VerificationTier {
  if (score >= 80 && completeness >= 70) return "fully";
  if (score >= 55) return "partially";
  return "self";
}

function buildFlags(checks: RegulatoryCheck[]): VerificationProfile["flags"] {
  const flags: VerificationProfile["flags"] = [];
  for (const c of checks) {
    if (c.confidence === "partial") {
      flags.push({
        id: `flag-${c.key}`,
        severity: "watch",
        title: c.label,
        detail: c.explainer ?? c.headline,
        actionUrl: c.externalUrl,
        actionLabel: c.externalUrl
          ? `Open ${c.externalSource ?? "source"} ↗`
          : undefined,
      });
    }
    if (c.confidence === "pending") {
      flags.push({
        id: `gap-${c.key}`,
        severity: "info",
        title: `${c.label} pending`,
        detail: "No disclosure available yet — adding it strengthens the verified profile.",
      });
    }
    if (c.key === "advRegistration" && c.detail?.hasDisclosures === true) {
      // The IAPD profile is where the actual disclosure events are listed
      // (under the "Disclosures" tab); the Part-2 brochure is a strategy
      // document. Prefer the profile, fall back to the brochure if the
      // profile URL isn't populated for some reason.
      const profileUrl = c.externalUrl;
      const brochureUrl = (c.detail?.advBrochureUrl as string) || undefined;
      const actionUrl = profileUrl ?? brochureUrl;
      flags.push({
        id: `flag-adv-disclosures`,
        severity: "review",
        title: "ADV disclosures on file",
        detail: "IAPD shows one or more disclosure events on the firm's ADV. Review the IAPD profile for context before evaluating.",
        actionUrl,
        actionLabel: profileUrl
          ? "Open IAPD profile ↗"
          : brochureUrl
            ? "Open ADV brochure ↗"
            : undefined,
      });
    }
  }
  return flags;
}

export function computeVerificationProfile(
  fund: HedgeFund,
  edgar?: FundOverview,
  edgarLoading?: boolean,
): VerificationProfile {
  const checks: RegulatoryCheck[] = [
    assessEntityMatch(fund, edgar),
    assessAdvRegistration(fund, edgar),
    assessCapitalRaised(fund, edgar),
    assessInvestorCount(fund, edgar),
    assessFilingTimeline(fund, edgar),
    assessKeyPersonnel(fund, edgar),
  ];

  if (edgarLoading && !edgar) {
    for (const c of checks) {
      if (c.confidence === "pending" && c.reportedCovered) c.confidence = "loading";
    }
  }

  const totalWeight = checks.reduce(
    (s, c) => s + (CHECK_WEIGHTS[c.key] ?? 10),
    0,
  );
  const dataConfidence =
    checks.reduce(
      (s, c) => s + c.internalScore * (CHECK_WEIGHTS[c.key] ?? 10),
      0,
    ) / Math.max(1, totalWeight);

  const completeness =
    (checks.filter((c) => c.reportedCovered).length / checks.length) * 100;

  const sourceCoverage = {
    verified: checks.filter((c) => c.confidence === "verified").length,
    partial: checks.filter((c) => c.confidence === "partial").length,
    selfReported: checks.filter((c) => c.confidence === "self").length,
    pending: checks.filter(
      (c) => c.confidence === "pending" || c.confidence === "loading",
    ).length,
    total: checks.length,
  };

  return {
    dataConfidence,
    tier: tierFromConfidence(dataConfidence, completeness),
    dataCompleteness: completeness,
    checks,
    flags: buildFlags(checks),
    sourceCoverage,
    computedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Confidence presentation helpers
// ---------------------------------------------------------------------------

// Tones map to the design system's $background-map / $border-map / $typography-map.
// `dot`, `chipClass`, and `rowClass` consume the `success` / `warn` / `danger`
// / `info` / `slate` palettes defined in `tailwind.config.js`.
export const CONFIDENCE_META: Record<
  ConfidenceLevel,
  { label: string; tooltip: string; dot: string; chipClass: string; rowClass: string }
> = {
  verified: {
    label: "Verified",
    tooltip: "GP-submitted value aligns with the regulatory source.",
    dot: "bg-success-600",
    chipClass: "border-success-200 bg-success-50 text-success-800",
    rowClass: "border-success-200",
  },
  partial: {
    label: "Partially Verified",
    tooltip: "Regulatory source exists with material drift; review for context.",
    dot: "bg-warn-500",
    chipClass: "border-warn-200 bg-warn-50 text-warn-800",
    rowClass: "border-warn-200",
  },
  self: {
    label: "Self-reported",
    tooltip: "Provided by the GP, not independently verified.",
    dot: "bg-slate-400",
    chipClass: "border-slate-200 bg-slate-50 text-slate-700",
    rowClass: "border-slate-200",
  },
  pending: {
    label: "Not yet disclosed",
    tooltip: "This datapoint hasn't been provided yet.",
    dot: "bg-slate-300",
    chipClass: "border-slate-200 bg-white text-slate-500",
    rowClass: "border-slate-200",
  },
  loading: {
    label: "Loading…",
    tooltip: "Fetching data from regulatory sources.",
    dot: "bg-info-500",
    chipClass: "border-info-200 bg-info-50 text-info-700",
    rowClass: "border-info-200",
  },
};

// Ring colors come straight from the design-system colors.tokens.scss palette:
//   success.green-600  → #1cc19a
//   warning.orange-500 → #f0a410
//   neutral.neutral-400 → #94a3b8
export const TIER_META: Record<
  VerificationTier,
  { label: string; emoji: string; tooltip: string; chipClass: string; ringColor: string }
> = {
  fully: {
    label: "Fully Verified",
    emoji: "🟢",
    tooltip: "Most key datapoints align with regulatory filings.",
    chipClass: "border-success-200 bg-success-50 text-success-800",
    ringColor: "#1cc19a",
  },
  partially: {
    label: "Partially Verified",
    emoji: "🟡",
    tooltip: "Some datapoints are GP-disclosed with limited third-party validation.",
    chipClass: "border-warn-200 bg-warn-50 text-warn-800",
    ringColor: "#f0a410",
  },
  self: {
    label: "Self-reported Profile",
    emoji: "⚪",
    tooltip: "Most datapoints are provided by the GP and not independently verified.",
    chipClass: "border-slate-200 bg-slate-50 text-slate-700",
    ringColor: "#94a3b8",
  },
};
