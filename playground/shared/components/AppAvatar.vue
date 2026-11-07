<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ name: string }>();
const palette = ['#4f46e5', '#0ea5e9', '#12b76a', '#f79009', '#e8467c', '#7a5af8', '#14b8a6'];
const initials = computed(() =>
  props.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase(),
);
const color = computed(
  () => palette[[...props.name].reduce((sum, c) => sum + c.charCodeAt(0), 0) % palette.length],
);
</script>

<template>
  <span class="avatar" :style="{ background: color }" :title="props.name">{{ initials }}</span>
</template>
