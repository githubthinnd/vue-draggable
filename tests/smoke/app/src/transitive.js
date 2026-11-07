// vuedraggable reached through a dependency: replaced only by package-manager `overrides`.
import { LibDraggable } from 'ui-lib';
import * as vue from 'vue';
import { check } from './mount.js';

check('through a dependency (overrides)', LibDraggable, vue);
