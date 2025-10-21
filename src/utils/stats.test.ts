import { Player } from "../types";
import { calculateTotals } from "./stats";

describe("calculateTotals", () => {
  it("aggregates totals and delta correctly", () => {
    const players: Player[] = [
      {
        id: "p1",
        name: "张三",
        hands: 2,
        currentChips: 1200,
        buyInChips: 1000,
        order: 1,
        buyInOverride: false
      },
      {
        id: "p2",
        name: "李四",
        hands: 1,
        currentChips: 300,
        buyInChips: 500,
        order: 2,
        buyInOverride: false
      }
    ];

    const totals = calculateTotals(players);
    expect(totals.totalBuyIn).toBe(1500);
    expect(totals.totalCurrent).toBe(1500);
    expect(totals.delta).toBe(0);
    expect(totals.isBalanced).toBe(true);
  });

  it("detects imbalance when totals differ", () => {
    const players: Player[] = [
      {
        id: "p1",
        name: "张三",
        hands: 1,
        currentChips: 800,
        buyInChips: 500,
        order: 1,
        buyInOverride: false
      },
      {
        id: "p2",
        name: "李四",
        hands: 1,
        currentChips: 400,
        buyInChips: 500,
        order: 2,
        buyInOverride: false
      }
    ];

    const totals = calculateTotals(players);
    expect(totals.totalBuyIn).toBe(1000);
    expect(totals.totalCurrent).toBe(1200);
    expect(totals.delta).toBe(200);
    expect(totals.isBalanced).toBe(false);
  });
});
