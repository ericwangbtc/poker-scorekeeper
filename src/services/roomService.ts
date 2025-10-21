import {
  get,
  onValue,
  ref,
  remove,
  set,
  Unsubscribe,
  update
} from "firebase/database";
import {
  DAYS_TO_EXPIRE,
  DEFAULT_CHIPS_PER_HAND,
  DEFAULT_CHIP_VALUE,
  MILLISECONDS_IN_DAY
} from "../constants";
import { Player, RoomConfig, RoomSnapshot } from "../types";
import { generatePlayerId, generateRoomId } from "../utils/id";
import { database } from "./firebase";

const ensureDatabase = () => {
  if (!database) {
    throw new Error("Firebase 未配置，请添加必要的环境变量。");
  }
  return database;
};

const buildRoomPath = (roomId: string, path = "") =>
  path ? `rooms/${roomId}/${path}` : `rooms/${roomId}`;

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
        onSnapshot({
          ...value,
          players: value.players || undefined
        });
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

const now = () => Date.now();

export const createDefaultRoomConfig = (): RoomConfig => ({
  chipsPerHand: DEFAULT_CHIPS_PER_HAND,
  chipValue: DEFAULT_CHIP_VALUE,
  displayMode: "chip",
  createdAt: now()
});

const computeInitialPlayer = (config: RoomConfig, name: string): Player => {
  const hands = 1;
  const buyIn = hands * config.chipsPerHand;
  return {
    id: generatePlayerId(),
    name,
    hands,
    currentChips: buyIn,
    buyInChips: buyIn,
    order: now(),
    buyInOverride: false
  };
};

export const createRoom = async (name?: string) => {
  const db = ensureDatabase();
  let attempts = 0;
  const maxAttempts = 10;
  let roomId = "";
  const config = createDefaultRoomConfig();
  const roomPayload = {
    config,
    players: {} as Record<string, Player>,
    updatedAt: config.createdAt,
    expiresAt: config.createdAt + DAYS_TO_EXPIRE * MILLISECONDS_IN_DAY
  };

  if (name && name.trim()) {
    const initialPlayer = computeInitialPlayer(config, name.trim());
    roomPayload.players[initialPlayer.id] = initialPlayer;
  }

  while (attempts < maxAttempts) {
    roomId = generateRoomId();
    const roomRef = ref(db, buildRoomPath(roomId));
    const snapshot = await get(roomRef);
    if (!snapshot.exists()) {
      await set(roomRef, roomPayload);
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
    throw new Error("玩家姓名不能为空");
  }

  const updates: Record<string, unknown> = {
    [buildRoomPath(roomId, `players/${player.id}`)]: player,
    [buildRoomPath(roomId, "updatedAt")]: now()
  };
  await update(ref(db), updates);
};

export const updateRoomConfig = async (
  roomId: string,
  updates: Partial<RoomConfig>
) => {
  const db = ensureDatabase();
  const payload: Record<string, unknown> = {
    [buildRoomPath(roomId, "updatedAt")]: now()
  };

  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      payload[buildRoomPath(roomId, `config/${key}`)] = value;
    }
  });

  await update(ref(db), payload);
};

export const updatePlayer = async (
  roomId: string,
  playerId: string,
  updates: Partial<Player>
) => {
  const db = ensureDatabase();
  const payload: Record<string, unknown> = {
    [buildRoomPath(roomId, "updatedAt")]: now()
  };

  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      payload[buildRoomPath(roomId, `players/${playerId}/${key}`)] = value;
    }
  });

  await update(ref(db), payload);
};

export const deletePlayer = async (roomId: string, playerId: string) => {
  const db = ensureDatabase();
  await remove(ref(db, buildRoomPath(roomId, `players/${playerId}`)));
  await update(ref(db), {
    [buildRoomPath(roomId, "updatedAt")]: now()
  });
};
