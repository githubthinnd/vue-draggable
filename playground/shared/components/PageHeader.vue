<script setup lang="ts">
defineProps<{ title: string; description: string; tags?: string[] }>();
</script>

<template>
  <header class="page-header">
    <div class="page-header__tags">
      <span v-for="tag in tags" :key="tag" class="pill pill-gray">{{ tag }}</span>
    </div>
    <h1 class="page-header__title">{{ title }}</h1>
    <p class="page-header__description">{{ description }}</p>
  </header>
</template>

<style>
.page-header {
  margin-bottom: 24px;
}
.page-header__tags {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
}
.page-header__title {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.page-header__description {
  max-width: 720px;
  margin: 6px 0 0;
  color: var(--text-muted);
  font-size: 15px;
}
</style>
