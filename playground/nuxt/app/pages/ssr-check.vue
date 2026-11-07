<!-- Rendered on the server, hydrated on the client: the e2e suite asserts no hydration warning. -->
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
  <AppShell active="ssr-check" framework="Nuxt" :href="(target: string) => `/${target}`">
    <PageHeader
      title="SSR check"
      description="This list is rendered on the server and hydrated in the browser without a mismatch."
      :tags="['SSR', 'hydration']"
    />
    <DemoLayout>
      <DemoCard title="Server-rendered list">
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
      </DemoCard>
      <template #side>
        <StatePanel
          label="v-model"
          :value="list.map((p) => p.name)"
          :summary="list.map((p) => p.name).join(',')"
        />
      </template>
    </DemoLayout>
  </AppShell>
</template>
