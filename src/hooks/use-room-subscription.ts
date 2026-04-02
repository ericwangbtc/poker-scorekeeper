"use client";

import { useEffect, useMemo, useState } from "react";
import { isFirebaseConfigured } from "@/lib/firebase";
import {
  createDefaultRoomConfig,
  subscribeToRoom,
  subscribeToRoomHistory,
} from "@/lib/room-service";
import { HistoryEntry, Player, RoomData, RoomSnapshot } from "@/lib/types";

type CoreRoomData = Omit<RoomData, "history">;

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

const toCoreRoomData = (roomId: string, snapshot: RoomSnapshot): CoreRoomData => {
  const config = snapshot.config ?? createDefaultRoomConfig();
  return {
    id: roomId,
    config,
    players: normalizePlayers(snapshot.players),
    hostClientId: snapshot.hostClientId ?? "",
    hostPin: snapshot.hostPin ?? "",
    updatedAt: snapshot.updatedAt ?? Date.now(),
    expiresAt: snapshot.expiresAt,
  };
};

export const useRoomSubscription = (roomId?: string) => {
  const [snapshotState, setSnapshotState] = useState<{
    roomId: string | null;
    room: CoreRoomData | null;
    error: string | null;
    resolved: boolean;
  }>({
    roomId: null,
    room: null,
    error: null,
    resolved: false,
  });
  const [historyState, setHistoryState] = useState<{
    roomId: string | null;
    entries: HistoryEntry[];
  }>({
    roomId: null,
    entries: [],
  });

  useEffect(() => {
    if (!roomId || !isFirebaseConfigured) {
      return;
    }

    const unsubscribe = subscribeToRoom(
      roomId,
      (snapshot) => {
        if (!snapshot || !snapshot.config) {
          setSnapshotState({
            roomId,
            room: null,
            error: "房间不存在或已被删除。",
            resolved: true,
          });
        } else {
          setSnapshotState({
            roomId,
            room: toCoreRoomData(roomId, snapshot),
            error: null,
            resolved: true,
          });
        }
      },
      (err) => {
        setSnapshotState({
          roomId,
          room: null,
          error: err.message,
          resolved: true,
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [roomId]);

  useEffect(() => {
    if (!roomId || !isFirebaseConfigured) {
      return;
    }

    const unsubscribe = subscribeToRoomHistory(
      roomId,
      (entries) => {
        setHistoryState({
          roomId,
          entries,
        });
      },
      (err) => {
        console.error(err);
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

    if (snapshotState.roomId !== roomId) {
      return {
        room: null,
        loading: true,
        error: null,
      };
    }

    const historyEntries =
      historyState.roomId === roomId ? historyState.entries : [];

    const room = snapshotState.room
      ? {
          ...snapshotState.room,
          history: historyEntries,
        }
      : null;

    return {
      room,
      loading: !snapshotState.resolved,
      error: snapshotState.error,
    };
  }, [historyState, roomId, snapshotState]);
};
