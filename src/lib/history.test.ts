import test from "node:test";
import assert from "node:assert/strict";
import {
  describeHistoryEntry,
  groupHistoryEntries,
  formatRelativeTime,
} from "./history.ts";
import type { HistoryEntry } from "./types";

const makeEntry = (overrides: Partial<HistoryEntry>): HistoryEntry => ({
  id: "history_test",
  timestamp: Date.UTC(2026, 2, 18, 10, 0, 0),
  type: "player_joined",
  actorName: "小王",
  ...overrides,
});

test("describeHistoryEntry formats hands adjustment with value", () => {
  const described = describeHistoryEntry(
    makeEntry({
      type: "hands_adjusted",
      actorName: "小李",
      handsDelta: -3,
      handsTotal: 8,
    })
  );

  assert.equal(described.title, "小李");
  assert.equal(described.subtitle, "减少手数（当前 8 手）");
  assert.equal(described.value, "-3");
  assert.equal(described.tone, "negative");
});

test("groupHistoryEntries groups by local day and keeps desc order", () => {
  const entries: HistoryEntry[] = [
    makeEntry({ id: "1", timestamp: Date.UTC(2026, 2, 18, 10, 0, 0) }),
    makeEntry({ id: "2", timestamp: Date.UTC(2026, 2, 17, 23, 0, 0) }),
    makeEntry({ id: "3", timestamp: Date.UTC(2026, 2, 18, 9, 0, 0) }),
  ];

  const grouped = groupHistoryEntries(entries, {
    now: Date.UTC(2026, 2, 18, 10, 5, 0),
    locale: "zh-CN",
    timeZone: "UTC",
  });

  assert.equal(grouped.length, 2);
  assert.equal(grouped[0].items[0].entry.id, "1");
  assert.equal(grouped[0].items[1].entry.id, "3");
  assert.equal(grouped[1].items[0].entry.id, "2");
});

test("formatRelativeTime returns absolute date for older events", () => {
  const text = formatRelativeTime(Date.UTC(2026, 0, 2, 10, 0, 0), {
    now: Date.UTC(2026, 2, 18, 10, 0, 0),
    locale: "zh-CN",
    timeZone: "UTC",
  });

  assert.match(text, /2026/);
});
