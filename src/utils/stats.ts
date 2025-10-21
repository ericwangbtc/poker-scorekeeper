import { Player } from "../types";

export const calculateTotals = (players: Player[]) => {
  const totals = players.reduce(
    (acc, player) => {
      acc.buyIn += player.buyInChips;
      acc.current += player.currentChips;
      return acc;
    },
    { buyIn: 0, current: 0 }
  );

  const delta = totals.current - totals.buyIn;

  return {
    totalBuyIn: totals.buyIn,
    totalCurrent: totals.current,
    delta,
    isBalanced: delta === 0
  };
};
