<!-- Inline SVG icons (Lucide-style 24px strokes), no icon font or network request. -->
<script setup lang="ts">
const props = withDefaults(defineProps<{ name: string; size?: number }>(), { size: 16 });

const paths: Record<string, string> = {
  grip: 'M9 5h.01M9 12h.01M9 19h.01M15 5h.01M15 12h.01M15 19h.01',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  kanban: 'M6 3h4v13H6zM14 3h4v8h-4zM3 21h18',
  copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
  hand: 'M8 13V5a2 2 0 1 1 4 0v6m0-1V4a2 2 0 1 1 4 0v7m0-3a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-1a7 7 0 0 1-6-3l-3-5a2 2 0 0 1 3-2l2 2',
  sparkles:
    'M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z',
  layers: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5',
  tree: 'M4 4h6v4H4zM14 10h6v4h-6zM14 17h6v4h-6zM7 8v11h7M7 12h7',
  check: 'M4 12l5 5L20 6',
  swap: 'M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7',
  touch: 'M9 11V5a2 2 0 1 1 4 0v6l4.5.9a2 2 0 0 1 1.6 2.3L18 20H10l-4-5a1.8 1.8 0 0 1 2.7-2.4L9 13',
  sun: 'M12 3v2M12 19v2M5 5l1.4 1.4M17.6 17.6L19 19M3 12h2M19 12h2M5 19l1.4-1.4M17.6 6.4L19 5M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  moon: 'M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z',
  github:
    'M9 19c-4 1.3-4-2-6-2.5M15 21v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12 12 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21',
  plus: 'M12 5v14M5 12h14',
  shuffle: 'M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5',
  sort: 'M3 6h12M3 12h8M3 18h4M17 8V20M14 17l3 3 3-3',
  file: 'M14 3H6v18h12V7zM14 3v4h4',
  folder: 'M3 7h6l2 2h10v10H3z',
  database:
    'M12 3c5 0 8 1.3 8 3s-3 3-8 3-8-1.3-8-3 3-3 8-3zM4 6v12c0 1.7 3 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3 3 8 3s8-1.3 8-3',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  type: 'M4 7V4h16v3M9 20h6M12 4v16',
  image: 'M3 5h18v14H3zM3 16l5-5 5 5 3-3 5 5M15 9h.01',
  button: 'M3 8h18v8H3zM8 12h8',
  minus: 'M5 12h14',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  undo: 'M9 14L4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11',
  redo: 'M15 14l5-5-5-5M20 9H9.5a5.5 5.5 0 0 0 0 11H13',
  x: 'M6 6l12 12M18 6L6 18',
  keyboard: 'M3 6h18v12H3zM7 10h.01M11 10h.01M15 10h.01M7 14h10',
};
</script>

<template>
  <svg
    :width="props.size"
    :height="props.size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="paths[props.name] ?? paths['minus']" />
  </svg>
</template>
