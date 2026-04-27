<script setup lang="ts">
import { computed } from "vue";
import { useGPStore } from "@/stores/gp";

const gp = useGPStore();

const fetchedAt = computed(() => gp.edgarLoadedAt ?? gp.edgar?.fetchedAt);
const fetchedAtRel = computed(() => {
  if (!fetchedAt.value) return null;
  const ms = Date.now() - new Date(fetchedAt.value).getTime();
  if (ms < 60_000) return "just now";
  const m = Math.round(ms / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return `${h}h ago`;
});
</script>

<template>
  <header
    class="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-xl"
  >
    <div
      class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6"
    >
      <div class="flex items-center gap-3 min-w-0">
        <div
          class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 ring-1 ring-brand-700/15 shadow-sm"
        >
          <span class="text-lg text-white" aria-hidden="true">🛡️</span>
        </div>
        <div class="flex flex-col leading-tight min-w-0">
          <span
            class="text-[11px] uppercase tracking-[0.18em] text-slate-500 font-semibold whitespace-nowrap"
          >
            Verification layer
          </span>
          <span class="text-sm font-semibold text-slate-900 truncate">
            {{ gp.fund.Name }}
            <span class="text-slate-300 font-normal">·</span>
            <span class="font-normal text-slate-600">{{ gp.fund.Company.name }}</span>
          </span>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <div v-if="gp.edgarLoading" class="chip-blue">
          <span class="h-1.5 w-1.5 rounded-full bg-info-500 live-dot" />
          Fetching SEC…
        </div>
        <div
          v-else-if="gp.edgar"
          class="chip-green"
          :title="`Live data fetched ${fetchedAtRel ?? ''}`"
        >
          <span class="h-1.5 w-1.5 rounded-full bg-success-600 live-dot" />
          SEC live · {{ fetchedAtRel ?? "now" }}
        </div>
        <div v-else-if="gp.edgarError" class="chip-red">SEC error</div>
        <button
          class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition whitespace-nowrap"
          :disabled="gp.edgarLoading"
          @click="gp.loadEdgar(true)"
        >
          {{ gp.edgar ? "Refresh" : "Load SEC data" }}
        </button>
      </div>
    </div>
  </header>
</template>
