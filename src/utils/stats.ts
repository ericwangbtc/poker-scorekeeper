import { Player } from "../types";

const isNearlyZero = (value: number) => Math.abs(value) < 0.0001;

export const calculateTotals = (players: Player[], chipsPerHand: number) => {
  const totals = players.reduce(
    (acc, player) => {
      const buyIn = player.buyInOverride
        ? player.buyInChips
        : player.hands * chipsPerHand;
      acc.buyIn += buyIn;
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
    isBalanced: isNearlyZero(delta)
  };
};
