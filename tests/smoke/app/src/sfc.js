import { createApp } from 'vue';
import App from './App.vue';

const host = document.createElement('div');
document.body.appendChild(host);
const report = { name: 'SFC <script setup> + transition-group (Vite)', ok: false };
try {
  createApp(App).mount(host);
  report.html = host.innerHTML;
  report.sortable = Boolean(globalThis.__sfc && globalThis.__sfc.sortable);
  report.ok = report.sortable && report.html.includes('data-draggable');
} catch (error) {
  report.error = String(error && error.message ? error.message : error);
}
(globalThis.__smoke = globalThis.__smoke || []).push(report);
