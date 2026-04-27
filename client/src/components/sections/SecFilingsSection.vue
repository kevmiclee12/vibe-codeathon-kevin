<script setup lang="ts">
import { computed, ref } from "vue";
import { useGPStore } from "@/stores/gp";
import SectionShell from "../ui/SectionShell.vue";
import { filingIndexUrl, fmtUSD, latestPerEntity } from "@/services/verification";

const gp = useGPStore();
const overview = computed(() => gp.edgar);

// EDGAR returns hits in relevance order. We re-sort by `filedAt` descending so
// the table reads chronologically. ISO `YYYY-MM-DD` strings are lex-sortable.
const COLLAPSED_LIMIT = 6;
const showAllRecent = ref(false);

const sortedRecentHits = computed(() => {
  const list = overview.value?.recentFilings ?? [];
  return [...list].sort((a, b) => (b.filedAt ?? "").localeCompare(a.filedAt ?? ""));
});
const visibleRecentHits = computed(() =>
  showAllRecent.value
    ? sortedRecentHits.value
    : sortedRecentHits.value.slice(0, COLLAPSED_LIMIT),
);

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
        <span class="h-1.5 w-1.5 rounded-full bg-info-500 live-dot" />
        Loading…
      </div>
      <div
        v-else-if="overview"
        class="chip-green"
        :title="`Last refreshed ${gp.edgarLoadedAt ?? overview.fetchedAt}`"
      >
        <span class="h-1.5 w-1.5 rounded-full bg-success-600 live-dot" />
        {{ overview.totalFilings }} filings indexed
      </div>
      <div v-else-if="gp.edgarError" class="chip-red">EDGAR error</div>
    </template>

    <div class="flex flex-col gap-5">
      <div>
        <div class="flex items-baseline justify-between gap-3 mb-2">
          <h3 class="label">Latest filings (raw EDGAR hits)</h3>
          <span
            v-if="sortedRecentHits.length"
            class="text-[11px] text-slate-500 tabular-nums"
          >
            Showing {{ visibleRecentHits.length }} of {{ sortedRecentHits.length }} ·
            sorted by filed date
          </span>
        </div>
        <div class="overflow-x-auto rounded-lg border border-slate-200">
          <table class="w-full text-xs">
            <thead class="bg-surface-50 text-slate-500">
              <tr>
                <th class="px-3 py-2 text-left font-medium">Filed ↓</th>
                <th class="px-3 py-2 text-left font-medium">Form</th>
                <th class="px-3 py-2 text-left font-medium">Entity</th>
                <th class="px-3 py-2 text-left font-medium">Accession</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 bg-white">
              <tr v-if="!visibleRecentHits.length">
                <td colspan="4" class="px-3 py-4 text-center text-slate-500">
                  {{ gp.edgarLoading ? "Loading…" : "No filings yet." }}
                </td>
              </tr>
              <tr
                v-for="h in visibleRecentHits"
                :key="h.accessionNo"
                class="hover:bg-surface-50"
              >
                <td class="px-3 py-2 text-slate-600 whitespace-nowrap tabular-nums">
                  {{ h.filedAt }}
                </td>
                <td class="px-3 py-2 text-slate-800">{{ h.form }}</td>
                <td class="px-3 py-2 text-slate-800">
                  {{ h.displayNames?.[0] ?? "—" }}
                </td>
                <td class="px-3 py-2 font-mono">
                  <a
                    :href="filingIndexUrl(h.cik, h.accessionNo)"
                    target="_blank"
                    rel="noreferrer noopener"
                    class="link inline-flex items-center gap-1 whitespace-nowrap"
                    :title="`Open ${h.accessionNo} on SEC EDGAR`"
                  >
                    <span>{{ fmtAccession(h.accessionNo) }}</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <button
          v-if="sortedRecentHits.length > COLLAPSED_LIMIT"
          type="button"
          class="mt-2 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-info-700 hover:bg-slate-50 hover:border-slate-300 transition"
          :aria-expanded="showAllRecent"
          @click="showAllRecent = !showAllRecent"
        >
          <span aria-hidden="true">{{ showAllRecent ? "▴" : "▾" }}</span>
          <span>
            {{
              showAllRecent
                ? `Show top ${COLLAPSED_LIMIT}`
                : `Show all ${sortedRecentHits.length} filings`
            }}
          </span>
        </button>
      </div>

      <div>
        <h3 class="label mb-2">Parsed Form D — latest per entity</h3>
        <div class="overflow-x-auto rounded-lg border border-slate-200">
          <table class="w-full text-xs">
            <thead class="bg-surface-50 text-slate-500">
              <tr>
                <th class="px-3 py-2 text-left font-medium">Entity</th>
                <th class="px-3 py-2 text-right font-medium">Amount sold</th>
                <th class="px-3 py-2 text-right font-medium">Investors</th>
                <th class="px-3 py-2 text-right font-medium">Min</th>
                <th class="px-3 py-2 text-right font-medium">Filed</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 bg-white">
              <tr v-if="!parsedFunds.length">
                <td colspan="5" class="px-3 py-4 text-center text-slate-500">
                  {{ gp.edgarLoading ? "Loading…" : "No parsed Form D filings yet." }}
                </td>
              </tr>
              <tr
                v-for="f in parsedFunds"
                :key="f.accessionNo"
                class="hover:bg-surface-50"
              >
                <td class="px-3 py-2 text-slate-800">
                  <div class="flex flex-col gap-0.5">
                    <span class="font-medium">{{ f.entityName }}</span>
                    <a
                      :href="f.filingUrl"
                      target="_blank"
                      rel="noreferrer noopener"
                      class="link text-[10px] w-fit"
                    >
                      CIK {{ f.cik.padStart(10, "0") }} ↗
                    </a>
                  </div>
                </td>
                <td class="px-3 py-2 text-right text-slate-900 tabular-nums">
                  {{ fmtUSD(f.totalAmountSold) }}
                </td>
                <td class="px-3 py-2 text-right text-slate-900 tabular-nums">
                  {{ f.totalNumberAlreadyInvested ?? "—" }}
                </td>
                <td class="px-3 py-2 text-right text-slate-900 tabular-nums">
                  {{ fmtUSD(f.minimumInvestmentAccepted) }}
                </td>
                <td class="px-3 py-2 text-right text-slate-600 tabular-nums whitespace-nowrap">
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
