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
    <header class="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between border-b border-slate-200 pb-4 mb-5">
      <div class="flex items-start gap-3 min-w-0">
        <span v-if="emoji" class="text-2xl leading-none mt-0.5" aria-hidden="true">{{ emoji }}</span>
        <div class="min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <h2 class="text-lg font-semibold text-slate-900 tracking-tight">{{ title }}</h2>
            <slot name="title-chip" />
          </div>
          <p v-if="subtitle" class="text-sm text-slate-500 max-w-2xl">{{ subtitle }}</p>
        </div>
      </div>
      <slot name="header-right" />
    </header>
    <slot />
  </section>
</template>
