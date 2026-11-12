import { DurableObject } from "cloudflare:workers";
import app from "vinext/server/fetch-handler";
import { clientIdSchema, commandSchema, type RoomCommand } from "./commands";
import {
  DAYS_TO_EXPIRE,
  DEFAULT_CHIPS_PER_HAND,
  MILLISECONDS_IN_DAY,
  ROOM_ID_LENGTH,
} from "../src/lib/constants";
import {
  coalesceHandsAdjustedHistory,
  createHistoryEntry,
  createPlayerJoinedHistoryEntry,
} from "../src/lib/history";
import { generatePlayerId } from "../src/lib/id";
import type { Player, RoomData } from "../src/lib/types";

interface Env {
  ROOMS: DurableObjectNamespace<PokerRoom>;
}

type StoredRoom = Omit<RoomData, "isHost"> & {
  hostClientId: string;
  pin: string;
};

const ROOM_KEY = "room";
const HISTORY_LIMIT = 200;
const roomPath = new RegExp(`^/rooms/([A-Z]{${ROOM_ID_LENGTH}})$`);
const missingRoom = "房间不存在或已过期。";
const failure = (error: string, status: number) => Response.json({ error }, { status });

function snapshot(room: StoredRoom, clientId: string): RoomData {
  return {
    id: room.id,
    config: room.config,
    players: room.players,
    history: room.history,
    isHost: room.hostClientId === clientId,
    updatedAt: room.updatedAt,
    expiresAt: room.expiresAt,
  };
}

function addPlayer(room: StoredRoom, name: string, timestamp: number) {
  const player: Player = {
    id: generatePlayerId(),
    name,
    hands: 1,
    currentChips: 0,
    buyInChips: room.config.chipsPerHand,
    order: timestamp,
  };
  room.players.push(player);
  room.history.unshift(createPlayerJoinedHistoryEntry({
    playerId: player.id,
    playerName: name,
    handsTotal: 1,
    timestamp,
  }));
}

export class PokerRoom extends DurableObject<Env> {
  private get room() {
    const room = this.ctx.storage.kv.get<StoredRoom>(ROOM_KEY);
    return room && room.expiresAt > Date.now() ? room : undefined;
  }

  async fetch(request: Request) {
    const roomId = new URL(request.url).pathname.split("/").pop()!;

    if (request.headers.get("Upgrade")?.toLowerCase() === "websocket") {
      const pair = new WebSocketPair();
      this.ctx.acceptWebSocket(pair[1]);
      return new Response(null, { status: 101, webSocket: pair[0] });
    }

    const client = clientIdSchema.safeParse(request.headers.get("X-Client-Id"));
    const command = commandSchema.safeParse(await request.json().catch(() => null));
    if (!client.success || !command.success) {
      return failure("房间请求格式无效。", 400);
    }

    const clientId = client.data;
    const action = command.data;
    const room = this.room;
    if (action.type === "create") {
      if (room) return failure("房间编号已被占用。", 409);
      const now = Date.now();
      const created: StoredRoom = {
        id: roomId,
        config: {
          chipsPerHand: DEFAULT_CHIPS_PER_HAND,
          createdAt: now,
        },
        players: [],
        history: [],
        hostClientId: clientId,
        pin: action.pin,
        updatedAt: now,
        expiresAt: now + DAYS_TO_EXPIRE * MILLISECONDS_IN_DAY,
      };
      if (action.name) addPlayer(created, action.name, now);
      this.ctx.storage.kv.put(ROOM_KEY, created);
      await this.ctx.storage.setAlarm(created.expiresAt);
      return Response.json({ roomId }, { status: 201 });
    }

    if (!room) return failure(missingRoom, 404);

    const isHost = room.hostClientId === clientId;
    if (action.type === "pin") {
      return isHost ? Response.json({ pin: room.pin }) : failure("仅房主可查看 PIN。", 403);
    }
    if (action.type === "hands" && !isHost) {
      return failure("仅房主可修改手数。", 403);
    }

    if (action.type === "claim") {
      if (action.pin !== room.pin) return failure("PIN 不正确。", 403);
      room.hostClientId = clientId;
    } else {
      const error = this.apply(room, action);
      if (error) return error;
    }

    room.updatedAt = Date.now();
    room.history.length = Math.min(room.history.length, HISTORY_LIMIT);
    this.ctx.storage.kv.put(ROOM_KEY, room);
    await this.ctx.storage.sync();
    const latest = this.room;
    if (latest) {
      for (const socket of this.ctx.getWebSockets()) {
        const subscriber = socket.deserializeAttachment() as string | null;
        if (subscriber && socket.readyState === WebSocket.OPEN) {
          this.send(socket, latest, subscriber);
        }
      }
    }
    return Response.json({ ok: true });
  }

  private apply(room: StoredRoom, action: Exclude<RoomCommand, { type: "create" | "claim" | "pin" }>) {
    if (action.type === "add") {
      addPlayer(room, action.name, Date.now());
      return;
    }
    if (action.type === "settings") {
      room.config.chipsPerHand = action.chipsPerHand;
      for (const player of room.players) {
        const buyIn = player.hands * action.chipsPerHand;
        if (!Number.isFinite(buyIn)) return failure("买入筹码超出范围。", 400);
        player.buyInChips = buyIn;
      }
      return;
    }

    const index = room.players.findIndex(({ id }) => id === action.playerId);
    const player = room.players[index];
    if (!player) return failure("玩家不存在。", 404);

    switch (action.type) {
      case "delete":
        room.players.splice(index, 1);
        room.history.unshift(createHistoryEntry({
          type: "player_left",
          actorId: player.id,
          actorName: player.name,
        }));
        break;
      case "chips":
        if (action.chips === player.currentChips) break;
        room.history.unshift(createHistoryEntry({
          type: "chips_changed",
          actorId: player.id,
          actorName: player.name,
          previousChips: player.currentChips,
          currentChips: action.chips,
        }));
        player.currentChips = action.chips;
        break;
      case "hands": {
        const hands = "total" in action.change
          ? action.change.total
          : player.hands + action.change.delta;
        const buyIn = hands * room.config.chipsPerHand;
        if (!Number.isSafeInteger(hands) || !Number.isFinite(buyIn)) {
          return failure("手数或买入筹码超出范围。", 400);
        }
        if (hands === player.hands) break;
        const entry = createHistoryEntry({
          type: "hands_adjusted",
          actorId: player.id,
          actorName: player.name,
          handsDelta: hands - player.hands,
          handsTotal: hands,
        });
        const merged = coalesceHandsAdjustedHistory(room.history[0], entry);
        if (merged) room.history[0] = merged;
        else room.history.unshift(entry);
        player.hands = hands;
        player.buyInChips = buyIn;
        break;
      }
    }
  }

  private send(socket: WebSocket, room: StoredRoom | undefined, clientId: string) {
    try {
      socket.send(JSON.stringify(room ? snapshot(room, clientId) : null));
      if (!room) socket.close(1000, "Room unavailable");
    } catch {
      socket.close(1011, "Snapshot unavailable");
    }
  }

  webSocketMessage(socket: WebSocket, message: string | ArrayBuffer) {
    const client = clientIdSchema.safeParse(message);
    if (!client.success || socket.deserializeAttachment()) {
      socket.close(1008, "Invalid subscription");
      return;
    }
    socket.serializeAttachment(client.data);
    this.send(socket, this.room, client.data);
  }

  webSocketClose(socket: WebSocket) {
    if (socket.readyState === WebSocket.CLOSING) socket.close();
  }

  async alarm() {
    const room = this.room;
    if (room) {
      await this.ctx.storage.setAlarm(room.expiresAt);
      return;
    }
    await this.ctx.storage.deleteAll();
    for (const socket of this.ctx.getWebSockets()) {
      if (socket.readyState === WebSocket.OPEN) this.send(socket, undefined, "");
    }
  }
}

export default {
  async fetch(request, env, ctx) {
    const pathname = new URL(request.url).pathname;
    if (!pathname.startsWith("/rooms/")) return app.fetch(request, env, ctx);

    const match = roomPath.exec(pathname);
    if (!match) return failure("房间地址无效。", 404);

    const websocket = request.method === "GET" &&
      request.headers.get("Upgrade")?.toLowerCase() === "websocket";
    if (!websocket && request.method !== "POST") {
      return new Response(null, { status: 405, headers: { Allow: "GET, POST" } });
    }

    try {
      return await env.ROOMS.getByName(match[1]).fetch(request);
    } catch (error) {
      console.error(error);
      return failure("房间服务暂时不可用。", 503);
    }
  },
} satisfies ExportedHandler<Env>;
