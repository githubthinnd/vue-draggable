<script setup lang="ts">
import { reactive, toRef } from 'vue';
import { useDraggableHistory } from '@stacklogs/vue-draggable/history';
import { boardColumns, titles } from '../data';

const columns = reactive(boardColumns());
// One undo step per drop, even when a card moves between two columns.
const history = useDraggableHistory(
  columns.map((column) => toRef(column, 'tasks')),
  { keyboard: true },
);
</script>

<template>
  <DemoLayout>
    <div class="board-toolbar"><HistoryToolbar :history="history" /></div>
    <div class="board">
      <section v-for="column in columns" :key="column.id" class="board-column">
        <header class="board-column__header">
          <span :class="['dot', `dot-${column.tone}`]" />
          <span class="board-column__title">{{ column.title }}</span>
          <span class="pill pill-gray">{{ column.tasks.length }}</span>
        </header>
        <Draggable
          v-model="column.tasks"
          item-key="id"
          group="board"
          class="list board-column__list"
          :data-testid="`col-${column.id}`"
          ghost-class="ghost"
          chosen-class="chosen"
          drag-class="dragging"
          :animation="200"
        >
          <template #item="{ element }">
            <article class="item board-card">
              <div class="board-card__top">
                <span :class="['pill', `pill-${element.tone}`]">{{ element.tag }}</span>
                <span class="points">{{ element.points }}</span>
              </div>
              <p class="board-card__title">{{ element.title }}</p>
              <div class="board-card__bottom">
                <AppAvatar :name="element.assignee" />
                <span class="subtle">{{ element.assignee }}</span>
              </div>
            </article>
          </template>
        </Draggable>
      </section>
    </div>
    <template #side>
      <StatePanel
        label="Columns"
        :value="Object.fromEntries(columns.map((c) => [c.id, c.tasks.map((t) => t.title)]))"
        :summary="columns.map((c) => titles(c.tasks)).join('|')"
      />
    </template>
  </DemoLayout>
</template>

<style>
.board-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}
.board {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}
.board-column {
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--bg-subtle);
}
.board-column__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-weight: 600;
}
.board-column__title {
  flex: 1;
}
.board-column__list {
  min-height: 220px;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.dot-gray {
  background: var(--text-subtle);
}
.dot-blue {
  background: var(--blue);
}
.dot-green {
  background: var(--green);
}
.board-card {
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  padding: 12px;
}
.board-card__top,
.board-card__bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.board-card__bottom {
  justify-content: flex-start;
  font-size: 12px;
}
.board-card__title {
  margin: 0;
  font-weight: 500;
}
@media (max-width: 760px) {
  .board {
    grid-template-columns: 1fr;
  }
}
</style>
