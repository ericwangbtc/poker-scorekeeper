import test from "node:test";
import assert from "node:assert/strict";
import { resolveDisplayMode } from "./display-mode.ts";

test("resolveDisplayMode prefers valid local value", () => {
  assert.equal(resolveDisplayMode("cash"), "cash");
  assert.equal(resolveDisplayMode("chip"), "chip");
});

test("resolveDisplayMode falls back to chip for invalid or empty value", () => {
  assert.equal(resolveDisplayMode(""), "chip");
  assert.equal(resolveDisplayMode("CASH"), "chip");
  assert.equal(resolveDisplayMode("unknown"), "chip");
  assert.equal(resolveDisplayMode(null), "chip");
});
