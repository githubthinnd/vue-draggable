<!-- Rendered on the server, hydrated on the client: e2e asserts no hydration warning. -->
<script setup lang="ts">
const { data } = await useAsyncData('ssr-check-items', () =>
  Promise.resolve([
    { id: 1, name: 'server 1' },
    { id: 2, name: 'server 2' },
    { id: 3, name: 'server 3' },
  ]),
);
const list = ref(data.value ?? []);
</script>

<template>
  <Draggable
    v-model="list"
    item-key="id"
    tag="ul"
    class="list"
    data-testid="list"
    :component-data="{ 'aria-label': 'ssr list' }"
  >
    <template #header>
      <li data-testid="header">Header</li>
    </template>
    <template #item="{ element }">
      <li class="item">{{ element.name }}</li>
    </template>
  </Draggable>
  <pre data-testid="state">{{ list.map((p) => p.name).join(',') }}</pre>
</template>
