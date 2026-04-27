<script setup lang="ts">
import { computed } from "vue";
import { useGPStore } from "@/stores/gp";
import SectionShell from "../ui/SectionShell.vue";
import { fmtUSD, latestPerEntity } from "@/services/verification";

const gp = useGPStore();
const overview = computed(() => gp.edgar);

const recentHits = computed(() => overview.value?.recentFilings.slice(0, 6) ?? []);
const parsedFunds = computed(() =>
  overview.value ? latestPerEntity(overview.value.parsedFunds) : [],
);

function fmtAccession(acc: string) {
  return acc;
}
</script>

<template>
  <SectionShell
    emoji="🏛️"
    title="Live SEC filings"
    subtitle="Form D filings discovered for the matching entity, pulled live from SEC EDGAR."
  >
    <template #header-right>
      <div v-if="gp.edgarLoading" class="chip-blue">
        <span class="h-1.5 w-1.5 rounded-full bg-sky-400 live-dot" />
        Loading…
      </div>
      <div
        v-else-if="overview"
        class="chip-green"
        :title="`Last refreshed ${gp.edgarLoadedAt ?? overview.fetchedAt}`"
      >
        <span class="h-1.5 w-1.5 rounded-full bg-accent-400 live-dot" />
        {{ overview.totalFilings }} filings indexed
      </div>
      <div v-else-if="gp.edgarError" class="chip-red">EDGAR error</div>
    </template>

    <div class="flex flex-col gap-5">
      <div>
        <h3 class="label mb-2">Latest filings (raw EDGAR hits)</h3>
        <div class="overflow-x-auto rounded-lg border border-white/5">
          <table class="w-full text-xs">
            <thead class="bg-white/5 text-slate-400">
              <tr>
                <th class="px-3 py-2 text-left font-medium">Filed</th>
                <th class="px-3 py-2 text-left font-medium">Form</th>
                <th class="px-3 py-2 text-left font-medium">Entity</th>
                <th class="px-3 py-2 text-left font-medium">Accession</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              <tr v-if="!recentHits.length">
                <td colspan="4" class="px-3 py-4 text-center text-slate-500">
                  {{ gp.edgarLoading ? "Loading…" : "No filings yet." }}
                </td>
              </tr>
              <tr
                v-for="h in recentHits"
                :key="h.accessionNo"
                class="hover:bg-white/[0.03]"
              >
                <td class="px-3 py-2 text-slate-300 whitespace-nowrap">{{ h.filedAt }}</td>
                <td class="px-3 py-2 text-slate-200">{{ h.form }}</td>
                <td class="px-3 py-2 text-slate-200">
                  {{ h.displayNames?.[0] ?? "—" }}
                </td>
                <td class="px-3 py-2 font-mono text-slate-400">
                  {{ fmtAccession(h.accessionNo) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 class="label mb-2">Parsed Form D — latest per entity</h3>
        <div class="overflow-x-auto rounded-lg border border-white/5">
          <table class="w-full text-xs">
            <thead class="bg-white/5 text-slate-400">
              <tr>
                <th class="px-3 py-2 text-left font-medium">Entity</th>
                <th class="px-3 py-2 text-right font-medium">Amount sold</th>
                <th class="px-3 py-2 text-right font-medium">Investors</th>
                <th class="px-3 py-2 text-right font-medium">Min</th>
                <th class="px-3 py-2 text-right font-medium">Filed</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              <tr v-if="!parsedFunds.length">
                <td colspan="5" class="px-3 py-4 text-center text-slate-500">
                  {{ gp.edgarLoading ? "Loading…" : "No parsed Form D filings yet." }}
                </td>
              </tr>
              <tr
                v-for="f in parsedFunds"
                :key="f.accessionNo"
                class="hover:bg-white/[0.03]"
              >
                <td class="px-3 py-2 text-slate-200">
                  <div class="flex flex-col gap-0.5">
                    <span class="font-medium">{{ f.entityName }}</span>
                    <a
                      :href="f.filingUrl"
                      target="_blank"
                      rel="noreferrer noopener"
                      class="text-[10px] text-sky-300 hover:text-sky-200 transition w-fit"
                    >
                      CIK {{ f.cik.padStart(10, "0") }} ↗
                    </a>
                  </div>
                </td>
                <td class="px-3 py-2 text-right text-slate-100 tabular-nums">
                  {{ fmtUSD(f.totalAmountSold) }}
                </td>
                <td class="px-3 py-2 text-right text-slate-100 tabular-nums">
                  {{ f.totalNumberAlreadyInvested ?? "—" }}
                </td>
                <td class="px-3 py-2 text-right text-slate-100 tabular-nums">
                  {{ fmtUSD(f.minimumInvestmentAccepted) }}
                </td>
                <td class="px-3 py-2 text-right text-slate-300 tabular-nums whitespace-nowrap">
                  {{ f.filedAt ?? "—" }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </SectionShell>
</template>
