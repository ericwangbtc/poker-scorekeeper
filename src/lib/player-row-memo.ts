import type { Player, RoomConfig } from "./types";

export interface PlayerRowMemoProps {
  player: Player;
  config: RoomConfig;
  canEditHands: boolean;
  toInputValue: (chips: number) => string;
  toCellLabel: (chips: number) => string;
  parseToChips: (value: string) => number | null;
  onPlayerHistory: (player: Player, trigger: HTMLButtonElement) => void;
  onHandsCommit: (player: Player, hands: number) => Promise<void>;
  onHandsAdjust: (player: Player, delta: number) => Promise<void>;
  onCurrentCommit: (player: Player, chips: number) => Promise<void>;
  onDelete: (player: Player, trigger: HTMLButtonElement) => void;
}

export const arePlayerRowPropsEqual = (
  prev: PlayerRowMemoProps,
  next: PlayerRowMemoProps
) =>
  prev.player.id === next.player.id &&
  prev.player.name === next.player.name &&
  prev.player.hands === next.player.hands &&
  prev.player.currentChips === next.player.currentChips &&
  prev.player.buyInChips === next.player.buyInChips &&
  prev.player.buyInOverride === next.player.buyInOverride &&
  prev.player.order === next.player.order &&
  prev.config.chipsPerHand === next.config.chipsPerHand &&
  prev.canEditHands === next.canEditHands &&
  prev.toInputValue === next.toInputValue &&
  prev.toCellLabel === next.toCellLabel &&
  prev.parseToChips === next.parseToChips &&
  prev.onPlayerHistory === next.onPlayerHistory &&
  prev.onHandsCommit === next.onHandsCommit &&
  prev.onHandsAdjust === next.onHandsAdjust &&
  prev.onCurrentCommit === next.onCurrentCommit &&
  prev.onDelete === next.onDelete;
