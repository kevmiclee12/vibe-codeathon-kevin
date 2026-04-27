import type { FundOverview } from "@/types/gp";

const BASE = "/api";

export async function fetchFundOverview(
  fundQuery: string,
  firmQuery: string,
  parseTop = 6,
): Promise<FundOverview> {
  const params = new URLSearchParams({
    fund: fundQuery,
    firm: firmQuery,
    parseTop: String(parseTop),
  });
  const res = await fetch(`${BASE}/fund/overview?${params}`);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Fund overview proxy returned ${res.status}: ${body}`);
  }
  return (await res.json()) as FundOverview;
}
