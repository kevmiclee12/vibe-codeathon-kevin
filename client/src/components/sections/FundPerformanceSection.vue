<script setup lang="ts">
import { computed } from "vue";
import { useGPStore } from "@/stores/gp";
import SectionShell from "../ui/SectionShell.vue";
import { fmtPct, fmtUSD } from "@/services/verification";

const gp = useGPStore();
const fund = computed(() => gp.fund);

const rows = computed(() => [
  { key: "Annualized return", value: fmtPct(fund.value.AnnualizedReturn, 1) },
  { key: "YTD return", value: fmtPct(fund.value.YTDReturn, 1) },
  { key: "Annual std. deviation", value: fmtPct(fund.value.AnnualStandardDeviation, 1) },
  { key: "Sharpe ratio", value: fund.value.SharpeRatio.toFixed(2) },
  { key: "Sortino ratio", value: fund.value.SortinoRatio.toFixed(2) },
  { key: "Sterling ratio", value: fund.value.SterlingRatio?.toFixed(2) ?? "—" },
  { key: "Avg monthly gain", value: fmtPct(fund.value.AverageMonthlyGain, 2) },
  { key: "Avg monthly loss", value: fmtPct(fund.value.AverageMonthlyLoss, 2) },
  { key: "Largest drawdown", value: fmtPct(fund.value.LargestDrawdown, 1) },
  { key: "Drawdown length", value: `${fund.value.LengthLargestDrawdown} months` },
  { key: "Peak", value: fund.value.PeakDate },
  { key: "Trough", value: fund.value.TroughDate },
  { key: "AUM cap", value: fmtUSD(fund.value.AUMMaximumCapacity) },
]);
</script>

<template>
  <SectionShell
    emoji="📈"
    title="Performance & risk"
    subtitle="Self-reported by the GP. The SEC does not publish private-fund performance figures, so these values cannot be cross-checked externally."
  >
    <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
      <div
        v-for="r in rows"
        :key="r.key"
        class="flex items-start justify-between gap-3 border-b border-slate-200 pb-2"
      >
        <dt class="text-sm text-slate-500">{{ r.key }}</dt>
        <dd class="text-sm font-medium text-slate-900 tabular-nums">{{ r.value }}</dd>
      </div>
    </dl>

    <p class="mt-4 text-xs text-slate-500 italic leading-relaxed">
      Past performance is not indicative of future results. Returns are net of fees and have not
      been independently verified. Benchmark: {{ fund.BenchMarkName ?? "—" }}.
    </p>
  </SectionShell>
</template>
