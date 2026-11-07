// The usual #49 workaround in vuedraggable@4.1.0 projects.
import draggable from 'vuedraggable/src/vuedraggable';
import * as vue from 'vue';
import { check } from './mount.js';

check('deep import vuedraggable/src/vuedraggable', draggable, vue);
