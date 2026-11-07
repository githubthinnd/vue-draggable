<script setup lang="ts">
defineProps<{ title?: string; hint?: string }>();
</script>

<template>
  <section class="demo-card">
    <header v-if="title || $slots['actions']" class="demo-card__header">
      <div>
        <h2 v-if="title" class="demo-card__title">{{ title }}</h2>
        <p v-if="hint" class="demo-card__hint">{{ hint }}</p>
      </div>
      <div class="demo-card__actions"><slot name="actions" /></div>
    </header>
    <div class="demo-card__body"><slot /></div>
  </section>
</template>

<style>
.demo-card {
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}
.demo-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border);
}
.demo-card__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}
.demo-card__hint {
  margin: 2px 0 0;
  color: var(--text-muted);
  font-size: 12.5px;
}
.demo-card__actions {
  display: flex;
  gap: 8px;
}
.demo-card__body {
  padding: 18px;
}
</style>
