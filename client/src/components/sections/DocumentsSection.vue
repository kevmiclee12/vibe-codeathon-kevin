<script setup lang="ts">
import { computed } from "vue";
import { useGPStore } from "@/stores/gp";
import SectionShell from "../ui/SectionShell.vue";
import ConfidenceBadge from "../ui/ConfidenceBadge.vue";

const gp = useGPStore();
const fund = computed(() => gp.fund);

const advRegistration = computed(() =>
  gp.verification.checks.find((c) => c.key === "advRegistration"),
);

const advBrochureUrl = computed(() => {
  const detail = advRegistration.value?.detail as
    | { advBrochureUrl?: string }
    | undefined;
  return detail?.advBrochureUrl ?? fund.value.ADVFormURL;
});

const docs = computed(() => {
  const items: Array<{
    key: string;
    label: string;
    href?: string;
    badge: "self" | "verified" | "partial" | "pending";
    description: string;
  }> = [];
  if (fund.value.MarketingMaterialURL) {
    items.push({
      key: "marketing",
      label: "Marketing materials",
      href: fund.value.MarketingMaterialURL,
      badge: "self",
      description: "GP-uploaded fund deck and tearsheet.",
    });
  }
  if (fund.value.MarketingMaterialURL2) {
    items.push({
      key: "strategy",
      label: "Strategy deck",
      href: fund.value.MarketingMaterialURL2,
      badge: "self",
      description: "Long-form strategy presentation.",
    });
  }
  if (fund.value.HistoricalReturnsURL) {
    items.push({
      key: "returns",
      label: "Historical returns",
      href: fund.value.HistoricalReturnsURL,
      badge: "self",
      description: "Self-reported monthly return series.",
    });
  }
  if (advBrochureUrl.value) {
    items.push({
      key: "adv",
      label: "Form ADV brochure (live)",
      href: advBrochureUrl.value,
      badge: advRegistration.value?.confidence === "verified" ? "verified" : "partial",
      description: "Most recent ADV Part 2 brochure pulled from SEC IAPD.",
    });
  }
  return items;
});
</script>

<template>
  <SectionShell
    emoji="📎"
    title="Documents"
    subtitle="GP-uploaded materials and the firm's live ADV brochure from SEC IAPD."
  >
    <ul class="flex flex-col gap-2">
      <li
        v-for="d in docs"
        :key="d.key"
        class="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3"
      >
        <div class="min-w-0 flex flex-col gap-0.5">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-sm font-medium text-slate-100">{{ d.label }}</span>
            <ConfidenceBadge :level="d.badge" size="xs" />
          </div>
          <p class="text-xs text-slate-400">{{ d.description }}</p>
        </div>
        <a
          v-if="d.href"
          :href="d.href"
          target="_blank"
          rel="noreferrer noopener"
          class="text-xs font-medium text-sky-300 hover:text-sky-200 transition whitespace-nowrap"
        >
          Open ↗
        </a>
      </li>
    </ul>
  </SectionShell>
</template>
