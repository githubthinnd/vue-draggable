// Ported from vue.draggable.next tests/unit (MIT, see THIRD_PARTY_NOTICES.md), kept as close to
// upstream as possible so it can be diffed. Runs against BOTH vuedraggable@4.1.0 and @vue-draggable/core.
// Port changes (Jest -> Vitest): transition row pinned as upstream crash #188 on 4.1.0 only (see table); jest.mock -> vi.mock; dropped jest.genMockFromModule (no-op); mock implementation is a function (Vitest 4+ cannot `new` an arrow function); jest.fn/resetAllMocks -> vi.*
import { mount, config } from "@vue/test-utils";
config.global.stubs["transition-group"] = false;
import Sortable from "sortablejs";
import { expectHTML } from "./helper/setup"

vi.mock("sortablejs");

const SortableFake = {
  destroy: vi.fn(),
  option: vi.fn()
};
Sortable.mockImplementation(function () {
  return SortableFake;
});

import draggable from "@/vuedraggable";

import { nextTick } from "vue";
import DraggableWithList from "./helper/DraggableWithList";
import DraggableWithComponent from "./helper/DraggableWithComponent.vue";
import DraggableWithModel from "./helper/DraggableWithList";
import DraggableWithTransition from "./helper/DraggableWithTransition";
import fake from "./helper/FakeRoot";

let wrapper;
let element;
let vm;

function getEvent(name) {
  return Sortable.mock.calls[0][1][name];
}

const expectedArray = [0, 1, 3, 4, 5, 6, 7, 2, 8, 9];
const expectedDomWithWrapper = (wrapper, attr = "") =>
  `<${wrapper}${attr}>${expectedArray
    .map((nu) => `<div data-draggable="true">${nu}</div>`)
    .join("")}</${wrapper}>`;

const expectedDomNoTransition = expectedDomWithWrapper("span");
const expectedDomTransition = expectedDomWithWrapper("div");
const expectedDomComponent = expectedDomWithWrapper(
  "div",
  ' class="fake-root" id="my-id"'
);

describe.each([
  ["draggable with list", DraggableWithList, expectedDomNoTransition, "span"],
  ["draggable with model", DraggableWithModel, expectedDomNoTransition, "span"],
  [
    "draggable with list and component as tag",
    DraggableWithComponent,
    expectedDomComponent,
    "div"
  ],
  [
    "draggable with transition",
    DraggableWithTransition,
    expectedDomTransition,
    "div",
    // Port change: with a real TransitionGroup on Vue 3.5 the item vnodes draggable keeps are not
    // the mounted ones (TransitionGroup renders copies), so `mounted` throws upstream's #140 error.
    // This is upstream bug #188/#228, fixed in @vue-draggable/core (docs/compat.md ID-1): there the
    // row runs the normal assertions.
    // eslint-disable-next-line no-undef
    __VD_IMPL__ === "reference"
      ? "Cannot set properties of null (setting '__draggable_context')"
      : undefined
  ]
])(
  "should update list and DOM with component: %s",
  (_, component, expectedDom, expectWrapper, knownUpstreamCrash) => {
    if (knownUpstreamCrash) {
      it("reproduces upstream crash #188/#140 when mounted (Vue 3.5, real TransitionGroup)", () => {
        expect(() =>
          mount(component, { global: { components: { fake } } })
        ).toThrow(knownUpstreamCrash);
      });
      return;
    }
    describe("when handling sort", () => {
      beforeEach(async () => {
        vi.resetAllMocks();
        wrapper = mount(component, {
          global: {
            components: {
              fake
            }
          }
        });
        vm = wrapper.vm;
        element = wrapper.find(expectWrapper).element;

        const item = element.children[2];
        const startEvt = { item };
        getEvent("onStart")(startEvt);
        await nextTick();

        const firstDraggable = element.children[1];
        element.removeChild(item);
        element.insertBefore(item, firstDraggable);
        getEvent("onUpdate")({
          item,
          oldIndex: 2,
          newIndex: 7,
          from: element,
        });
        await nextTick();
      });

      it("sends a change event", async () => {
        const draggableWrapper = wrapper.findComponent(draggable);
        const expectedEvt = { moved: { element: 2, oldIndex: 2, newIndex: 7 } };
        expect(draggableWrapper.emitted().change).toEqual([[expectedEvt]]);
      });

      it("update list", async () => {
        expect(vm.array).toEqual(expectedArray);
      });

      it("updates DOM", async () => {
        expectHTML(wrapper, expectedDom);
      });
    });
  }
);
