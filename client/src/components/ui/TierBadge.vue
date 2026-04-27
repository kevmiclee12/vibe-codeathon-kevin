<script setup lang="ts">
import { computed } from "vue";
import type { VerificationTier } from "@/types/gp";
import { TIER_META } from "@/services/verification";

const props = defineProps<{
  tier: VerificationTier;
  size?: "sm" | "md" | "lg";
}>();

const meta = computed(() => TIER_META[props.tier]);

const sizeCls = computed(() => {
  switch (props.size ?? "md") {
    case "sm":
      return "px-2 py-0.5 text-[11px]";
    case "md":
      return "px-3 py-1 text-xs";
    case "lg":
      return "px-3.5 py-1.5 text-sm";
  }
});
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 rounded-full border font-semibold',
      meta.chipClass,
      sizeCls,
    ]"
    :title="meta.tooltip"
  >
    <span aria-hidden="true">{{ meta.emoji }}</span>
    <span>{{ meta.label }}</span>
  </span>
</template>
