<script setup lang="ts">
import { computed } from "vue";
import { useGPStore } from "@/stores/gp";
import SectionShell from "../ui/SectionShell.vue";
import ConfidenceBadge from "../ui/ConfidenceBadge.vue";

const gp = useGPStore();
const fund = computed(() => gp.fund);

const facts = computed(() => [
  { key: "Domiciles", value: fund.value.Domiciles.join(" · ") || "—" },
  { key: "Investment Vehicles", value: fund.value.InvestmentVehicles.join(" · ") || "—" },
  { key: "Geography", value: fund.value.GeographicConcentrations.join(" · ") || "—" },
  { key: "Sectors", value: fund.value.Sectors.slice(0, 4).join(" · ") + (fund.value.Sectors.length > 4 ? "…" : "") },
  { key: "Primary instruments", value: fund.value.PrimaryInstruments.join(" · ") || "—" },
  { key: "Benchmark", value: fund.value.BenchMarkName ?? "—" },
]);
</script>

<template>
  <SectionShell
    emoji="📚"
    title="About this fund"
    subtitle="GP-submitted strategy and manager context. SEC filings do not publish strategy descriptions, so these fields are self-reported."
  >
    <template #header-right>
      <ConfidenceBadge level="self" size="xs" />
    </template>

    <div class="flex flex-col gap-4">
      <div>
        <h3 class="label mb-1.5">Fund description</h3>
        <p class="text-sm text-slate-200 leading-relaxed">
          {{ fund.FundDescription }}
        </p>
      </div>

      <div>
        <h3 class="label mb-1.5">Strategy</h3>
        <p class="text-sm text-slate-200 leading-relaxed">
          {{ fund.StrategyDescription }}
        </p>
      </div>

      <div>
        <h3 class="label mb-1.5">Manager biography</h3>
        <p class="text-sm text-slate-200 leading-relaxed">
          {{ fund.ManagerBiography }}
        </p>
      </div>

      <dl
        class="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 mt-1 border-t border-white/5 pt-4"
      >
        <div v-for="row in facts" :key="row.key" class="flex flex-col gap-0.5">
          <dt class="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">
            {{ row.key }}
          </dt>
          <dd class="text-sm text-slate-200">{{ row.value }}</dd>
        </div>
      </dl>
    </div>
  </SectionShell>
</template>
