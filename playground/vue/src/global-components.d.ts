// Types for the components registered globally in main.ts.
import type draggable from '@stacklogs/vue-draggable';
import type AppAvatar from '@shared/components/AppAvatar.vue';
import type AppIcon from '@shared/components/AppIcon.vue';
import type AppShell from '@shared/components/AppShell.vue';
import type DemoCard from '@shared/components/DemoCard.vue';
import type DemoLayout from '@shared/components/DemoLayout.vue';
import type HistoryToolbar from '@shared/components/HistoryToolbar.vue';
import type PageHeader from '@shared/components/PageHeader.vue';
import type StatePanel from '@shared/components/StatePanel.vue';
import type TaskCard from '@shared/components/TaskCard.vue';
import type TreeList from '@shared/examples/TreeList.vue';

declare module 'vue' {
  export interface GlobalComponents {
    Draggable: typeof draggable;
    AppAvatar: typeof AppAvatar;
    AppIcon: typeof AppIcon;
    AppShell: typeof AppShell;
    DemoCard: typeof DemoCard;
    DemoLayout: typeof DemoLayout;
    HistoryToolbar: typeof HistoryToolbar;
    PageHeader: typeof PageHeader;
    StatePanel: typeof StatePanel;
    TaskCard: typeof TaskCard;
    TreeList: typeof TreeList;
  }
}
export {};
