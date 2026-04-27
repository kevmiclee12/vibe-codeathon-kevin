<script setup lang="ts">
import type { ConfidenceLevel } from "@/types/gp";
import ConfidenceBadge from "./ConfidenceBadge.vue";

defineProps<{
  label: string;
  value: string | number;
  hint?: string;
  confidence?: ConfidenceLevel;
  tone?: "neutral" | "positive" | "negative" | "warn";
}>();
</script>

<template>
  <div class="card card-pad flex flex-col gap-2">
    <div class="flex items-start justify-between gap-2 min-h-[2.25rem]">
      <div class="label">{{ label }}</div>
      <ConfidenceBadge v-if="confidence" :level="confidence" size="xs" />
    </div>
    <div
      class="stat text-left"
      :class="{
        'text-success-700': tone === 'positive',
        'text-danger-600': tone === 'negative',
        'text-warn-700': tone === 'warn',
      }"
    >
      {{ value }}
    </div>
    <div v-if="hint" class="text-xs text-slate-500">{{ hint }}</div>
  </div>
</template>
