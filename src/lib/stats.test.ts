import test from "node:test";
import assert from "node:assert/strict";
import { calculateTotals } from "./stats.ts";
import type { Player } from "./types";

const makePlayer = (overrides: Partial<Player>): Player => ({
  id: "player_test",
  name: "test",
  hands: 1,
  currentChips: 0,
  buyInChips: 100,
  order: 1,
  buyInOverride: false,
  ...overrides,
});

test("calculateTotals uses derived buy-in when override is false", () => {
  const players: Player[] = [
    makePlayer({ id: "a", hands: 2, currentChips: 150, buyInChips: 999 }),
    makePlayer({ id: "b", hands: 1, currentChips: 50, buyInChips: 999 }),
  ];

  const totals = calculateTotals(players, 100);

  assert.equal(totals.totalBuyIn, 300);
  assert.equal(totals.totalCurrent, 200);
  assert.equal(totals.delta, -100);
  assert.equal(totals.isBalanced, false);
});

test("calculateTotals respects overridden buy-in", () => {
  const players: Player[] = [
    makePlayer({
      id: "a",
      hands: 10,
      buyInChips: 350,
      buyInOverride: true,
      currentChips: 350,
    }),
  ];

  const totals = calculateTotals(players, 100);

  assert.equal(totals.totalBuyIn, 350);
  assert.equal(totals.totalCurrent, 350);
  assert.equal(totals.delta, 0);
  assert.equal(totals.isBalanced, true);
});
