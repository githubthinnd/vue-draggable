<script setup lang="ts">
import type { TreeNode } from '../data';

defineOptions({ name: 'TreeList' });
defineProps<{ nodes: TreeNode[]; depth?: number }>();
</script>

<template>
  <Draggable
    :list="nodes"
    item-key="name"
    tag="ul"
    class="tree"
    group="tree"
    ghost-class="ghost"
    :animation="180"
  >
    <template #item="{ element }">
      <li class="tree-node">
        <div class="item tree-row" :style="{ paddingLeft: `${12 + (depth ?? 0) * 18}px` }">
          <AppIcon
            :name="element.kind === 'folder' ? 'folder' : 'file'"
            :size="15"
            :class="element.kind"
          />
          <span>{{ element.name }}</span>
        </div>
        <TreeList
          v-if="element.kind === 'folder'"
          :nodes="element.children"
          :depth="(depth ?? 0) + 1"
        />
      </li>
    </template>
  </Draggable>
</template>

<style>
.tree {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.tree .tree {
  margin-top: 4px;
}
.tree-row {
  padding-top: 7px;
  padding-bottom: 7px;
  box-shadow: none;
}
.tree-row .folder {
  color: var(--amber);
}
.tree-row .file {
  color: var(--blue);
}
</style>
