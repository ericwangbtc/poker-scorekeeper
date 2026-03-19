import test from "node:test";
import assert from "node:assert/strict";
import {
  SHEET_BOTTOM_CONTENT_CLASS,
  SHEET_BOTTOM_HANDLE_CLASS,
  SHEET_CLOSE_BUTTON_CLASS,
  SHEET_FOOTER_CLASS,
  HISTORY_GROUP_HEADER_CLASS,
  HISTORY_TIME_LABEL_CLASS,
} from "./sheet-ui.ts";

test("history time label uses larger readable text size", () => {
  assert.match(HISTORY_TIME_LABEL_CLASS, /text-xs/);
  assert.doesNotMatch(HISTORY_TIME_LABEL_CLASS, /text-\[10px\]/);
});

test("history group header supports sticky behavior", () => {
  assert.match(HISTORY_GROUP_HEADER_CLASS, /sticky/);
  assert.match(HISTORY_GROUP_HEADER_CLASS, /top-0/);
});

test("bottom sheet content reserves safe area and touch affordance", () => {
  assert.match(SHEET_BOTTOM_CONTENT_CLASS, /safe-area-bottom/);
  assert.match(SHEET_BOTTOM_HANDLE_CLASS, /h-1\.5/);
});

test("sheet actions use consistent spacing and larger tap targets", () => {
  assert.match(SHEET_FOOTER_CLASS, /gap-3/);
  assert.match(SHEET_CLOSE_BUTTON_CLASS, /h-9/);
  assert.match(SHEET_CLOSE_BUTTON_CLASS, /w-9/);
});
