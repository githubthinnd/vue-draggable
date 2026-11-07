<script setup lang="ts">
import { ref } from 'vue';

const tiles = ref(
  ['Revenue', 'Active users', 'Churn', 'Conversion', 'NPS', 'Latency'].map((name, id) => ({
    id,
    name,
    value: ['$48.2k', '12,431', '2.1%', '4.8%', '62', '118 ms'][id],
  })),
);
</script>

<template>
  <DemoLayout>
    <DemoCard title="Dashboard layout" hint="Drop a tile onto another to swap them.">
      <Draggable
        v-model="tiles"
        item-key="id"
        class="tiles"
        data-testid="list"
        :swap="true"
        swap-class="swap-highlight"
        ghost-class="ghost"
        :animation="200"
      >
        <template #item="{ element }">
          <div class="item tile">
            <span class="subtle">{{ element.name }}</span>
            <strong class="tile__value">{{ element.value }}</strong>
          </div>
        </template>
      </Draggable>
    </DemoCard>
    <template #side>
      <StatePanel
        label="v-model"
        :value="tiles.map((t) => t.name)"
        :summary="tiles.map((t) => t.name).join(',')"
      />
    </template>
  </DemoLayout>
</template>

<style>
.tiles {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.tile {
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 16px;
}
.tile__value {
  font-size: 22px;
  letter-spacing: -0.02em;
}
</style>
