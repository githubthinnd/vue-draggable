<!-- Live view of the bound data: what v-model / list contains right now. -->
<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ value: unknown; label?: string; summary: string }>();
const json = computed(() => JSON.stringify(props.value, null, 2));
const lines = computed(() => json.value.split('\n'));
</script>

<template>
  <aside class="state-panel">
    <header class="state-panel__header">
      <AppIcon name="database" :size="14" />
      <span>{{ label ?? 'Live data' }}</span>
      <span class="state-panel__dot" />
    </header>
    <pre
      class="state-panel__code"
    ><code><span v-for="(line, i) in lines" :key="i" class="line">{{ line }}
</span></code></pre>
    <!-- Compact form read by the end-to-end tests. -->
    <span class="sr-only" data-testid="state">{{ summary }}</span>
  </aside>
</template>

<style>
.state-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}
.state-panel__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.state-panel__dot {
  width: 7px;
  height: 7px;
  margin-left: auto;
  border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 0 3px var(--green-soft);
}
.state-panel__code {
  flex: 1;
  margin: 0;
  padding: 14px 16px;
  overflow: auto;
  background: var(--bg-subtle);
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.6;
}
</style>
