"use client";

import { useEffect, useState } from "react";
import { subscribeToRoom } from "@/lib/room-service";
import { ROOM_ID_LENGTH } from "@/lib/constants";
import type { RoomData } from "@/lib/types";

const roomIdPattern = new RegExp(`^[A-Z]{${ROOM_ID_LENGTH}}$`);

export function useRoomSubscription(roomId?: string) {
  const [state, setState] = useState<{
    roomId: string;
    room: RoomData | null;
    error: string | null;
  }>();

  const validRoomId = roomId && roomIdPattern.test(roomId) ? roomId : undefined;

  useEffect(() => {
    if (!validRoomId) return;
    return subscribeToRoom(
      validRoomId,
      (room) => setState({ roomId: validRoomId, room, error: room ? null : "房间不存在或已过期。" }),
      (error) => setState((previous) => ({
        roomId: validRoomId,
        room: previous?.roomId === validRoomId ? previous.room : null,
        error: error.message,
      }))
    );
  }, [validRoomId]);

  if (!roomId) return { room: null, loading: false, error: "缺少房间ID" };
  if (!validRoomId) return { room: null, loading: false, error: "房间不存在或已过期。" };
  if (state?.roomId !== roomId) return { room: null, loading: true, error: null };
  return { room: state.room, loading: false, error: state.error };
}
