"use client";

import { useEffect, useMemo, useState } from "react";
import { isFirebaseConfigured } from "@/lib/firebase";
import {
  createDefaultRoomConfig,
  subscribeToRoom,
} from "@/lib/room-service";
import { HistoryEntry, Player, RoomData, RoomSnapshot } from "@/lib/types";

const normalizePlayers = (playersRecord?: Record<string, Player>) => {
  if (!playersRecord) {
    return [] as Player[];
  }
  return Object.values(playersRecord)
    .map((player) => ({
      ...player,
      buyInOverride: player.buyInOverride ?? false,
    }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
};

const normalizeHistory = (historyRecord?: Record<string, HistoryEntry>) => {
  if (!historyRecord) {
    return [];
  }
  return Object.values(historyRecord).sort((a, b) => b.timestamp - a.timestamp);
};

const toRoomData = (roomId: string, snapshot: RoomSnapshot): RoomData => {
  const config = snapshot.config ?? createDefaultRoomConfig();
  return {
    id: roomId,
    config,
    players: normalizePlayers(snapshot.players),
    history: normalizeHistory(snapshot.history),
    updatedAt: snapshot.updatedAt ?? Date.now(),
    expiresAt: snapshot.expiresAt,
  };
};

export const useRoomSubscription = (roomId?: string) => {
  const [room, setRoom] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prevRoomId, setPrevRoomId] = useState(roomId);

  if (roomId !== prevRoomId) {
    setPrevRoomId(roomId);
    setLoading(true);
    setError(null);
    setRoom(null);
  }

  useEffect(() => {
    if (!roomId || !isFirebaseConfigured) {
      return;
    }

    const unsubscribe = subscribeToRoom(
      roomId,
      (snapshot) => {
        if (!snapshot) {
          setRoom(null);
          setError("房间不存在或已被删除。");
        } else {
          setRoom(toRoomData(roomId, snapshot));
          setError(null);
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [roomId]);

  return useMemo(() => {
    if (!roomId) {
      return {
        room: null,
        loading: false,
        error: "缺少房间ID",
      };
    }

    if (!isFirebaseConfigured) {
      return {
        room: null,
        loading: false,
        error: "Firebase 未配置，请在环境变量中添加凭证。",
      };
    }

    return {
      room,
      loading,
      error,
    };
  }, [error, loading, room, roomId]);
};
