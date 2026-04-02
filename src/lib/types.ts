export type DisplayMode = "chip" | "cash";

export interface RoomConfig {
  chipsPerHand: number;
  chipValue: number;
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

export type HistoryEventType =
  | "player_joined"
  | "player_left"
  | "hands_adjusted";

export interface HistoryEntry {
  id: string;
  timestamp: number;
  type: HistoryEventType;
  actorId?: string;
  actorName: string;
  handsDelta?: number;
  handsTotal?: number;
}

export interface RoomSnapshot {
  config?: RoomConfig;
  players?: Record<string, Player>;
  hostClientId?: string;
  hostPin?: string;
  updatedAt?: number;
  expiresAt?: number;
}

export interface RoomData {
  id: string;
  config: RoomConfig;
  players: Player[];
  history: HistoryEntry[];
  hostClientId: string;
  hostPin: string;
  updatedAt: number;
  expiresAt?: number;
}

export interface PlayerDraft {
  name: string;
}
