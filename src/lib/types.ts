export type DisplayMode = "chip" | "cash";

export interface RoomConfig {
  chipsPerHand: number;
  chipValue: number;
  displayMode: DisplayMode;
  createdAt: number;
}

export interface Player {
  id: string;
  name: string;
  hands: number;
  currentChips: number;
  buyInChips: number;
  order: number;
  buyInOverride?: boolean;
}

export interface HistoryEntry {
  id: string;
  message: string;
  timestamp: number;
}

export interface RoomSnapshot {
  config?: RoomConfig;
  players?: Record<string, Player>;
  history?: Record<string, HistoryEntry>;
  updatedAt?: number;
  expiresAt?: number;
}

export interface RoomData {
  id: string;
  config: RoomConfig;
  players: Player[];
  history: HistoryEntry[];
  updatedAt: number;
  expiresAt?: number;
}

export interface PlayerDraft {
  name: string;
}
