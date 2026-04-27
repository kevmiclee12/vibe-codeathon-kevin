import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { pershingFund, SEC_FUND_QUERY, SEC_FIRM_QUERY } from "@/data/pershing";
import type { FundOverview, VerificationProfile } from "@/types/gp";
import { fetchFundOverview } from "@/services/edgar";
import { computeVerificationProfile } from "@/services/verification";

export type DashboardView = "summary" | "sources";

// Renamed conceptually to a "fund store"; keep `useGPStore` as the export
// to minimise import churn elsewhere.
export const useGPStore = defineStore("fund", () => {
  const fund = ref(pershingFund);

  const edgar = ref<FundOverview | undefined>(undefined);
  const edgarLoading = ref(false);
  const edgarError = ref<string | undefined>(undefined);
  const edgarLoadedAt = ref<string | undefined>(undefined);

  const view = ref<DashboardView>("summary");
  function setView(v: DashboardView) {
    view.value = v;
  }

  async function loadEdgar(force = false) {
    if (edgarLoading.value) return;
    if (edgar.value && !force) return;
    edgarLoading.value = true;
    edgarError.value = undefined;
    try {
      const data = await fetchFundOverview(SEC_FUND_QUERY, SEC_FIRM_QUERY, 6);
      edgar.value = data;
      edgarLoadedAt.value = new Date().toISOString();
    } catch (e: unknown) {
      edgarError.value = e instanceof Error ? e.message : String(e);
    } finally {
      edgarLoading.value = false;
    }
  }

  const verification = computed<VerificationProfile>(() =>
    computeVerificationProfile(fund.value, edgar.value, edgarLoading.value),
  );

  return {
    fund,
    edgar,
    edgarLoading,
    edgarError,
    edgarLoadedAt,
    loadEdgar,
    verification,
    view,
    setView,
  };
});
