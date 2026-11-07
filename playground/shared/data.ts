// Sample data for the playground examples (fresh copies per call, so examples do not share state).
import type { Task } from './components/TaskCard.vue';

export type { Task };

export interface Example {
  id: string;
  title: string;
  icon: string;
  group: string;
  description: string;
  tags: string[];
}

export const examples: Example[] = [
  {
    id: 'sortable',
    title: 'Sortable list',
    icon: 'list',
    group: 'Basics',
    description:
      'Reorder items with drag and drop. The array bound with v-model updates on every drop.',
    tags: ['v-model', 'animation'],
  },
  {
    id: 'handle',
    title: 'Drag handle',
    icon: 'grip',
    group: 'Basics',
    description:
      'Only the grip starts a drag, so the rest of the row stays clickable and selectable.',
    tags: ['handle'],
  },
  {
    id: 'header-footer',
    title: 'Header & footer',
    icon: 'layers',
    group: 'Basics',
    description: 'Static content before and after the items, outside the draggable area.',
    tags: ['slots'],
  },
  {
    id: 'trash',
    title: 'Delete & undo',
    icon: 'trash',
    group: 'Basics',
    description:
      'Delete with a button, by dropping on the trash or outside the list, then undo and redo. Escape cancels a drag.',
    tags: ['remove-on-spill', 'useDraggableHistory', 'cancel-on-escape'],
  },
  {
    id: 'kanban',
    title: 'Kanban board',
    icon: 'kanban',
    group: 'Multiple lists',
    description:
      'Columns share a group, so cards move between them. Each column keeps its own array.',
    tags: ['group', 'change event'],
  },
  {
    id: 'clone',
    title: 'Form builder',
    icon: 'copy',
    group: 'Multiple lists',
    description:
      'Drag fields from the palette to clone them into the form. The palette never changes.',
    tags: ['pull: clone', 'clone()'],
  },
  {
    id: 'transition',
    title: 'Animated sorting',
    icon: 'sparkles',
    group: 'Advanced',
    description: 'transition-group animates every reorder, from a drag or from code.',
    tags: ['transition-group'],
  },
  {
    id: 'nested',
    title: 'Nested tree',
    icon: 'tree',
    group: 'Advanced',
    description: 'A recursive component: drag files and folders anywhere in the tree.',
    tags: ['nested', 'recursive'],
  },
  {
    id: 'multi-select',
    title: 'Multi-select',
    icon: 'check',
    group: 'Advanced',
    description: 'Click to select several items, then drag them together.',
    tags: ['multi-drag'],
  },
  {
    id: 'swap',
    title: 'Swap',
    icon: 'swap',
    group: 'Advanced',
    description: 'Drop an item onto another to swap their places instead of shifting the list.',
    tags: ['swap'],
  },
  {
    id: 'touch',
    title: 'Touch & pointer',
    icon: 'touch',
    group: 'Advanced',
    description: 'Pointer-based dragging for touch screens and custom drag previews.',
    tags: ['force-fallback'],
  },
];

export const exampleGroups = ['Basics', 'Multiple lists', 'Advanced'];

export const sprintTasks = (): Task[] => [
  {
    id: 1,
    title: 'Design the onboarding flow',
    tag: 'Design',
    tone: 'violet',
    assignee: 'Mai Anh',
    points: 5,
  },
  {
    id: 2,
    title: 'Set up the billing webhook',
    tag: 'Backend',
    tone: 'blue',
    assignee: 'Quang Huy',
    points: 3,
  },
  {
    id: 3,
    title: 'Fix the mobile navigation',
    tag: 'Bug',
    tone: 'red',
    assignee: 'Thu Trang',
    points: 2,
  },
  {
    id: 4,
    title: 'Write the release notes',
    tag: 'Docs',
    tone: 'green',
    assignee: 'Minh Duc',
    points: 1,
  },
  {
    id: 5,
    title: 'Load test the API gateway',
    tag: 'Infra',
    tone: 'amber',
    assignee: 'Hoang Nam',
    points: 8,
  },
];

export const boardColumns = (): {
  id: string;
  title: string;
  tone: Task['tone'];
  tasks: Task[];
}[] => [
  {
    id: 'todo',
    title: 'To do',
    tone: 'gray',
    tasks: [
      {
        id: 11,
        title: 'Audit color contrast',
        tag: 'Design',
        tone: 'violet',
        assignee: 'Mai Anh',
        points: 2,
      },
      {
        id: 12,
        title: 'Add search to the docs',
        tag: 'Feature',
        tone: 'blue',
        assignee: 'Quang Huy',
        points: 5,
      },
      {
        id: 13,
        title: 'Rotate API keys',
        tag: 'Security',
        tone: 'red',
        assignee: 'Hoang Nam',
        points: 1,
      },
    ],
  },
  {
    id: 'doing',
    title: 'In progress',
    tone: 'blue',
    tasks: [
      {
        id: 21,
        title: 'Kanban drag and drop',
        tag: 'Feature',
        tone: 'blue',
        assignee: 'Thu Trang',
        points: 8,
      },
      {
        id: 22,
        title: 'Migrate to Nuxt 4',
        tag: 'Infra',
        tone: 'amber',
        assignee: 'Minh Duc',
        points: 5,
      },
    ],
  },
  {
    id: 'done',
    title: 'Done',
    tone: 'green',
    tasks: [
      {
        id: 31,
        title: 'Ship the pricing page',
        tag: 'Release',
        tone: 'green',
        assignee: 'Mai Anh',
        points: 3,
      },
    ],
  },
];

export interface Field {
  id: number;
  type: string;
  label: string;
  icon: string;
}
export const fieldPalette = (): Field[] => [
  { id: 1, type: 'text', label: 'Text input', icon: 'type' },
  { id: 2, type: 'email', label: 'Email', icon: 'user' },
  { id: 3, type: 'image', label: 'Image upload', icon: 'image' },
  { id: 4, type: 'button', label: 'Submit button', icon: 'button' },
];

export interface TreeNode {
  name: string;
  kind: 'folder' | 'file';
  children: TreeNode[];
}
export const projectTree = (): TreeNode[] => [
  {
    name: 'src',
    kind: 'folder',
    children: [
      {
        name: 'components',
        kind: 'folder',
        children: [
          { name: 'Board.vue', kind: 'file', children: [] },
          { name: 'Card.vue', kind: 'file', children: [] },
        ],
      },
      { name: 'main.ts', kind: 'file', children: [] },
    ],
  },
  {
    name: 'public',
    kind: 'folder',
    children: [{ name: 'favicon.svg', kind: 'file', children: [] }],
  },
  { name: 'package.json', kind: 'file', children: [] },
  { name: 'README.md', kind: 'file', children: [] },
];

export const titles = (tasks: { title: string }[]): string => tasks.map((t) => t.title).join(',');
