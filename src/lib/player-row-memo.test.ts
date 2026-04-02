import test from "node:test";
import assert from "node:assert/strict";
import { arePlayerRowPropsEqual, type PlayerRowMemoProps } from "./player-row-memo.ts";
import type { Player } from "./types";

const noopAsync = async () => {};
const noop = () => {};
const toInputValue = (chips: number) => chips.toString();
const toCellLabel = (chips: number) => chips.toString();
const parseToChips = (value: string) => Number(value);

const makePlayer = (overrides: Partial<Player> = {}): Player => ({
  id: "p1",
  name: "alice",
  hands: 3,
  currentChips: 120,
  buyInChips: 300,
  order: 1,
  buyInOverride: false,
  ...overrides,
});

const makeProps = (overrides: Partial<PlayerRowMemoProps> = {}): PlayerRowMemoProps => ({
  player: makePlayer(),
  config: {
    chipsPerHand: 100,
    chipValue: 0.1,
    displayMode: "chip",
    createdAt: 1,
  },
  displayMode: "chip",
  canEditHands: true,
  toInputValue,
  toCellLabel,
  parseToChips,
  onNameCommit: noopAsync,
  onHandsCommit: noopAsync,
  onHandsAdjust: noopAsync,
  onCurrentCommit: noopAsync,
  onDelete: noop,
  ...overrides,
});

test("arePlayerRowPropsEqual returns true for recreated player object with same values", () => {
  const prev = makeProps();
  const next = makeProps({
    player: makePlayer(),
  });

  assert.equal(arePlayerRowPropsEqual(prev, next), true);
});

test("arePlayerRowPropsEqual returns false when current chips changed", () => {
  const prev = makeProps();
  const next = makeProps({
    player: makePlayer({ currentChips: 121 }),
  });

  assert.equal(arePlayerRowPropsEqual(prev, next), false);
});

test("arePlayerRowPropsEqual returns false when callback reference changed", () => {
  const prev = makeProps();
  const next = makeProps({
    onCurrentCommit: async () => {},
  });

  assert.equal(arePlayerRowPropsEqual(prev, next), false);
});
