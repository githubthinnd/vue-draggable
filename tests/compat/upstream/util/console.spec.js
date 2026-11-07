// Ported from vue.draggable.next tests/unit (MIT, see THIRD_PARTY_NOTICES.md), kept as close to
// upstream as possible so it can be diffed. Runs against BOTH vuedraggable@4.1.0 and @vue-draggable/core.
// Port changes (Jest -> Vitest): none
import { console } from "@/util/console";

describe("console", () => {
  test.each([
    ["log"],
    ["warn"],
    ["error"],
    ["info"],
  ])(
    "has %s function",
    (key) =>{
      const actual = console[key];
      expect(typeof actual).toEqual("function");
    }
  )
});