<script setup lang="ts">
import { computed } from "vue";
import { useGPStore } from "@/stores/gp";
import SectionShell from "../ui/SectionShell.vue";
import ConfidenceBadge from "../ui/ConfidenceBadge.vue";

const gp = useGPStore();
const fund = computed(() => gp.fund);
const personnelCheck = computed(() =>
  gp.verification.checks.find((c) => c.key === "keyPersonnel"),
);
</script>

<template>
  <SectionShell
    emoji="🧑‍💼"
    title="Investment team"
    subtitle="GP-submitted partner roster. Where Form D discloses related persons, those names are corroborated against the deck."
  >
    <template #header-right>
      <ConfidenceBadge :level="personnelCheck?.confidence ?? 'self'" size="xs" />
    </template>

    <ul class="flex flex-col divide-y divide-white/5">
      <li
        v-for="m in fund.InvestmentTeam"
        :key="m.name"
        class="flex flex-col gap-1 py-3 first:pt-0 last:pb-0"
      >
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <div class="flex items-center gap-3">
            <div
              class="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm text-slate-200 font-semibold"
              aria-hidden="true"
            >
              {{ m.name.split(" ").map((s) => s[0]).slice(0, 2).join("") }}
            </div>
            <div>
              <div class="text-sm font-medium text-slate-100">{{ m.name }}</div>
              <div class="text-xs text-slate-400">{{ m.title }}</div>
            </div>
          </div>
          <div class="text-xs text-slate-400">
            {{ m.tenureYears }} yrs at firm
          </div>
        </div>
        <p v-if="m.bio" class="text-xs text-slate-400 leading-relaxed pl-12">
          {{ m.bio }}
        </p>
      </li>
    </ul>

    <p
      v-if="personnelCheck?.explainer"
      class="mt-4 text-xs text-slate-500 italic leading-relaxed"
    >
      {{ personnelCheck.explainer }}
    </p>
  </SectionShell>
</template>
