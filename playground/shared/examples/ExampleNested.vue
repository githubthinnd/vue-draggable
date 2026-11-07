<script setup lang="ts">
import { ref } from 'vue';
import { projectTree, type TreeNode } from '../data';

const tree = ref(projectTree());
const outline = (nodes: TreeNode[]): unknown[] =>
  nodes.map((n) => (n.kind === 'folder' ? { [n.name]: outline(n.children) } : n.name));
const flat = (nodes: TreeNode[]): string =>
  nodes.map((n) => `${n.name}[${flat(n.children)}]`).join(',');
</script>

<template>
  <DemoLayout>
    <DemoCard title="Project files" hint="Move files between folders or reorder them.">
      <div data-testid="tree"><TreeList :nodes="tree" /></div>
    </DemoCard>
    <template #side>
      <StatePanel label="Tree" :value="outline(tree)" :summary="flat(tree)" />
    </template>
  </DemoLayout>
</template>
