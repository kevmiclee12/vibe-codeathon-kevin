<script setup lang="ts">
import { computed } from "vue";
import { useGPStore } from "@/stores/gp";
import SectionShell from "../ui/SectionShell.vue";
import ConfidenceBadge from "../ui/ConfidenceBadge.vue";

const gp = useGPStore();
const fund = computed(() => gp.fund);

const rows = computed(() => [
  { key: "Prime broker", value: fund.value.PrimaryPrimeBroker },
  { key: "Secondary prime", value: fund.value.SecondaryPrimeBroker ?? "—" },
  { key: "Legal counsel", value: fund.value.LegalCounsel },
  { key: "Administrator", value: fund.value.FundAdministrator },
  { key: "Auditor", value: fund.value.Auditor },
  { key: "Accounting firm", value: fund.value.AccountingFirm ?? "—" },
]);
</script>

<template>
  <SectionShell
    emoji="🤝"
    title="Service providers"
    subtitle="Counterparty disclosures provided by the GP."
  >
    <template #header-right>
      <ConfidenceBadge level="self" size="xs" />
    </template>

    <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
      <div
        v-for="r in rows"
        :key="r.key"
        class="flex items-start justify-between gap-3 border-b border-white/5 pb-2"
      >
        <dt class="text-sm text-slate-400">{{ r.key }}</dt>
        <dd class="text-sm font-medium text-slate-100">{{ r.value }}</dd>
      </div>
    </dl>
  </SectionShell>
</template>
