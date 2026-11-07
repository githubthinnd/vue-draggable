import { createApp } from 'vue';
import { mountSortablePlugins } from '@vue-draggable/core/plugins';
import App from './App.vue';
import './style.css';

// #221: MultiDrag and Swap, mounted once on the Sortable the component uses.
mountSortablePlugins('MultiDrag', 'Swap');

createApp(App).mount('#app');
