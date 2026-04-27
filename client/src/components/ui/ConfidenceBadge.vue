<script setup lang="ts">
import { computed } from "vue";
import type { ConfidenceLevel } from "@/types/gp";
import { CONFIDENCE_META } from "@/services/verification";

const props = defineProps<{
  level: ConfidenceLevel;
  size?: "xs" | "sm" | "md";
  withDot?: boolean;
}>();

const meta = computed(() => CONFIDENCE_META[props.level]);

const sizeCls = computed(() => {
  switch (props.size ?? "sm") {
    case "xs":
      return "px-1.5 py-0.5 text-[10px]";
    case "sm":
      return "px-2 py-0.5 text-[11px]";
    case "md":
      return "px-2.5 py-1 text-xs";
  }
});
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 rounded-full border font-medium',
      meta.chipClass,
      sizeCls,
    ]"
    :title="meta.tooltip"
  >
    <span
      v-if="withDot ?? true"
      :class="['h-1.5 w-1.5 rounded-full', meta.dot]"
      aria-hidden="true"
    />
    <span>{{ meta.label }}</span>
  </span>
</template>
