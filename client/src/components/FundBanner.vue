<script setup lang="ts">
import { computed } from "vue";
import { useGPStore } from "@/stores/gp";
import { TIER_META } from "@/services/verification";
import TierBadge from "./ui/TierBadge.vue";
import ScoreRing from "./ui/ScoreRing.vue";

const gp = useGPStore();

const fund = computed(() => gp.fund);
const verification = computed(() => gp.verification);
const tier = computed(() => TIER_META[verification.value.tier]);
const inceptionYear = computed(() =>
  fund.value.InceptionDate ? fund.value.InceptionDate.slice(0, 4) : "—",
);

const fundraisingChipClass = computed(() => {
  switch (fund.value.FundRaisingStatus) {
    case "Open":
    case "Open to New Investors":
      return "border-sky-500/40 bg-sky-500/10 text-sky-300";
    case "Soft Close":
      return "border-warn-500/40 bg-warn-500/10 text-warn-400";
    case "Hard Close":
    case "Closed":
      return "border-slate-500/40 bg-slate-500/10 text-slate-300";
    default:
      return "border-slate-500/40 bg-slate-500/10 text-slate-300";
  }
});
</script>

<template>
  <section class="card card-pad fade-in overflow-hidden">
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
      <div class="flex flex-col gap-3 min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <span
            :class="[
              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap',
              fundraisingChipClass,
            ]"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
            {{ fund.FundRaisingStatus }}
          </span>
          <span class="chip">
            <span aria-hidden="true">🏦</span>
            Hedge Fund
          </span>
          <span class="chip">{{ fund.PrimaryStrategy }}</span>
        </div>

        <a
          :href="fund.Company.websiteUrl ?? '#'"
          target="_blank"
          rel="noreferrer noopener"
          class="text-sm font-medium text-sky-300 hover:text-sky-200 transition w-fit"
        >
          {{ fund.Company.name }}
        </a>

        <div class="flex items-start gap-3 flex-wrap">
          <h1 class="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-50">
            {{ fund.Name }}
          </h1>
        </div>

        <div class="flex items-center gap-x-3 gap-y-1 text-sm text-slate-400 flex-wrap">
          <span>{{ fund.Company.location }}</span>
          <span class="text-slate-600">·</span>
          <span>Inception {{ inceptionYear }}</span>
          <span class="text-slate-600">·</span>
          <span>{{ fund.Strategy }}</span>
        </div>

        <p class="text-sm text-slate-300 leading-relaxed mt-1 max-w-3xl">
          {{ fund.ShortDescription }}
        </p>

        <div class="flex items-center gap-2 flex-wrap pt-1">
          <TierBadge :tier="verification.tier" size="md" />
          <span class="text-xs text-slate-500">
            Cross-checked against SEC EDGAR Form D and SEC IAPD adviser registry.
          </span>
        </div>
      </div>

      <div class="flex flex-col items-center justify-center gap-3 min-w-0">
        <div class="relative h-44 w-44 sm:h-48 sm:w-48 shrink-0">
          <ScoreRing
            :score="verification.dataConfidence"
            :size="192"
            :color="tier.ringColor"
          />
          <div class="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <div
              class="text-4xl font-semibold tabular-nums tracking-tight text-slate-50"
            >
              {{ verification.dataConfidence.toFixed(0) }}<span class="text-base text-slate-400">%</span>
            </div>
            <div class="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-semibold">
              Data confidence
            </div>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-2 text-center w-full max-w-[280px]">
          <div class="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5">
            <div class="text-sm font-semibold text-accent-300 tabular-nums">
              {{ verification.sourceCoverage.verified }}
            </div>
            <div class="text-[10px] uppercase tracking-wide text-slate-400">Verified</div>
          </div>
          <div class="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5">
            <div class="text-sm font-semibold text-warn-400 tabular-nums">
              {{ verification.sourceCoverage.partial }}
            </div>
            <div class="text-[10px] uppercase tracking-wide text-slate-400">Partial</div>
          </div>
          <div class="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5">
            <div class="text-sm font-semibold text-slate-200 tabular-nums">
              {{ verification.sourceCoverage.selfReported }}
            </div>
            <div class="text-[10px] uppercase tracking-wide text-slate-400">Self</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
