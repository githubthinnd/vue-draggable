<!-- Typical vuedraggable@4.1.0 usage with the Options API (patterns from the upstream examples). -->
<script lang="ts">
import { defineComponent } from 'vue';
import draggable from 'vuedraggable';

interface Person {
  id: number;
  name: string;
}

export default defineComponent({
  components: { draggable },
  data() {
    return {
      list: [{ id: 1, name: 'John' }] as Person[],
      other: [] as Person[],
      drag: false,
    };
  },
  computed: {
    dragOptions() {
      return { animation: 200, group: 'people', disabled: false, ghostClass: 'ghost' };
    },
  },
  methods: {
    log(evt: unknown) {
      return evt;
    },
    checkMove(evt: any) {
      return evt.draggedContext.element.name !== 'apple';
    },
    cloneDog({ id }: Person): Person {
      return { id: id + 100, name: 'cat' };
    },
  },
});
</script>

<template>
  <div>
    <draggable
      v-model="list"
      item-key="id"
      v-bind="dragOptions"
      tag="transition-group"
      :component-data="{ tag: 'ul', type: 'transition-group', name: !drag ? 'flip-list' : null }"
      :move="checkMove"
      @start="drag = true"
      @end="drag = false"
      @change="log"
    >
      <template #item="{ element, index }">
        <li>{{ element.name }} {{ index }}</li>
      </template>
      <template #header>
        <h3>Header</h3>
      </template>
      <template #footer>
        <button>Add</button>
      </template>
    </draggable>
    <draggable
      :list="other"
      :group="{ name: 'people', pull: 'clone', put: false }"
      :clone="cloneDog"
      :item-key="(e: Person) => e.id"
      handle=".handle"
      class="list-group"
    >
      <template #item="{ element }">
        <div class="list-group-item"><i class="handle" />{{ element.name }}</div>
      </template>
    </draggable>
  </div>
</template>
