import type { RoomCommand } from "../../worker/commands";
import { getOrCreateClientId } from "./host-access.ts";
import { generateRoomId } from "./id.ts";
import type { RoomData } from "./types";

const connectionError = "无法连接房间服务，正在重试。";

function roomUrl(roomId: string) {
  return new URL(`/rooms/${encodeURIComponent(roomId)}`, window.location.origin);
}

async function request<T>(roomId: string, command: RoomCommand) {
  const response = await fetch(roomUrl(roomId), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Client-Id": getOrCreateClientId(),
    },
    body: JSON.stringify(command),
  });
  const data = await response.json();
  return { response, data: data as T & { error?: string } };
}

export async function sendRoomCommand<T = { ok: true }>(
  roomId: string,
  command: Exclude<RoomCommand, { type: "create" }>
): Promise<T> {
  const { response, data } = await request<T>(roomId, command);
  if (!response.ok) throw new Error(data.error ?? "房间操作失败，请稍后再试。");
  return data;
}

export async function createRoom(name: string | undefined, pin: string) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const { response, data } = await request<{ roomId: string }>(generateRoomId(), {
      type: "create",
      name,
      pin,
    });
    if (response.ok) return data.roomId;
    if (response.status !== 409) throw new Error(data.error ?? "创建房间失败。");
  }
  throw new Error("创建房间失败，请稍后再试。");
}

export function subscribeToRoom(
  roomId: string,
  onSnapshot: (room: RoomData | null) => void,
  onError: (error: Error) => void
) {
  let url: URL;
  let clientId: string;
  try {
    url = roomUrl(roomId);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    clientId = getOrCreateClientId();
  } catch (error) {
    onError(error instanceof Error ? error : new Error("无法连接房间服务。"));
    return () => {};
  }

  let socket: WebSocket | undefined;
  let retry: ReturnType<typeof setTimeout> | undefined;
  let watchdog: ReturnType<typeof setTimeout> | undefined;
  let errorTimer: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;
  let delay = 250;

  const reportFailure = () => {
    // Keep brief handshake failures and reconnects out of the error UI.
    errorTimer ??= setTimeout(() => {
      errorTimer = undefined;
      if (!stopped) onError(new Error(connectionError));
    }, 3_000);
  };

  const connect = () => {
    if (stopped) return;
    let current: WebSocket;
    const reconnect = () => {
      if (stopped || retry !== undefined) return;
      clearTimeout(watchdog);
      reportFailure();
      retry = setTimeout(() => {
        retry = undefined;
        connect();
      }, delay);
      delay = Math.min(delay * 2, 10_000);
    };

    try {
      current = new WebSocket(url);
      socket = current;
    } catch {
      reconnect();
      return;
    }

    // An open socket is not ready until the server sends its first snapshot.
    watchdog = setTimeout(() => {
      current.onopen = null;
      current.onmessage = null;
      current.onclose = null;
      current.close();
      reconnect();
    }, 8_000);
    current.onopen = () => {
      if (!stopped) current.send(clientId);
    };
    current.onmessage = (event) => {
      if (stopped) return;
      let room: RoomData | null;
      try {
        room = JSON.parse(event.data) as RoomData | null;
      } catch {
        current.close(1002, "Invalid snapshot");
        return;
      }
      clearTimeout(watchdog);
      clearTimeout(errorTimer);
      errorTimer = undefined;
      if (!room) stopped = true;
      delay = 250;
      onSnapshot(room);
    };
    current.onclose = reconnect;
  };

  connect();
  return () => {
    stopped = true;
    clearTimeout(retry);
    clearTimeout(watchdog);
    clearTimeout(errorTimer);
    if (socket) {
      socket.onopen = null;
      socket.onmessage = null;
      socket.onclose = null;
      socket.close();
    }
  };
}
