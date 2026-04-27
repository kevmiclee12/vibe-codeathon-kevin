<script setup lang="ts">
import { onMounted } from "vue";
import { useGPStore } from "@/stores/gp";
import HeaderBar from "./HeaderBar.vue";
import FundBanner from "./FundBanner.vue";
import FundStatsRow from "./FundStatsRow.vue";
import RegulatoryCrossCheckPanel from "./RegulatoryCrossCheckPanel.vue";
import AboutFundSection from "./sections/AboutFundSection.vue";
import FundTermsSection from "./sections/FundTermsSection.vue";
import FundPerformanceSection from "./sections/FundPerformanceSection.vue";
import ServiceProvidersSection from "./sections/ServiceProvidersSection.vue";
import InvestmentTeamSection from "./sections/InvestmentTeamSection.vue";
import DocumentsSection from "./sections/DocumentsSection.vue";
import SecFilingsSection from "./sections/SecFilingsSection.vue";

const gp = useGPStore();

onMounted(() => {
  gp.loadEdgar().catch(() => {
    /* surfaced via gp.edgarError */
  });
});
</script>

<template>
  <div class="min-h-screen">
    <HeaderBar />
    <main class="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <FundBanner />
      <FundStatsRow />

      <RegulatoryCrossCheckPanel />

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_504px]">
        <div class="flex flex-col gap-6 min-w-0">
          <AboutFundSection />
          <ServiceProvidersSection />
          <InvestmentTeamSection />
        </div>
        <div class="flex flex-col gap-6 min-w-0">
          <FundPerformanceSection />
          <FundTermsSection />
          <DocumentsSection />
        </div>
      </div>

      <SecFilingsSection />

      <footer class="pt-6 pb-10 text-center text-xs text-slate-500">
        <div>
          Verification layer for private markets · demo build. Live data from
          <a
            href="https://www.sec.gov/edgar"
            class="underline hover:text-info-700"
            target="_blank"
            rel="noreferrer noopener"
          >SEC EDGAR</a>
          and
          <a
            href="https://adviserinfo.sec.gov/"
            class="underline hover:text-info-700"
            target="_blank"
            rel="noreferrer noopener"
          >SEC IAPD</a>.
          Fund profile data is seeded for illustration.
        </div>
      </footer>
    </main>
  </div>
</template>
