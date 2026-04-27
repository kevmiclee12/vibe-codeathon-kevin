<script setup lang="ts">
defineProps<{
  emoji?: string;
  title: string;
  subtitle?: string;
  anchor?: string;
}>();
</script>

<template>
  <section :id="anchor" class="card card-pad fade-in">
    <header class="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between border-b border-white/5 pb-4 mb-5">
      <div class="flex items-center gap-3">
        <span v-if="emoji" class="text-2xl" aria-hidden="true">{{ emoji }}</span>
        <div>
          <h2 class="text-lg font-semibold text-slate-50 tracking-tight">{{ title }}</h2>
          <p v-if="subtitle" class="text-sm text-slate-400">{{ subtitle }}</p>
        </div>
      </div>
      <slot name="header-right" />
    </header>
    <slot />
  </section>
</template>
