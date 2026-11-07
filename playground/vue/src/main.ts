import { createApp } from 'vue';
import draggable from '@stacklogs/vue-draggable';
import { draggableDefaultsKey, mountSortablePlugins } from '@stacklogs/vue-draggable/plugins';
import AppAvatar from '@shared/components/AppAvatar.vue';
import AppIcon from '@shared/components/AppIcon.vue';
import AppShell from '@shared/components/AppShell.vue';
import DemoCard from '@shared/components/DemoCard.vue';
import DemoLayout from '@shared/components/DemoLayout.vue';
import HistoryToolbar from '@shared/components/HistoryToolbar.vue';
import PageHeader from '@shared/components/PageHeader.vue';
import StatePanel from '@shared/components/StatePanel.vue';
import TaskCard from '@shared/components/TaskCard.vue';
import TreeList from '@shared/examples/TreeList.vue';
import '@shared/styles/theme.css';
import App from './App.vue';

// Multi-select drag and swap, mounted once on the engine the component uses.
mountSortablePlugins('MultiDrag', 'Swap');

const app = createApp(App);
// The shared examples use <Draggable> without importing it, like the Nuxt module's auto-import.
app.component('Draggable', draggable);
for (const [name, component] of Object.entries({
  AppAvatar,
  AppIcon,
  AppShell,
  DemoCard,
  DemoLayout,
  HistoryToolbar,
  PageHeader,
  StatePanel,
  TaskCard,
  TreeList,
})) {
  app.component(name, component);
}
// Recording mode (GIFs for the README) and ?pointer=1 drag with pointer events: pointer mode.
const query = new URLSearchParams(location.search);
if (query.has('record') || query.has('pointer')) {
  app.provide(draggableDefaultsKey, {
    forceFallback: true,
    fallbackTolerance: 0,
    fallbackOnBody: false,
  });
}
app.mount('#app');
