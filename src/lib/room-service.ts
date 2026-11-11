import type { RoomCommand } from "../../worker/commands";
import { getOrCreateClientId } from "./host-access";
import { generateRoomId } from "./id";
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

  let socket: WebSocket;
  let retry: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;
  let delay = 500;

  const connect = () => {
    socket = new WebSocket(url);
    socket.onopen = () => {
      if (!stopped) socket.send(clientId);
    };
    socket.onmessage = (event) => {
      if (stopped) return;
      const room = JSON.parse(event.data) as RoomData | null;
      if (!room) stopped = true;
      delay = 500;
      onSnapshot(room);
    };
    socket.onclose = () => {
      if (stopped) return;
      onError(new Error(connectionError));
      retry = setTimeout(connect, delay);
      delay = Math.min(delay * 2, 10_000);
    };
  };

  connect();
  return () => {
    stopped = true;
    clearTimeout(retry);
    socket.close();
  };
}
