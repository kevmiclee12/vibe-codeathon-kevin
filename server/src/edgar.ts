import { XMLParser } from "fast-xml-parser";

const SEC_UA =
  process.env.SEC_USER_AGENT ??
  "GP Reputation Demo (research/demo contact: demo@gp-reputation-demo.local)";

const SEC_HEADERS: HeadersInit = {
  "User-Agent": SEC_UA,
  Accept: "application/json, text/xml, */*",
  "Accept-Encoding": "gzip, deflate",
};

const xml = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  parseTagValue: true,
  trimValues: true,
});

async function secFetch(url: string, accept = "application/json"): Promise<Response> {
  const res = await fetch(url, {
    headers: { ...SEC_HEADERS, Accept: accept },
  });
  if (!res.ok) {
    throw new Error(`SEC ${res.status} ${res.statusText} for ${url}`);
  }
  return res;
}

// ---------------------------------------------------------------------------
// Full-text search across EDGAR (efts) — used to discover Sequoia filings.
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

export interface EdgarSearchResult {
  total: number;
  hits: EdgarSearchHit[];
  query: string;
}

export async function searchFilings(opts: {
  q: string;
  forms?: string;
  from?: number;
  size?: number;
  startdt?: string;
  enddt?: string;
}): Promise<EdgarSearchResult> {
  const params = new URLSearchParams({
    q: opts.q,
    forms: opts.forms ?? "D",
    from: String(opts.from ?? 0),
  });
  if (opts.startdt) params.set("dateRange", "custom"), params.set("startdt", opts.startdt);
  if (opts.enddt) params.set("enddt", opts.enddt);

  const url = `https://efts.sec.gov/LATEST/search-index?${params.toString()}`;
  const res = await secFetch(url);
  const data = (await res.json()) as any;

  const rawHits: any[] = data?.hits?.hits ?? [];
  const hits: EdgarSearchHit[] = rawHits.map((h) => {
    const src = h._source ?? {};
    const adsh: string = src.adsh ?? h._id ?? "";
    const ciks: string[] = src.ciks ?? [];
    return {
      accessionNo: adsh,
      cik: ciks[0] ?? "",
      ciks,
      displayNames: src.display_names ?? [],
      filedAt: src.file_date ?? "",
      form: src.form ?? "",
      fileType: src.file_type,
    };
  });

  const total =
    typeof data?.hits?.total === "object"
      ? data.hits.total.value
      : data?.hits?.total ?? hits.length;

  return { total, hits, query: opts.q };
}

// ---------------------------------------------------------------------------
// Submissions feed for a single CIK — gives us recent filings list.
// ---------------------------------------------------------------------------

export interface EdgarSubmission {
  cik: string;
  name: string;
  sic?: string;
  sicDescription?: string;
  recentFilings: Array<{
    accessionNo: string;
    form: string;
    filingDate: string;
    primaryDocument: string;
    primaryDocDescription?: string;
  }>;
}

export async function fetchSubmissions(cik: string): Promise<EdgarSubmission> {
  const padded = cik.padStart(10, "0");
  const url = `https://data.sec.gov/submissions/CIK${padded}.json`;
  const res = await secFetch(url);
  const data = (await res.json()) as any;
  const recent = data?.filings?.recent ?? {};
  const filings: EdgarSubmission["recentFilings"] = [];
  const len = recent.accessionNumber?.length ?? 0;
  for (let i = 0; i < len; i++) {
    filings.push({
      accessionNo: recent.accessionNumber[i],
      form: recent.form[i],
      filingDate: recent.filingDate[i],
      primaryDocument: recent.primaryDocument[i],
      primaryDocDescription: recent.primaryDocDescription?.[i],
    });
  }
  return {
    cik: padded,
    name: data?.name ?? "",
    sic: data?.sic,
    sicDescription: data?.sicDescription,
    recentFilings: filings,
  };
}

// ---------------------------------------------------------------------------
// Form D primary_doc.xml — structured fundraising data
// ---------------------------------------------------------------------------

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

function asNumberOrIndefinite(v: any): number | "Indefinite" | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  if (typeof v === "string" && v.toLowerCase().includes("indefinite")) return "Indefinite";
  const n = typeof v === "number" ? v : Number(String(v).replace(/[, $]/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

function asNumber(v: any): number | undefined {
  const out = asNumberOrIndefinite(v);
  return typeof out === "number" ? out : undefined;
}

function asBool(v: any): boolean | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const s = String(v).toLowerCase();
  if (s === "true" || s === "y" || s === "yes" || s === "1") return true;
  if (s === "false" || s === "n" || s === "no" || s === "0") return false;
  return undefined;
}

function accessionToPath(accessionNo: string): string {
  return accessionNo.replace(/-/g, "");
}

export async function fetchFormD(
  cik: string,
  accessionNo: string,
): Promise<FormDData> {
  const cikNum = String(parseInt(cik, 10));
  const accNoDashes = accessionToPath(accessionNo);
  const primaryDocUrl = `https://www.sec.gov/Archives/edgar/data/${cikNum}/${accNoDashes}/primary_doc.xml`;
  const filingUrl = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cikNum}&type=D&dateb=&owner=include&count=40`;

  const res = await secFetch(primaryDocUrl, "text/xml");
  const text = await res.text();
  const parsed = xml.parse(text);
  const sub = parsed?.edgarSubmission ?? {};

  const issuer = sub.primaryIssuer ?? {};
  const offeringData = sub.offeringData ?? {};
  const offeringSales = offeringData.offeringSalesAmounts ?? {};
  const investors = offeringData.investors ?? {};
  const typeOfFiling = offeringData.typeOfFiling ?? {};

  const relatedRaw = sub.relatedPersonsList?.relatedPersonInfo ?? [];
  const relatedArr = Array.isArray(relatedRaw) ? relatedRaw : [relatedRaw];

  const cleanNamePart = (s: any): string => {
    if (s === undefined || s === null) return "";
    const str = String(s).trim();
    if (!str) return "";
    if (/^[-–—.]+$/.test(str)) return "";
    return str;
  };

  const relatedPersons: FormDRelatedPerson[] = relatedArr
    .filter(Boolean)
    .map((p: any) => {
      const nameNode = p.relatedPersonName ?? {};
      const fullName = [
        cleanNamePart(nameNode.firstName),
        cleanNamePart(nameNode.middleName),
        cleanNamePart(nameNode.lastName),
      ]
        .filter(Boolean)
        .join(" ")
        .trim();

      const relRaw = p.relatedPersonRelationshipList?.relationship;
      const relationships: string[] = relRaw
        ? Array.isArray(relRaw)
          ? relRaw.map(String)
          : [String(relRaw)]
        : [];

      return { name: fullName, relationships };
    })
    .filter((p: FormDRelatedPerson) => p.name.length > 0);

  return {
    cik: cikNum,
    accessionNo,
    primaryDocUrl,
    filingUrl,
    entityName: String(issuer.entityName ?? ""),
    entityType: issuer.entityType,
    yearOfIncorporation: issuer.yearOfIncorporation,
    jurisdictionOfIncorporation: issuer.jurisdictionOfInc,
    industryGroup:
      offeringData.industryGroup?.industryGroupType ??
      offeringData.industryGroup?.investmentFundInfo?.investmentFundType,
    issuerSize:
      offeringData.issuerSize?.aggregateNetAssetValueRange ??
      offeringData.issuerSize?.revenueRange,
    newOrAmendment:
      typeof typeOfFiling.newOrAmendment === "object"
        ? Object.keys(typeOfFiling.newOrAmendment).find((k) => typeOfFiling.newOrAmendment[k]) ??
          undefined
        : typeOfFiling.newOrAmendment,
    dateOfFirstSale:
      typeOfFiling.dateOfFirstSale?.value ?? typeOfFiling.dateOfFirstSale,
    durationMoreThanOneYear: asBool(offeringData.durationOfOffering?.moreThanOneYear),
    totalOfferingAmount: asNumberOrIndefinite(offeringSales.totalOfferingAmount),
    totalAmountSold: asNumber(offeringSales.totalAmountSold),
    totalRemaining: asNumberOrIndefinite(offeringSales.totalRemaining),
    hasNonAccreditedInvestors: asBool(investors.hasNonAccreditedInvestors),
    totalNumberAlreadyInvested: asNumber(investors.totalNumberAlreadyInvested),
    minimumInvestmentAccepted: asNumber(offeringData.minimumInvestmentAccepted),
    relatedPersons,
  };
}

// ---------------------------------------------------------------------------
// IAPD (Investment Adviser Public Disclosure) — adviserinfo.sec.gov
// Public search API that backs https://adviserinfo.sec.gov/
//
// We use it to answer "is this firm a registered investment adviser?" so the
// LP-facing UI can show ADV registration / disclosure status alongside Form D
// fundraising signals from EDGAR.
// ---------------------------------------------------------------------------

export interface IapdFirm {
  sourceId: string; // CRD-equivalent firm id used by IAPD
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
  /** Direct link to the firm's IAPD profile. */
  profileUrl: string;
  /** Direct link to the firm's most recent ADV brochure on adviserinfo. */
  advBrochureUrl: string;
}

export interface IapdSearchResult {
  query: string;
  total: number;
  firms: IapdFirm[];
}

function safeJsonParse<T>(raw: unknown): T | undefined {
  if (typeof raw !== "string") return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

export async function searchIapdFirms(query: string): Promise<IapdSearchResult> {
  const params = new URLSearchParams({
    query,
    hl: "true",
    nrows: "10",
    start: "0",
    includePrev: "Y",
  });
  const url = `https://api.adviserinfo.sec.gov/search/firm?${params.toString()}`;

  let data: any;
  try {
    const res = await secFetch(url);
    data = await res.json();
  } catch (e: any) {
    return { query, total: 0, firms: [] };
  }

  const rawHits: any[] = data?.hits?.hits ?? [];
  const total =
    typeof data?.hits?.total === "number"
      ? data.hits.total
      : data?.hits?.total?.value ?? rawHits.length;

  const firms: IapdFirm[] = rawHits.map((h) => {
    const s = h._source ?? {};
    const sourceId = String(s.firm_source_id ?? "");
    const addr =
      safeJsonParse<{
        officeAddress?: {
          street1?: string;
          street2?: string;
          city?: string;
          state?: string;
          country?: string;
          postalCode?: string;
        };
      }>(s.firm_ia_address_details)?.officeAddress ?? {};
    return {
      sourceId,
      name: String(s.firm_name ?? ""),
      otherNames: Array.isArray(s.firm_other_names) ? s.firm_other_names : [],
      iaSecNumber: s.firm_ia_sec_number ? String(s.firm_ia_sec_number) : undefined,
      iaFullSecNumber: s.firm_ia_full_sec_number
        ? String(s.firm_ia_full_sec_number)
        : undefined,
      scope: String(s.firm_ia_scope ?? "UNKNOWN"),
      hasDisclosures: String(s.firm_ia_disclosure_fl ?? "N").toUpperCase() === "Y",
      branchesCount: typeof s.firm_branches_count === "number" ? s.firm_branches_count : undefined,
      address: addr,
      profileUrl: sourceId
        ? `https://adviserinfo.sec.gov/firm/summary/${sourceId}`
        : "https://adviserinfo.sec.gov/",
      advBrochureUrl: sourceId
        ? `https://reports.adviserinfo.sec.gov/reports/ADV/${sourceId}/PDF/${sourceId}.pdf`
        : "https://adviserinfo.sec.gov/",
    };
  });

  return { query, total, firms };
}

// ---------------------------------------------------------------------------
// Fund overview — orchestrate EDGAR search + parse top Form Ds + IAPD lookup.
// One composite call so the client doesn't have to fan out.
// ---------------------------------------------------------------------------

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

export async function fetchFundOverview(
  fundQuery: string,
  firmQuery: string,
  parseTop = 6,
): Promise<FundOverview> {
  const [search, iapd] = await Promise.all([
    searchFilings({ q: `"${fundQuery}"`, forms: "D", size: 30 }),
    searchIapdFirms(firmQuery),
  ]);

  // EDGAR's full-text search returns hits in relevance order, not strict
  // date-desc, so the absolute latest filing isn't guaranteed to be in the
  // first N hits. Sort by filedAt before slicing so the parsed set always
  // corresponds to the most recent filings (matches what the client renders
  // in the raw EDGAR hits table).
  const sortedHits = [...search.hits].sort((a, b) =>
    (b.filedAt ?? "").localeCompare(a.filedAt ?? ""),
  );
  const top = sortedHits.slice(0, parseTop);
  const parsedFunds: FormDData[] = [];
  const parseErrors: FundOverview["parseErrors"] = [];

  for (const hit of top) {
    if (!hit.cik || !hit.accessionNo) continue;
    try {
      const fd = await fetchFormD(hit.cik, hit.accessionNo);
      fd.filedAt = hit.filedAt;
      parsedFunds.push(fd);
    } catch (e: any) {
      parseErrors.push({
        accessionNo: hit.accessionNo,
        error: e?.message ?? String(e),
      });
    }
  }

  const totalRaisedAcrossFunds = parsedFunds.reduce(
    (sum, f) => sum + (f.totalAmountSold ?? 0),
    0,
  );
  const totalInvestorsAcrossFunds = parsedFunds.reduce(
    (sum, f) => sum + (f.totalNumberAlreadyInvested ?? 0),
    0,
  );
  const entitySet = new Set(parsedFunds.map((f) => f.entityName));
  const personSet = new Set(
    parsedFunds.flatMap((f) => f.relatedPersons.map((p) => p.name)),
  );

  return {
    fundQuery,
    firmQuery,
    fetchedAt: new Date().toISOString(),
    totalFilings: search.total,
    recentFilings: search.hits,
    parsedFunds,
    parseErrors,
    aggregate: {
      totalRaisedAcrossFunds,
      totalInvestorsAcrossFunds,
      distinctEntities: entitySet.size,
      distinctRelatedPersons: personSet.size,
    },
    iapd,
  };
}
