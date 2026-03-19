import test from "node:test";
import assert from "node:assert/strict";
import { preventDialogInputAutoFocus } from "./dialog-focus.ts";

test("preventDialogInputAutoFocus prevents default open autofocus", () => {
  let prevented = false;

  preventDialogInputAutoFocus({
    preventDefault() {
      prevented = true;
    },
  });

  assert.equal(prevented, true);
});
