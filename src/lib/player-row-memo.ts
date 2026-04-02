import type { DisplayMode, Player, RoomConfig } from "./types";

export interface PlayerRowMemoProps {
  player: Player;
  config: RoomConfig;
  displayMode: DisplayMode;
  canEditHands: boolean;
  toInputValue: (chips: number) => string;
  toCellLabel: (chips: number) => string;
  parseToChips: (value: string) => number | null;
  onNameCommit: (player: Player, name: string) => Promise<void>;
  onHandsCommit: (player: Player, hands: number) => Promise<void>;
  onHandsAdjust: (player: Player, delta: number) => Promise<void>;
  onCurrentCommit: (player: Player, chips: number) => Promise<void>;
  onDelete: (player: Player) => void;
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
  prev.config.chipValue === next.config.chipValue &&
  prev.displayMode === next.displayMode &&
  prev.canEditHands === next.canEditHands &&
  prev.toInputValue === next.toInputValue &&
  prev.toCellLabel === next.toCellLabel &&
  prev.parseToChips === next.parseToChips &&
  prev.onNameCommit === next.onNameCommit &&
  prev.onHandsCommit === next.onHandsCommit &&
  prev.onHandsAdjust === next.onHandsAdjust &&
  prev.onCurrentCommit === next.onCurrentCommit &&
  prev.onDelete === next.onDelete;
