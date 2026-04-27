<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
}>();

const W = computed(() => props.width ?? 120);
const H = computed(() => props.height ?? 36);
// Default color matches design system $success.green-600.
const stroke = computed(() => props.color ?? "#1cc19a");
const wantFill = computed(() => props.fill ?? true);

const points = computed(() => {
  const v = props.values;
  if (!v?.length) return "";
  const min = Math.min(...v);
  const max = Math.max(...v);
  const range = Math.max(1e-6, max - min);
  const stepX = W.value / Math.max(1, v.length - 1);
  return v
    .map((y, i) => {
      const x = i * stepX;
      const ny = H.value - 4 - ((y - min) / range) * (H.value - 8);
      return `${x.toFixed(1)},${ny.toFixed(1)}`;
    })
    .join(" ");
});

const fillPath = computed(() => {
  if (!points.value) return "";
  return `M0,${H.value} L${points.value.replace(/ /g, " L")} L${W.value},${H.value} Z`;
});
</script>

<template>
  <svg :viewBox="`0 0 ${W} ${H}`" :width="W" :height="H" class="block">
    <defs>
      <linearGradient :id="`spark-${stroke.replace('#', '')}`" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" :stop-color="stroke" stop-opacity="0.35" />
        <stop offset="100%" :stop-color="stroke" stop-opacity="0" />
      </linearGradient>
    </defs>
    <path
      v-if="wantFill"
      :d="fillPath"
      :fill="`url(#spark-${stroke.replace('#', '')})`"
    />
    <polyline
      :points="points"
      fill="none"
      :stroke="stroke"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>
