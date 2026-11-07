// Shared by every entry: mounts a list with the given draggable component and reports what happened.
function check(name, draggable, vue) {
  const { createApp, h, ref } = vue;
  const host = document.createElement('div');
  document.body.appendChild(host);
  const report = { name, ok: false };
  try {
    let vm;
    const items = ref(['a', 'b', 'c']);
    createApp({
      render: () =>
        h(
          draggable,
          {
            modelValue: items.value,
            'onUpdate:modelValue': (v) => (items.value = v),
            itemKey: (k) => k,
            ref: (r) => (vm = r),
          },
          { item: ({ element }) => h('div', element) },
        ),
    }).mount(host);
    report.html = host.innerHTML;
    report.sortable = Boolean(vm && vm._sortable && vm._sortable.el === vm.targetDomElement);
    report.ok = report.sortable && report.html.includes('data-draggable');
  } catch (error) {
    report.error = String(error && error.message ? error.message : error);
  }
  (globalThis.__smoke = globalThis.__smoke || []).push(report);
}
module.exports = { check };
