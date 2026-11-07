// Registration patterns used with vuedraggable@4.1.0.
import { createApp, defineComponent } from 'vue';
import draggable from 'vuedraggable';

const app = createApp({});
app.component('draggable', draggable);
app.component('Draggable', draggable);

export const Wrapper = defineComponent({
  components: { draggable },
  template:
    '<draggable :list="[]" item-key="id"><template #item="{ element }"><b>{{ element }}</b></template></draggable>',
});

export type DraggableInstance = InstanceType<typeof draggable>;
