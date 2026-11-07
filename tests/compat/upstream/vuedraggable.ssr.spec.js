/**
 * @vitest-environment node
 */
// Ported from vue.draggable.next tests/unit (MIT, see THIRD_PARTY_NOTICES.md), kept as close to
// upstream as possible so it can be diffed. Runs against BOTH vuedraggable@4.1.0 and @stacklogs/vue-draggable.
// Port changes (Jest -> Vitest): @jest-environment -> @vitest-environment; require() -> import (vue/server-renderer instead of @vue/server-renderer)

import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import draggable from "@/vuedraggable";

const app = createSSRApp({
  name: "test-app",
  template: `<draggable :list="items" :item-key="k => k"><template #item="{element}"><div>{{element}}</div></template></draggable>`,
  data: () => ({
    items: ["a", "b", "c"]
  }),
  components: {
    draggable
  }
});

let html;

describe("vuedraggable in a SSR context", () => {
  beforeEach(async () => {
    html = await renderToString(app);
  });

  it("can be rendered", () => {
    const expected =`<div><div data-draggable="true">a</div><div data-draggable="true">b</div><div data-draggable="true">c</div></div>`;
    expect(html).toEqual(expected);
  });
});
