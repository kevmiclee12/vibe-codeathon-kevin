<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  score: number;
  size?: number;
  color?: string;
  trackColor?: string;
}>();

const SIZE = computed(() => props.size ?? 220);
const STROKE = 14;
const radius = computed(() => SIZE.value / 2 - STROKE);
const circumference = computed(() => 2 * Math.PI * radius.value);
const dashOffset = computed(
  () => circumference.value * (1 - Math.max(0, Math.min(100, props.score)) / 100),
);
const stroke = computed(() => props.color ?? "#34D399");
const track = computed(() => props.trackColor ?? "rgba(148,163,184,0.12)");

const id = computed(() => `score-grad-${(stroke.value || "").replace("#", "")}-${Math.round(props.score)}`);
</script>

<template>
  <svg
    :viewBox="`0 0 ${SIZE} ${SIZE}`"
    :width="SIZE"
    :height="SIZE"
    class="block -rotate-90"
  >
    <defs>
      <linearGradient :id="id" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" :stop-color="stroke" stop-opacity="1" />
        <stop offset="100%" :stop-color="stroke" stop-opacity="0.5" />
      </linearGradient>
    </defs>
    <circle
      :cx="SIZE / 2"
      :cy="SIZE / 2"
      :r="radius"
      :stroke="track"
      :stroke-width="STROKE"
      fill="none"
    />
    <circle
      :cx="SIZE / 2"
      :cy="SIZE / 2"
      :r="radius"
      :stroke="`url(#${id})`"
      :stroke-width="STROKE"
      fill="none"
      stroke-linecap="round"
      :stroke-dasharray="circumference"
      :stroke-dashoffset="dashOffset"
      style="transition: stroke-dashoffset 0.7s ease-out"
    />
  </svg>
</template>
