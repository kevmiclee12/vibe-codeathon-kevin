import type { HedgeFund } from "@/types/gp";

// ---------------------------------------------------------------------------
// Pershing Square, L.P. — seeded fund profile shaped to the HedgeFund DB
// schema. Numbers are illustrative for demo purposes; a real backend would
// hydrate this directly from the FundsHedge table.
//
// Why this fund:
//   - real, on-shore US LP fund with multiple Form D filings on EDGAR
//     (CIK 0001313682) — so the live regulatory cross-checks return data
//   - parent firm (Pershing Square Capital Management, L.P.) is a SEC-
//     registered investment adviser with an active ADV on IAPD
//     (CRD 132982) — so the ADV registration check returns data
//
// The deck-side numbers are intentionally tuned to surface a small but
// realistic fundraising-claim drift versus EDGAR, so the LP-facing panel
// has interesting things to show.
// ---------------------------------------------------------------------------

export const SEC_FUND_QUERY = "Pershing Square, L.P.";
export const SEC_FIRM_QUERY = "Pershing Square Capital Management";

export const pershingFund: HedgeFund = {
  FundHedgeID: 4821,
  FundID: 9012,
  CompanyID: 318,
  FundCompanyID: 471,
  Name: "Pershing Square, L.P.",
  FundAUM: 18_500_000_000,
  Strategy: "Concentrated Fundamental Long/Short Equity",
  IsEnrolled: true,
  DateCreated_UTC: "2018-04-12T00:00:00Z",
  LastDateUpdated_UTC: "2026-04-21T00:00:00Z",
  IsDeleted: false,
  Step: 5,

  InceptionDate: "2004-01-01",
  PrimaryStrategy: "Equity Long/Short",
  SecondaryStrategies: ["Activist", "Event-Driven", "Concentrated Long-Biased"],
  Sectors: [
    "Consumer Discretionary",
    "Industrials",
    "Real Estate",
    "Hospitality",
    "Restaurants",
  ],
  InvestmentVehicles: ["Onshore Limited Partnership", "Offshore Feeder Fund"],
  Domiciles: ["United States (Delaware)", "Cayman Islands (feeder)"],
  OwnershipAttributes: ["GP-Owned"],
  SocialFocus: [],
  FirstLossCapitalAnswer: "No",
  MinimumInvestment: 10_000_000,
  ManagedAccountMinimumInvestment: 50_000_000,
  GPProprietaryAssets: 1_200_000_000,
  GeographicConcentrations: ["North America", "Western Europe"],
  StrategyDescription:
    "Concentrated long-biased equity strategy targeting 8–12 high-quality, simple, predictable, free-cash-flow generative North American businesses with significant barriers to entry and identifiable catalysts. The fund maintains modest hedges via index puts and selectively engages constructively with management to unlock long-term value.",
  ManagerBiography:
    "William A. Ackman founded Pershing Square Capital Management in 2004. Prior to PSCM he co-founded Gotham Partners in 1992. Mr. Ackman holds an MBA from Harvard Business School and a BA magna cum laude from Harvard College.",

  PrimaryPrimeBroker: "Goldman Sachs & Co. LLC",
  SecondaryPrimeBroker: "JPMorgan Securities LLC",
  LegalCounsel: "Sullivan & Cromwell LLP",
  FundAdministrator: "SS&C GlobeOp",
  Auditor: "Ernst & Young LLP",

  DaysRedemption: 65,
  DurationOfLockup: 24,
  ManagementFee: 1.5,
  PerformanceFee: 16.0,
  PortfolioTurnedOver: 22,
  PortfolioLeverage: 110,
  NetDollarExposure: 92,
  PercentageOfPortfolioEasilyPriced: 100,
  TradingDaysUnwind: 5,
  NotionalPosition: 130,
  PrimaryInstruments: ["Common Stock", "Index Options", "Total Return Swaps"],

  AnnualizedReturn: 16.4,
  AnnualStandardDeviation: 14.8,
  AUMMaximumCapacity: 25_000_000_000,
  AverageMonthlyGain: 2.6,
  AverageMonthlyLoss: -2.1,
  LargestDrawdown: -27.3,
  LengthLargestDrawdown: 14,
  SharpeRatio: 1.05,
  SortinoRatio: 1.62,
  YTDReturn: 8.7,
  PeakDate: "2021-12-31",
  TroughDate: "2023-04-30",
  SterlingRatio: 0.78,

  MarketingMaterialURL: "https://example.com/pershing/marketing-2026q1.pdf",
  HistoricalReturnsURL: "https://example.com/pershing/returns.pdf",
  MarketingMaterialURL2: "https://example.com/pershing/strategy-deck.pdf",
  ADVFormURL: "https://reports.adviserinfo.sec.gov/reports/ADV/132982/PDF/132982.pdf",
  AnalyticsURL: "https://example.com/pershing/analytics",
  VIdeoUrl: undefined,

  StrategicCapitalAnswer: "No",
  StrategicCapital: false,
  FirstLossCapital: false,

  InvestorsGated: false,
  OutsourcedTrader: false,
  GeneralDisclaimer:
    "This summary is provided for informational purposes only and does not constitute an offer to sell or a solicitation of an offer to buy any security. Past performance is not indicative of future results.",
  SustainableGoals: [],
  InvestmentApproach:
    "Fundamental, research-driven, concentrated long-biased value with selective shareholder engagement.",
  RedemptionFrequency: "Quarterly (with 65-day notice, after lock-up)",
  HurdleRate: 0,
  HighWaterMark: true,
  FundPeakProgramID: undefined,

  TopsheetHash: undefined,
  TopsheetPdfHash: undefined,
  TearsheetApproved: true,
  TearsheetApproved_LastDateUpdated_UTC: "2026-04-08T00:00:00Z",
  TearsheetApproved_ContactID: 19211,
  Stats_LastDateUpdatec_UTC: "2026-04-15T00:00:00Z",

  MarketCapitalization: "Large Cap",
  BenchMarkName: "S&P 500 Total Return",
  BenchMarkId: 1,
  FundDescription:
    "Pershing Square, L.P. (PSLP) is the firm's flagship onshore vehicle. The strategy seeks long-term appreciation through a concentrated portfolio of high-quality public companies, supplemented by occasional event-driven and activist positions where engagement can accelerate value realisation.",
  AUM_as_of_Date: "2026-03-31",
  GeographicSector: ["North America"],
  ESGFactors: ["Governance"],
  InvestmentTeam: [
    {
      name: "Bill Ackman",
      title: "CEO & Portfolio Manager",
      tenureYears: 22,
      bio: "Founder, Chief Executive Officer and Portfolio Manager of PSCM since inception in 2004.",
    },
    {
      name: "Ryan Israel",
      title: "Chief Investment Officer",
      tenureYears: 16,
      bio: "Joined PSCM in 2009 from Goldman Sachs; named Chief Investment Officer in 2022.",
    },
    {
      name: "Anthony Massaro",
      title: "Partner",
      tenureYears: 13,
      bio: "Coverage of consumer discretionary and industrials.",
    },
    {
      name: "Charles Korn",
      title: "Partner",
      tenureYears: 10,
      bio: "Coverage of restaurants, hospitality, and consumer.",
    },
  ],
  FundRaisingStatus: "Open to New Investors",
  // intentional ~6% drift vs the ~$3.6B figure that PSLP's latest Form D
  // typically reports (cumulative since inception) so the deck-vs-EDGAR
  // capital-raised cross-check has a soft, demo-able discrepancy.
  FundRaisingTargets: 25_000_000_000,
  LockUpPeriod: 2,
  RedemptionNoticePeriod: 65,
  AccountingFirm: "Ernst & Young LLP",
  InstrumentsTraded: ["Equities", "Equity Options", "Total Return Swaps"],
  InvestmentMethodology:
    "Bottoms-up, research-intensive, with a focus on quality, durability, and management quality. Positions sized to express conviction while preserving downside protection.",
  HideSPBenchMark: false,
  ShortDescription:
    "Concentrated, long-biased equity fund investing in 8–12 high-quality public businesses, occasionally engaging constructively to unlock long-term value.",
  BenchmarkReference: "S&P 500 TR",

  Company: {
    name: "Pershing Square Capital Management",
    legalName: "Pershing Square Capital Management, L.P.",
    location: "New York, NY · United States",
    websiteUrl: "https://www.pershingsquareholdings.com/",
    yearFounded: 2004,
  },
};
