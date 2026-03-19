import test from "node:test";
import assert from "node:assert/strict";
import { buildHistoryPath, buildRoomPath } from "./room-paths.ts";

test("buildHistoryPath stores history under the room subtree", () => {
  const path = buildHistoryPath("abc123", "event_1");

  assert.equal(path, "rooms/abc123/history/event_1");
  assert.equal(path.startsWith(buildRoomPath("abc123")), true);
  assert.equal(path.includes("roomHistory"), false);
});
