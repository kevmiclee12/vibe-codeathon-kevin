<script setup lang="ts">
import { computed } from "vue";
import { useGPStore } from "@/stores/gp";
import SectionShell from "../ui/SectionShell.vue";
import ConfidenceBadge from "../ui/ConfidenceBadge.vue";
import { fmtPct, fmtUSD } from "@/services/verification";

const gp = useGPStore();
const fund = computed(() => gp.fund);

const minInvestmentConfidence = computed(
  () =>
    gp.verification.checks.find((c) => c.key === "minimumInvestment")
      ?.confidence ?? "self",
);

const rows = computed(() => [
  { key: "Management fee", value: fmtPct(fund.value.ManagementFee, 2) },
  { key: "Performance fee", value: fmtPct(fund.value.PerformanceFee, 1) },
  { key: "Hurdle rate", value: fund.value.HurdleRate ? fmtPct(fund.value.HurdleRate, 1) : "None" },
  { key: "High-water mark", value: fund.value.HighWaterMark ? "Yes" : "No" },
  {
    key: "Managed account minimum",
    value: fund.value.ManagedAccountMinimumInvestment
      ? fmtUSD(fund.value.ManagedAccountMinimumInvestment)
      : "—",
  },
  {
    key: "Lock-up period",
    value: fund.value.LockUpPeriod ? `${fund.value.LockUpPeriod} year${fund.value.LockUpPeriod === 1 ? "" : "s"}` : "None",
  },
  { key: "Redemption frequency", value: fund.value.RedemptionFrequency },
  {
    key: "Redemption notice",
    value: `${fund.value.RedemptionNoticePeriod} days`,
  },
  {
    key: "Redemption days",
    value: `${fund.value.DaysRedemption} days`,
  },
  {
    key: "Investors gated",
    value: fund.value.InvestorsGated ? "Yes" : "No",
  },
]);
</script>

<template>
  <SectionShell
    emoji="📜"
    title="Terms"
    subtitle="Fee schedule, liquidity, and gating disclosures. Most terms are GP-submitted; the minimum-investment row is cross-checked against Form D."
  >
    <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
      <div
        v-for="r in rows"
        :key="r.key"
        class="flex items-start justify-between gap-3 border-b border-slate-200 pb-2"
      >
        <dt class="text-sm text-slate-500">{{ r.key }}</dt>
        <dd class="text-sm font-medium text-slate-900 tabular-nums flex flex-col items-end gap-1 text-right">

          <span>{{ r.value }}</span>
        </dd>
      </div>
    </dl>
  </SectionShell>
</template>
