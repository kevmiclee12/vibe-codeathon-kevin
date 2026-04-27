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
    <div class="flex items-center justify-between gap-2">
      <div class="label">{{ label }}</div>
      <ConfidenceBadge v-if="confidence" :level="confidence" size="xs" />
    </div>
    <div
      class="stat"
      :class="{
        'text-accent-300': tone === 'positive',
        'text-danger-400': tone === 'negative',
        'text-warn-400': tone === 'warn',
      }"
    >
      {{ value }}
    </div>
    <div v-if="hint" class="text-xs text-slate-400">{{ hint }}</div>
  </div>
</template>
