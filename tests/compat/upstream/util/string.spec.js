// Ported from vue.draggable.next tests/unit (MIT, see THIRD_PARTY_NOTICES.md), kept as close to
// upstream as possible so it can be diffed. Runs against BOTH vuedraggable@4.1.0 and @vue-draggable/core.
// Port changes (Jest -> Vitest): none
import { camelize } from "@/util/string";

describe("camelize", () => {
  test.each([
    ["MyProp", "MyProp"],
    ["MyProp", "MyProp"],
    ["kebab-case", "kebabCase"],
    ["multi-hyphen-string", "multiHyphenString"],
    ["drag-class", "dragClass"],
    ["test-", "test-"]
  ])(
    "transform %s into %s",
    (value, expected) =>{
      const actual = camelize(value);
      expect(actual).toEqual(expected);
    }
  )
});