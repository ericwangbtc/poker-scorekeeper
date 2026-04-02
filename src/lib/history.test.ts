import test from "node:test";
import assert from "node:assert/strict";
import {
  coalesceHandsAdjustedHistory,
  createPlayerJoinedHistoryEntry,
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

test("describeHistoryEntry formats player joined with current hands and +1", () => {
  const described = describeHistoryEntry(
    makeEntry({
      type: "player_joined",
      actorName: "eruu",
      handsTotal: 2,
    })
  );

  assert.equal(described.title, "eruu");
  assert.equal(described.subtitle, "加入了房间（当前 2 手）");
  assert.equal(described.value, "+1");
  assert.equal(described.tone, "positive");
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

test("coalesceHandsAdjustedHistory merges same player entries within 10 seconds", () => {
  const previous = makeEntry({
    id: "history_prev",
    timestamp: Date.UTC(2026, 2, 18, 10, 0, 0),
    type: "hands_adjusted",
    actorId: "p1",
    actorName: "小王",
    handsDelta: 1,
    handsTotal: 3,
  });
  const incoming = makeEntry({
    id: "history_next",
    timestamp: Date.UTC(2026, 2, 18, 10, 0, 9),
    type: "hands_adjusted",
    actorId: "p1",
    actorName: "小王",
    handsDelta: 2,
    handsTotal: 5,
  });

  const merged = coalesceHandsAdjustedHistory(previous, incoming, 10_000);

  assert.equal(merged?.id, "history_prev");
  assert.equal(merged?.handsDelta, 3);
  assert.equal(merged?.handsTotal, 5);
  assert.equal(merged?.timestamp, incoming.timestamp);
});

test("coalesceHandsAdjustedHistory does not merge when time gap exceeds 10 seconds", () => {
  const previous = makeEntry({
    id: "history_prev",
    timestamp: Date.UTC(2026, 2, 18, 10, 0, 0),
    type: "hands_adjusted",
    actorId: "p1",
    actorName: "小王",
    handsDelta: 1,
    handsTotal: 3,
  });
  const incoming = makeEntry({
    id: "history_next",
    timestamp: Date.UTC(2026, 2, 18, 10, 0, 11),
    type: "hands_adjusted",
    actorId: "p1",
    actorName: "小王",
    handsDelta: 2,
    handsTotal: 5,
  });

  const merged = coalesceHandsAdjustedHistory(previous, incoming, 10_000);

  assert.equal(merged, null);
});

test("coalesceHandsAdjustedHistory does not merge different players", () => {
  const previous = makeEntry({
    id: "history_prev",
    timestamp: Date.UTC(2026, 2, 18, 10, 0, 0),
    type: "hands_adjusted",
    actorId: "p1",
    actorName: "小王",
    handsDelta: 1,
    handsTotal: 3,
  });
  const incoming = makeEntry({
    id: "history_next",
    timestamp: Date.UTC(2026, 2, 18, 10, 0, 4),
    type: "hands_adjusted",
    actorId: "p2",
    actorName: "小李",
    handsDelta: 2,
    handsTotal: 7,
  });

  const merged = coalesceHandsAdjustedHistory(previous, incoming, 10_000);

  assert.equal(merged, null);
});

test("createPlayerJoinedHistoryEntry stores current hands total", () => {
  const entry = createPlayerJoinedHistoryEntry({
    playerId: "player_1",
    playerName: "eee",
    handsTotal: 1,
    timestamp: Date.UTC(2026, 2, 18, 10, 0, 0),
  });

  assert.equal(entry.type, "player_joined");
  assert.equal(entry.actorId, "player_1");
  assert.equal(entry.actorName, "eee");
  assert.equal(entry.handsTotal, 1);
});
