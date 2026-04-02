import {
  limitToLast,
  onValue,
  orderByChild,
  query,
  ref,
  runTransaction,
  Unsubscribe,
  update,
} from "firebase/database";
import {
  DAYS_TO_EXPIRE,
  DEFAULT_CHIPS_PER_HAND,
  DEFAULT_CHIP_VALUE,
  MILLISECONDS_IN_DAY,
} from "./constants";
import { HistoryEntry, Player, RoomConfig, RoomSnapshot } from "./types";
import { generatePlayerId, generateRoomId } from "./id";
import { createHistoryEntry, createPlayerJoinedHistoryEntry } from "./history";
import { database } from "./firebase";
import { buildHistoryPath, buildRoomPath } from "./room-paths";

const ensureDatabase = () => {
  if (!database) {
    throw new Error("Firebase 未配置，请添加必要的环境变量。");
  }
  return database;
};

const DEFAULT_HISTORY_LIMIT = 200;

export const subscribeToRoom = (
  roomId: string,
  onSnapshot: (room: RoomSnapshot | null) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const db = ensureDatabase();
  const roomRef = ref(db, buildRoomPath(roomId));
  return onValue(
    roomRef,
    (snapshot) => {
      const value = snapshot.val() as RoomSnapshot | null;
      if (value) {
        onSnapshot(value);
      } else {
        onSnapshot(null);
      }
    },
    (error) => {
      if (onError) {
        onError(error);
      } else {
        console.error(error);
      }
    }
  );
};

export const subscribeToRoomHistory = (
  roomId: string,
  onSnapshot: (entries: HistoryEntry[]) => void,
  onError?: (error: Error) => void,
  limit = DEFAULT_HISTORY_LIMIT
): Unsubscribe => {
  const db = ensureDatabase();
  const historyRef = query(
    ref(db, buildRoomPath(roomId, "history")),
    orderByChild("timestamp"),
    limitToLast(limit)
  );

  return onValue(
    historyRef,
    (snapshot) => {
      const value = snapshot.val() as Record<string, HistoryEntry> | null;
      if (!value) {
        onSnapshot([]);
        return;
      }
      const entries = Object.values(value).sort(
        (a, b) => b.timestamp - a.timestamp || b.id.localeCompare(a.id)
      );
      onSnapshot(entries);
    },
    (error) => {
      if (onError) {
        onError(error);
      } else {
        console.error(error);
      }
    }
  );
};

const now = () => Date.now();

export const createDefaultRoomConfig = (): RoomConfig => ({
  chipsPerHand: DEFAULT_CHIPS_PER_HAND,
  chipValue: DEFAULT_CHIP_VALUE,
  createdAt: now(),
});

const computeInitialPlayer = (config: RoomConfig, name: string): Player => {
  const hands = 1;
  const buyIn = hands * config.chipsPerHand;
  return {
    id: generatePlayerId(),
    name,
    hands,
    currentChips: 0,
    buyInChips: buyIn,
    order: now(),
    buyInOverride: false,
  };
};

export const createRoom = async (
  name?: string,
  options?: { hostClientId?: string; hostPin?: string }
) => {
  const db = ensureDatabase();
  let attempts = 0;
  const maxAttempts = 10;
  let roomId = "";
  const config = createDefaultRoomConfig();
  const players: Record<string, Player> = {};
  let initialHistoryEntry: HistoryEntry | undefined;

  if (name && name.trim()) {
    const initialPlayer = computeInitialPlayer(config, name.trim());
    players[initialPlayer.id] = initialPlayer;
    initialHistoryEntry = createPlayerJoinedHistoryEntry({
      playerId: initialPlayer.id,
      playerName: initialPlayer.name,
      handsTotal: initialPlayer.hands,
      timestamp: config.createdAt,
    });
  }

  const roomPayload: {
    config: RoomConfig;
    players: Record<string, Player>;
    hostClientId: string;
    hostPin: string;
    updatedAt: number;
    expiresAt: number;
  } = {
    config,
    players,
    hostClientId: options?.hostClientId ?? "",
    hostPin: options?.hostPin ?? "",
    updatedAt: config.createdAt,
    expiresAt: config.createdAt + DAYS_TO_EXPIRE * MILLISECONDS_IN_DAY,
  };

  while (attempts < maxAttempts) {
    roomId = generateRoomId();
    const roomRef = ref(db, buildRoomPath(roomId));
    const result = await runTransaction(
      roomRef,
      (current) => (current === null ? roomPayload : undefined),
      { applyLocally: false }
    );
    if (result.committed) {
      if (initialHistoryEntry) {
        await update(ref(db), {
          [buildHistoryPath(roomId, initialHistoryEntry.id)]: initialHistoryEntry,
        });
      }
      return roomId;
    }
    attempts += 1;
  }

  throw new Error("创建房间失败，请稍后再试。");
};

export const addPlayer = async (
  roomId: string,
  config: RoomConfig,
  name: string
) => {
  const db = ensureDatabase();
  const trimmed = name.trim();
  const player =
    trimmed.length > 0 ? computeInitialPlayer(config, trimmed) : undefined;
  if (!player) {
    throw new Error("玩家不能为空");
  }

  const updates: Record<string, unknown> = {
    [buildRoomPath(roomId, `players/${player.id}`)]: player,
    [buildRoomPath(roomId, "updatedAt")]: now(),
  };
  const historyEntry = createPlayerJoinedHistoryEntry({
    playerId: player.id,
    playerName: player.name,
    handsTotal: player.hands,
  });
  updates[buildHistoryPath(roomId, historyEntry.id)] = historyEntry;
  await update(ref(db), updates);
};

export const saveRoomSettings = async (
  roomId: string,
  values: { chipsPerHand: number; chipValue: number },
  players: Player[],
  previousChipsPerHand: number
) => {
  const db = ensureDatabase();
  const payload: Record<string, unknown> = {
    [buildRoomPath(roomId, "updatedAt")]: now(),
    [buildRoomPath(roomId, "config/chipsPerHand")]: values.chipsPerHand,
    [buildRoomPath(roomId, "config/chipValue")]: values.chipValue,
  };

  if (values.chipsPerHand !== previousChipsPerHand) {
    players
      .filter((player) => !player.buyInOverride)
      .forEach((player) => {
        payload[buildRoomPath(roomId, `players/${player.id}/buyInChips`)] =
          player.hands * values.chipsPerHand;
      });
  }

  await update(ref(db), payload);
};

export const updatePlayer = async (
  roomId: string,
  playerId: string,
  updates: Partial<Player>,
  historyEntry?: HistoryEntry
) => {
  const db = ensureDatabase();
  const payload: Record<string, unknown> = {
    [buildRoomPath(roomId, "updatedAt")]: now(),
  };

  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      payload[buildRoomPath(roomId, `players/${playerId}/${key}`)] = value;
    }
  });

  if (historyEntry) {
    payload[buildHistoryPath(roomId, historyEntry.id)] = historyEntry;
  }

  await update(ref(db), payload);
};

export const deletePlayer = async (
  roomId: string,
  playerId: string,
  playerName: string
) => {
  const db = ensureDatabase();
  const historyEntry = createHistoryEntry({
    type: "player_left",
    actorId: playerId,
    actorName: playerName,
  });
  await update(ref(db), {
    [buildRoomPath(roomId, `players/${playerId}`)]: null,
    [buildRoomPath(roomId, "updatedAt")]: now(),
    [buildHistoryPath(roomId, historyEntry.id)]: historyEntry,
  });
};

export const claimRoomHost = async (roomId: string, hostClientId: string) => {
  const db = ensureDatabase();
  await update(ref(db), {
    [buildRoomPath(roomId, "hostClientId")]: hostClientId,
    [buildRoomPath(roomId, "updatedAt")]: now(),
  });
};
