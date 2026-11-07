<template>
  <nav>
    <NuxtLink v-for="page in pages" :key="page" :to="`/${page}`">{{ page }}</NuxtLink>
  </nav>
  <NuxtPage />
</template>

<script setup lang="ts">
const pages = [
  'basic',
  'two-lists',
  'clone',
  'nested',
  'transition-group',
  'multidrag',
  'header-footer',
  'ssr-check',
];
</script>
