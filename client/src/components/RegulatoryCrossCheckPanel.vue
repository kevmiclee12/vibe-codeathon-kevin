<script setup lang="ts">
import { computed } from "vue";
import { useGPStore } from "@/stores/gp";
import SectionShell from "./ui/SectionShell.vue";
import ConfidenceBadge from "./ui/ConfidenceBadge.vue";
import { CONFIDENCE_META } from "@/services/verification";

const gp = useGPStore();
const checks = computed(() => gp.verification.checks);
const flags = computed(() => gp.verification.flags);

const flagSeverityMeta: Record<
  "info" | "watch" | "review",
  { label: string; chipClass: string; iconBg: string; icon: string }
> = {
  info: {
    label: "Info",
    chipClass: "border-info-200 bg-info-50 text-info-700",
    iconBg: "bg-info-50 ring-1 ring-inset ring-info-200",
    icon: "ℹ️",
  },
  watch: {
    label: "Watch",
    chipClass: "border-warn-200 bg-warn-50 text-warn-800",
    iconBg: "bg-warn-50 ring-1 ring-inset ring-warn-200",
    icon: "⚠️",
  },
  review: {
    label: "Review",
    chipClass: "border-danger-200 bg-danger-50 text-danger-800",
    iconBg: "bg-danger-50 ring-1 ring-inset ring-danger-200",
    icon: "🔎",
  },
};
</script>

<template>
  <SectionShell
    emoji="🛡️"
    title="Regulatory cross-check"
    subtitle="Each GP-submitted datapoint is compared against the corresponding SEC source. Verified, partial, and self-reported labels are applied based on what regulatory filings disclose — not on judgments about the GP."
  >
    <template #header-right>
      <div
        v-if="gp.edgarLoading"
        class="chip-blue"
      >
        <span class="h-1.5 w-1.5 rounded-full bg-info-500 live-dot" />
        Querying EDGAR & IAPD…
      </div>
      <div
        v-else-if="gp.edgar"
        class="chip-green"
        :title="`Last refreshed ${gp.edgarLoadedAt ?? gp.edgar.fetchedAt}`"
      >
        <span class="h-1.5 w-1.5 rounded-full bg-success-600 live-dot" />
        Live SEC sources
      </div>
      <div v-else-if="gp.edgarError" class="chip-red">SEC source error</div>
    </template>

    <!-- Cross-check rows -->
    <div class="flex flex-col gap-3">
      <article
        v-for="c in checks"
        :key="c.key"
        :class="[
          'rounded-xl border p-4 transition bg-surface-50/60',
          CONFIDENCE_META[c.confidence].rowClass,
        ]"
      >
        <div class="flex items-start justify-between gap-3 flex-wrap">
          <div class="flex items-start gap-3 min-w-0">
            <div
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white ring-1 ring-slate-200 text-base"
              aria-hidden="true"
            >
              {{ c.emoji }}
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="text-sm font-semibold text-slate-900">{{ c.label }}</h3>
                <ConfidenceBadge :level="c.confidence" size="xs" />
              </div>
              <p class="mt-1 text-sm text-slate-700 leading-relaxed">{{ c.headline }}</p>
              <p
                v-if="c.explainer"
                class="mt-1 text-xs text-slate-500 italic leading-relaxed"
              >
                {{ c.explainer }}
              </p>
            </div>
          </div>
          <div v-if="c.delta" class="text-xs font-medium text-slate-500 whitespace-nowrap">
            {{ c.delta }}
          </div>
        </div>

        <div
          v-if="c.reportedValue || c.externalValue"
          class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          <div
            class="rounded-lg border border-slate-200 bg-white p-3 flex flex-col gap-1"
          >
            <div class="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-slate-500 font-semibold">
              <span aria-hidden="true">📊</span>
              GP-submitted
            </div>
            <div class="text-sm font-medium text-slate-900 tabular-nums">
              {{ c.reportedValue ?? "Not provided" }}
            </div>
          </div>
          <div
            class="rounded-lg border border-slate-200 bg-white p-3 flex flex-col gap-1"
          >
            <div
              class="flex items-center justify-between gap-2 text-[10px] uppercase tracking-wide text-slate-500 font-semibold"
            >
              <span class="flex items-center gap-1.5">
                <span aria-hidden="true">🏛️</span>
                {{ c.externalSource ?? "Regulatory source" }}
              </span>
              <a
                v-if="c.externalUrl"
                :href="c.externalUrl"
                target="_blank"
                rel="noreferrer noopener"
                class="link normal-case font-medium"
              >
                Open ↗
              </a>
            </div>
            <div class="text-sm font-medium text-slate-900 tabular-nums">
              {{ c.externalValue ?? "Not available" }}
            </div>
          </div>
        </div>
      </article>
    </div>

    <!-- Discrepancy flags -->
    <div
      v-if="flags.length"
      class="mt-6 border-t border-slate-200 pt-5 flex flex-col gap-2"
    >
      <h3 class="label flex items-center gap-2">
        <span aria-hidden="true">🚩</span>
        Data discrepancy flags
      </h3>
      <p class="text-xs text-slate-500 max-w-3xl">
        Each flag describes a data difference, not a verdict on the GP. Common causes include
        timing, master/feeder structure, side-letter terms, or the cumulative nature of Form D.
      </p>
      <ul class="flex flex-col gap-2">
        <li
          v-for="f in flags"
          :key="f.id"
          class="flex items-start gap-3 rounded-lg border border-slate-200 bg-surface-50 p-3"
        >
          <span
            :class="[
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sm',
              flagSeverityMeta[f.severity].iconBg,
            ]"
            aria-hidden="true"
          >
            {{ flagSeverityMeta[f.severity].icon }}
          </span>
          <div class="min-w-0 flex flex-col gap-0.5">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-sm font-medium text-slate-900">{{ f.title }}</span>
              <span
                :class="[
                  'inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                  flagSeverityMeta[f.severity].chipClass,
                ]"
              >
                {{ flagSeverityMeta[f.severity].label }}
              </span>
            </div>
            <p class="text-xs text-slate-600 leading-relaxed">{{ f.detail }}</p>
            <a
              v-if="f.actionUrl"
              :href="f.actionUrl"
              target="_blank"
              rel="noreferrer noopener"
              class="link text-xs font-medium mt-0.5 self-start"
            >
              {{ f.actionLabel ?? "Open source ↗" }}
            </a>
          </div>
        </li>
      </ul>
    </div>
  </SectionShell>
</template>
