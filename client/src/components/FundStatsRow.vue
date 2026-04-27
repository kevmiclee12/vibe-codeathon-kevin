<script setup lang="ts">
import { computed } from "vue";
import { useGPStore } from "@/stores/gp";
import StatCard from "./ui/StatCard.vue";
import { fmtUSD, fmtPct } from "@/services/verification";
import type { ConfidenceLevel } from "@/types/gp";

const gp = useGPStore();
const fund = computed(() => gp.fund);

// The 6 KPIs that LPs typically scan first. Each carries a confidence
// level that tells the LP whether the figure is verifiable externally
// (capital raised, min investment) or strictly self-reported (returns,
// risk metrics — there is no public regulatory feed for these).
function checkConfidence(key: string): ConfidenceLevel | undefined {
  return gp.verification.checks.find((c) => c.key === key)?.confidence;
}

const stats = computed(() => [
  {
    label: "Fund AUM (USD)",
    value: fmtUSD(fund.value.FundAUM),
    hint: `As of ${fund.value.AUM_as_of_Date}`,
    confidence: checkConfidence("capitalRaised"),
  },
  {
    label: "Inception",
    value: fund.value.InceptionDate.slice(0, 4),
    hint: fund.value.InceptionDate,
    confidence: checkConfidence("filingTimeline"),
  },
  {
    label: "Min Investment (USD)",
    value: fmtUSD(fund.value.MinimumInvestment),
    hint:
      fund.value.ManagedAccountMinimumInvestment
        ? `${fmtUSD(fund.value.ManagedAccountMinimumInvestment)} for managed accounts`
        : "LP fund minimum",
    confidence: checkConfidence("minimumInvestment"),
  },
  {
    label: "Annualized Return",
    value: fmtPct(fund.value.AnnualizedReturn, 1),
    hint: "Net of fees, since inception",
    confidence: "self" as ConfidenceLevel,
  },
  {
    label: "Largest Drawdown",
    value: fmtPct(fund.value.LargestDrawdown, 1),
    hint: `${fund.value.LengthLargestDrawdown}-month length`,
    confidence: "self" as ConfidenceLevel,
  },
  {
    label: "Sharpe Ratio",
    value: fund.value.SharpeRatio.toFixed(2),
    hint: `Sortino ${fund.value.SortinoRatio.toFixed(2)}`,
    confidence: "self" as ConfidenceLevel,
  },
]);
</script>

<template>
  <section class="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6 fade-in">
    <StatCard
      v-for="s in stats"
      :key="s.label"
      :label="s.label"
      :value="s.value"
      :hint="s.hint"
      :confidence="s.confidence"
    />
  </section>
</template>
