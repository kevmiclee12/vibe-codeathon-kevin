// ---------------------------------------------------------------------------
// HedgeFund — mirrors the production DB schema for a single fund record.
//
// We model what an LP would see in the platform: GP-submitted (self-reported)
// data on a per-fund basis. The verification layer cross-checks the subset of
// these fields that the SEC publicly discloses (Form D, IAPD/ADV) and labels
// each datapoint as Verified / Self-reported / Pending accordingly.
//
// Field names match the DB columns the user shared so the seed object can be
// dropped in to a real backing table later.
// ---------------------------------------------------------------------------

export type FundraisingStatus =
  | "Open"
  | "Soft Close"
  | "Hard Close"
  | "Closed"
  | "Open to New Investors";

export interface HedgeFund {
  // identity
  FundHedgeID: number;
  FundID: number;
  CompanyID: number;
  FundCompanyID: number;
  Name: string;

  // headline numbers
  FundAUM: number;
  Strategy: string;

  // status flags
  IsEnrolled: boolean;
  DateCreated_UTC: string;
  LastDateUpdated_UTC: string;
  IsDeleted: boolean;
  Step: number;

  // strategy
  InceptionDate: string;
  PrimaryStrategy: string;
  SecondaryStrategies: string[];
  Sectors: string[];
  InvestmentVehicles: string[];
  Domiciles: string[];
  OwnershipAttributes: string[];
  SocialFocus: string[];
  FirstLossCapitalAnswer: string;
  MinimumInvestment: number;
  ManagedAccountMinimumInvestment?: number;
  GPProprietaryAssets?: number;
  GeographicConcentrations: string[];
  StrategyDescription: string;
  ManagerBiography: string;

  // service providers
  PrimaryPrimeBroker: string;
  SecondaryPrimeBroker?: string;
  LegalCounsel: string;
  FundAdministrator: string;
  Auditor: string;

  // terms
  DaysRedemption: number;
  DurationOfLockup: number;
  ManagementFee: number;
  PerformanceFee: number;
  PortfolioTurnedOver?: number;
  PortfolioLeverage?: number;
  NetDollarExposure?: number;
  PercentageOfPortfolioEasilyPriced?: number;
  TradingDaysUnwind?: number;
  NotionalPosition?: number;
  PrimaryInstruments: string[];

  // performance
  AnnualizedReturn: number;
  AnnualStandardDeviation: number;
  AUMMaximumCapacity: number;
  AverageMonthlyGain: number;
  AverageMonthlyLoss: number;
  LargestDrawdown: number;
  LengthLargestDrawdown: number; // months
  SharpeRatio: number;
  SortinoRatio: number;
  YTDReturn: number;
  PeakDate: string;
  TroughDate: string;
  SterlingRatio?: number;

  // documents
  MarketingMaterialURL?: string;
  HistoricalReturnsURL?: string;
  MarketingMaterialURL2?: string;
  MarketingMaterialURL3?: string;
  ADVFormURL?: string;
  AnalyticsURL?: string;
  VIdeoUrl?: string;

  // capital programs
  StrategicCapitalAnswer: string;
  StrategicCapital: boolean;
  FirstLossCapital: boolean;

  // disclosures
  InvestorsGated: boolean;
  OutsourcedTrader: boolean;
  GeneralDisclaimer?: string;
  SustainableGoals: string[];
  InvestmentApproach: string;
  RedemptionFrequency: string;
  HurdleRate?: number;
  HighWaterMark: boolean;
  FundPeakProgramID?: number;

  // tearsheet
  TopsheetHash?: string;
  TopsheetPdfHash?: string;
  TearsheetApproved: boolean;
  TearsheetApproved_LastDateUpdated_UTC?: string;
  TearsheetApproved_ContactID?: number;
  Stats_LastDateUpdatec_UTC?: string;

  // miscellaneous
  MarketCapitalization?: string;
  BenchMarkName?: string;
  BenchMarkId?: number;
  FundDescription: string;
  AUM_as_of_Date: string;
  GeographicSector: string[];
  ESGFactors: string[];
  InvestmentTeam: Array<{
    name: string;
    title: string;
    tenureYears: number;
    bio?: string;
  }>;
  FundRaisingStatus: FundraisingStatus;
  FundRaisingTargets: number;
  LockUpPeriod: number;
  RedemptionNoticePeriod: number;
  AccountingFirm?: string;
  InstrumentsTraded: string[];
  InvestmentMethodology: string;
  HideSPBenchMark?: boolean;
  ShortDescription: string;
  BenchmarkReference?: string;

  // company-level context (not strictly per-fund, included so the page can
  // render the firm name + location alongside the fund identity).
  Company: {
    name: string;
    location: string;
    legalName: string;
    websiteUrl?: string;
    yearFounded?: number;
  };
}

// ---------------------------------------------------------------------------
// EDGAR shapes — mirror server/src/edgar.ts
// ---------------------------------------------------------------------------

export interface EdgarSearchHit {
  accessionNo: string;
  cik: string;
  ciks: string[];
  displayNames: string[];
  filedAt: string;
  form: string;
  fileType?: string;
}

export interface FormDRelatedPerson {
  name: string;
  relationships: string[];
}

export interface FormDData {
  cik: string;
  accessionNo: string;
  filedAt?: string;
  filingUrl: string;
  primaryDocUrl: string;
  entityName: string;
  entityType?: string;
  yearOfIncorporation?: string;
  jurisdictionOfIncorporation?: string;
  industryGroup?: string;
  issuerSize?: string;
  newOrAmendment?: string;
  dateOfFirstSale?: string;
  durationMoreThanOneYear?: boolean;
  totalOfferingAmount?: number | "Indefinite";
  totalAmountSold?: number;
  totalRemaining?: number | "Indefinite";
  hasNonAccreditedInvestors?: boolean;
  totalNumberAlreadyInvested?: number;
  minimumInvestmentAccepted?: number;
  relatedPersons: FormDRelatedPerson[];
}

// IAPD adviser registration (live from adviserinfo.sec.gov)
export interface IapdFirm {
  sourceId: string;
  name: string;
  otherNames: string[];
  iaSecNumber?: string;
  iaFullSecNumber?: string;
  scope: "ACTIVE" | "INACTIVE" | string;
  hasDisclosures: boolean;
  branchesCount?: number;
  address?: {
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  profileUrl: string;
  advBrochureUrl: string;
}

export interface IapdSearchResult {
  query: string;
  total: number;
  firms: IapdFirm[];
}

export interface FundOverview {
  fundQuery: string;
  firmQuery: string;
  fetchedAt: string;
  totalFilings: number;
  recentFilings: EdgarSearchHit[];
  parsedFunds: FormDData[];
  parseErrors: Array<{ accessionNo: string; error: string }>;
  aggregate: {
    totalRaisedAcrossFunds: number;
    totalInvestorsAcrossFunds: number;
    distinctEntities: number;
    distinctRelatedPersons: number;
  };
  iapd: IapdSearchResult;
}

// ---------------------------------------------------------------------------
// Verification model — drives the regulatory cross-check panel.
//
//   verified  → GP-submitted value aligns with a regulatory source
//   partial   → Regulatory source exists but with material drift; "may differ
//               due to timing or fund structure"
//   self      → No third-party source; reported by GP only
//   pending   → GP hasn't disclosed a value (gap to fill)
//   loading   → Data fetch in progress
// ---------------------------------------------------------------------------

export type ConfidenceLevel = "verified" | "partial" | "self" | "pending" | "loading";

export type CheckKey =
  | "entityMatch"
  | "advRegistration"
  | "capitalRaised"
  | "investorCount"
  | "minimumInvestment"
  | "filingTimeline"
  | "keyPersonnel";

/** A single LP-facing regulatory cross-check row. */
export interface RegulatoryCheck {
  key: CheckKey;
  label: string;
  emoji: string;
  confidence: ConfidenceLevel;

  /** Friendly one-line summary (always neutral / non-accusatory). */
  headline: string;

  /** Soft, optional explainer for material drift or context. */
  explainer?: string;

  /** GP-submitted value as displayed. */
  reportedValue?: string;

  /** External / regulatory value as displayed. */
  externalValue?: string;

  /** Optional plain-language delta line. */
  delta?: string;

  /** Source label for the external value (e.g. "SEC Form D", "SEC IAPD"). */
  externalSource?: string;

  /** Optional URL the LP can click to inspect the regulatory source. */
  externalUrl?: string;

  /** Internal 0..100 score, used for tier rollup. Not surfaced as a number. */
  internalScore: number;

  reportedCovered: boolean;
  externalCovered: boolean;

  /** Free-form payload for richer inline visualisations. */
  detail?: Record<string, unknown>;
}

export type VerificationTier = "fully" | "partially" | "self";

export interface VerificationProfile {
  /** 0..100 internal confidence score (rolled up from checks). */
  dataConfidence: number;

  tier: VerificationTier;

  /** Share of expected datapoints the GP has populated (0..100). */
  dataCompleteness: number;

  checks: RegulatoryCheck[];

  /** Discrepancy flags surfaced as soft, framed observations. */
  flags: Array<{
    id: string;
    severity: "info" | "watch" | "review";
    title: string;
    detail: string;
  }>;

  sourceCoverage: {
    verified: number;
    partial: number;
    selfReported: number;
    pending: number;
    total: number;
  };

  computedAt: string;
}
