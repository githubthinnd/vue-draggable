<script setup lang="ts">
import { ref } from 'vue';
import { fieldPalette, type Field } from '../data';

const palette = ref(fieldPalette());
const form = ref<Field[]>([{ id: 100, type: 'text', label: 'Full name', icon: 'type' }]);
let next = 200;
const cloneField = (field: Field): Field => ({ ...field, id: next++ });
</script>

<template>
  <DemoLayout>
    <div class="builder">
      <DemoCard title="Fields" hint="Drag to add">
        <Draggable
          :list="palette"
          :group="{ name: 'form', pull: 'clone', put: false }"
          :clone="cloneField"
          :sort="false"
          item-key="id"
          class="list"
          data-testid="source"
        >
          <template #item="{ element }">
            <div class="item palette-item">
              <AppIcon :name="element.icon" :size="16" /> {{ element.label }}
            </div>
          </template>
        </Draggable>
      </DemoCard>
      <DemoCard title="Sign-up form" hint="Reorder or drop new fields here">
        <Draggable
          v-model="form"
          group="form"
          item-key="id"
          class="list form-canvas"
          data-testid="target"
          ghost-class="ghost"
          :animation="200"
        >
          <template #item="{ element }">
            <div class="item form-field">
              <AppIcon name="grip" class="grip" :size="16" />
              <div class="form-field__body">
                <span class="form-field__label">{{ element.label }}</span>
                <span class="form-field__input">{{ element.type }}</span>
              </div>
            </div>
          </template>
        </Draggable>
      </DemoCard>
    </div>
    <template #side>
      <StatePanel
        label="Form fields"
        :value="form.map((f) => f.label)"
        :summary="`${palette.map((f) => f.label).join(',')}|${form.map((f) => f.label).join(',')}`"
      />
    </template>
  </DemoLayout>
</template>

<style>
.builder {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}
.palette-item {
  gap: 10px;
  font-weight: 500;
}
.form-canvas {
  min-height: 240px;
  padding: 10px;
  border: 1.5px dashed var(--border-strong);
  border-radius: var(--radius);
}
.form-field__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
}
.form-field__label {
  font-size: 12.5px;
  font-weight: 600;
}
.form-field__input {
  height: 32px;
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-subtle);
  color: var(--text-subtle);
  font-size: 12px;
}
@media (max-width: 760px) {
  .builder {
    grid-template-columns: 1fr;
  }
}
</style>
