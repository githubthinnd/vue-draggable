<!-- Sidebar navigation, top bar and theme switch shared by both playgrounds. -->
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { exampleGroups, examples } from '../data';

const props = defineProps<{
  active: string;
  framework: 'Vue' | 'Nuxt';
  href: (id: string) => string;
}>();

const theme = ref<'light' | 'dark'>('light');
const apply = (value: 'light' | 'dark'): void => {
  theme.value = value;
  document.documentElement.dataset['theme'] = value;
  try {
    localStorage.setItem('playground-theme', value);
  } catch {
    // storage can be unavailable (private mode)
  }
};
onMounted(() => {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem('playground-theme');
  } catch {
    stored = null;
  }
  apply(
    stored === 'dark' || (!stored && matchMedia('(prefers-color-scheme: dark)').matches)
      ? 'dark'
      : 'light',
  );
});
const current = () => examples.find((e) => e.id === props.active);
</script>

<template>
  <div class="shell">
    <aside class="shell__sidebar">
      <a class="brand" :href="href('sortable')">
        <span class="brand__logo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="3" width="13" height="5" rx="1.6" fill="currentColor" opacity="0.45" />
            <rect x="6" y="10" width="15" height="5" rx="1.6" fill="currentColor" />
            <rect x="3" y="17" width="13" height="4" rx="1.6" fill="currentColor" opacity="0.45" />
          </svg>
        </span>
        <span class="brand__name">vue-draggable</span>
        <span class="brand__badge">{{ framework }}</span>
      </a>
      <nav class="nav">
        <div v-for="group in exampleGroups" :key="group" class="nav__group">
          <p class="nav__label">{{ group }}</p>
          <a
            v-for="example in examples.filter((e) => e.group === group)"
            :key="example.id"
            :href="href(example.id)"
            :class="['nav__link', { 'is-active': example.id === active }]"
          >
            <AppIcon :name="example.icon" :size="16" />
            {{ example.title }}
          </a>
        </div>
      </nav>
      <div class="shell__sidebar-footer">
        <span class="subtle">@stacklogs/vue-draggable</span>
      </div>
    </aside>
    <div class="shell__main">
      <header class="topbar">
        <div class="topbar__crumbs">
          <span class="subtle">Examples</span>
          <span class="subtle">/</span>
          <span>{{ current()?.title ?? 'Playground' }}</span>
        </div>
        <div class="topbar__actions">
          <button
            class="icon-btn"
            :title="`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`"
            @click="apply(theme === 'dark' ? 'light' : 'dark')"
          >
            <AppIcon :name="theme === 'dark' ? 'sun' : 'moon'" :size="16" />
          </button>
          <a
            class="icon-btn"
            href="https://github.com/githubthinnd/vue-draggable"
            target="_blank"
            rel="noopener"
            title="Source code"
          >
            <AppIcon name="github" :size="16" />
          </a>
        </div>
      </header>
      <main class="content">
        <PageHeader
          v-if="current()"
          :title="current()!.title"
          :description="current()!.description"
          :tags="current()!.tags"
        />
        <slot />
      </main>
    </div>
  </div>
</template>

<style>
.shell {
  display: grid;
  grid-template-columns: var(--sidebar-width) minmax(0, 1fr);
  min-height: 100vh;
}
.shell__sidebar {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 18px 14px;
  border-right: 1px solid var(--border);
  background: var(--surface);
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 8px 18px;
  color: var(--text);
  font-weight: 700;
  letter-spacing: -0.01em;
}
.brand__logo {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: linear-gradient(135deg, var(--accent), #8b5cf6);
  color: #fff;
  box-shadow: var(--shadow-sm);
}
.brand__name {
  font-size: 15px;
}
.brand__badge {
  margin-left: auto;
  padding: 1px 7px;
  border: 1px solid var(--border);
  border-radius: 999px;
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 600;
}
.nav {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}
.nav__label {
  margin: 0 0 6px;
  padding: 0 10px;
  color: var(--text-subtle);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.nav__link {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 34px;
  padding: 0 10px;
  border-radius: 8px;
  color: var(--text-muted);
  font-weight: 500;
}
.nav__link:hover {
  background: var(--bg-subtle);
  color: var(--text);
}
.nav__link.is-active {
  background: var(--accent-soft);
  color: var(--accent);
}
.shell__sidebar-footer {
  padding: 12px 10px 0;
  border-top: 1px solid var(--border);
  font-size: 12px;
}
.topbar {
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 32px;
  border-bottom: 1px solid var(--border);
  background: color-mix(in srgb, var(--bg) 82%, transparent);
  backdrop-filter: blur(10px);
}
.topbar__crumbs {
  display: flex;
  gap: 8px;
  font-weight: 500;
}
.topbar__actions {
  display: flex;
  gap: 6px;
}
.icon-btn {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text-muted);
  cursor: pointer;
}
.icon-btn:hover {
  color: var(--text);
}
.content {
  max-width: 1180px;
  padding: 32px;
}
@media (max-width: 860px) {
  .shell {
    grid-template-columns: 1fr;
  }
  .shell__sidebar {
    position: static;
    height: auto;
  }
  .nav {
    flex-direction: row;
    flex-wrap: wrap;
  }
  .content,
  .topbar {
    padding: 16px;
  }
}
</style>
