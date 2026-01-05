"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useRoomSubscription } from "@/hooks/use-room-subscription";
import {
  addPlayer,
  createRoom,
  deletePlayer,
  updatePlayer,
  updateRoomConfig,
} from "@/lib/room-service";
import { createHistoryEntry } from "@/lib/id";
import { DisplayMode, Player } from "@/lib/types";
import { toast } from "sonner";

import { RoomHeader } from "@/components/room-header";
import { PlayerTable } from "@/components/player-table";
import { StatsFooter } from "@/components/stats-footer";
import { AddPlayerDialog } from "@/components/add-player-dialog";
import { DeletePlayerDialog } from "@/components/delete-player-dialog";
import { CreateRoomDialog } from "@/components/create-room-dialog";
import { SettingsSheet } from "@/components/settings-sheet";
import { HistorySheet } from "@/components/history-sheet";
import { QrCodeDialog } from "@/components/qr-code-dialog";

export default function RoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;
  const { room, loading, error } = useRoomSubscription(roomId);

  const [displayMode, setDisplayMode] = useState<DisplayMode>("chip");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [addPlayerOpen, setAddPlayerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Player | null>(null);
  const [createConfirmOpen, setCreateConfirmOpen] = useState(false);
  const [creatingRoom, setCreatingRoom] = useState(false);

  useEffect(() => {
    if (!loading && !room && error && error.includes("不存在")) {
      router.replace("/not-found");
    }
  }, [error, loading, router, room]);

  useEffect(() => {
    setHistoryOpen(false);
  }, [roomId]);

  useEffect(() => {
    if (!roomId) {
      setDisplayMode("chip");
      return;
    }
    const stored = localStorage.getItem(`displayMode:${roomId}`);
    if (stored === "chip" || stored === "cash") {
      setDisplayMode(stored);
      return;
    }
    setDisplayMode(room?.config.displayMode ?? "chip");
  }, [roomId, room?.config.displayMode]);

  const shareLink = useMemo(() => {
    if (!roomId || typeof window === "undefined") return "";
    return `${window.location.origin}/room/${roomId}`;
  }, [roomId]);

  const handleShare = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      toast.success("房间链接已复制到剪贴板");
    } catch {
      toast.error("复制失败，请手动复制链接");
    }
  };

  const handleDisplayModeChange = (mode: DisplayMode) => {
    setDisplayMode(mode);
    if (roomId) {
      localStorage.setItem(`displayMode:${roomId}`, mode);
    }
  };

  const handleAddPlayer = async (name: string) => {
    if (!roomId || !room) throw new Error("房间信息尚未加载");
    await addPlayer(roomId, room.config, name);
  };

  const handleDeletePlayer = async () => {
    if (!roomId || !deleteTarget) return;
    try {
      await deletePlayer(roomId, deleteTarget.id);
      setDeleteTarget(null);
      toast.success("玩家已删除");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "删除失败，请稍后再试。";
      toast.error(message);
    }
  };

  const buildHandsHistoryMessage = (
    playerName: string,
    diff: number,
    newHands: number
  ) => {
    const absDiff = Math.abs(diff);
    if (absDiff === 0) return null;
    const diffLabel = diff > 0 ? "增加" : "减少";
    const currentLabel = absDiff === 1 ? `（当前 ${newHands} 手）` : "";
    return `${playerName} ${diffLabel}了 ${absDiff} 手${currentLabel}`;
  };

  const commitHands = async (player: Player, hands: number) => {
    if (!roomId || !room) throw new Error("房间信息尚未加载");
    const rounded = Math.round(hands);
    const updates: Partial<Player> = {
      hands: rounded,
      buyInChips: rounded * room.config.chipsPerHand,
      buyInOverride: false,
    };
    const diff = rounded - player.hands;
    const message = buildHandsHistoryMessage(player.name, diff, rounded);
    const historyEntry = message ? createHistoryEntry(message) : undefined;
    await updatePlayer(roomId, player.id, updates, historyEntry);
  };

  const adjustHands = async (player: Player, delta: number) => {
    await commitHands(player, player.hands + delta);
  };

  const commitCurrentChips = async (player: Player, chips: number) => {
    if (!roomId) throw new Error("房间信息尚未加载");
    await updatePlayer(roomId, player.id, {
      currentChips: Math.round(chips * 100) / 100,
    });
  };

  const commitName = async (player: Player, name: string) => {
    if (!roomId) throw new Error("房间信息尚未加载");
    await updatePlayer(roomId, player.id, { name });
  };

  const handleSettingsSave = async (values: {
    chipsPerHand: number;
    chipValue: number;
  }) => {
    if (!roomId || !room) throw new Error("房间信息尚未加载");
    const { chipsPerHand, chipValue } = values;
    const updates: Promise<unknown>[] = [
      updateRoomConfig(roomId, { chipsPerHand, chipValue }),
    ];

    if (chipsPerHand !== room.config.chipsPerHand) {
      room.players
        .filter((player) => !player.buyInOverride)
        .forEach((player) => {
          updates.push(
            updatePlayer(roomId, player.id, {
              buyInChips: player.hands * chipsPerHand,
            })
          );
        });
    }

    await Promise.all(updates);
    toast.success("房间设置已更新");
  };

  const handleCreateRoom = async () => {
    if (creatingRoom) return;
    try {
      setCreatingRoom(true);
      const newRoomId = await createRoom();
      router.push(`/room/${newRoomId}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "创建新房间失败，请稍后再试。";
      toast.error(message);
    } finally {
      setCreatingRoom(false);
      setCreateConfirmOpen(false);
    }
  };

  const hintMessage = useMemo(() => {
    if (!room) return null;
    const { chipsPerHand, chipValue } = room.config;
    return `每手 ${chipsPerHand} 筹码 · ¥${(chipsPerHand * chipValue).toFixed(
      2
    )}`;
  }, [room]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="text-muted-foreground">正在加载房间数据...</div>
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className="flex h-full items-center justify-center bg-background px-4">
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-6 py-4 text-center text-sm text-destructive">
          {error}
        </div>
      </div>
    );
  }

  if (!room) return null;

  return (
    <div className="flex h-full flex-col bg-background">
      <RoomHeader
        roomId={roomId}
        hintMessage={hintMessage}
        displayMode={displayMode}
        onDisplayModeChange={handleDisplayModeChange}
        onShare={handleShare}
        onQrCode={() => setQrOpen(true)}
        onSettings={() => setSettingsOpen(true)}
        onHistory={() => setHistoryOpen(true)}
        onCreateRoom={() => setCreateConfirmOpen(true)}
        disabled={!room}
      />

      <main className="flex-1 overflow-y-auto px-3 pb-20 pt-3">
        <PlayerTable
          players={room.players}
          config={room.config}
          displayMode={displayMode}
          onAddPlayer={() => setAddPlayerOpen(true)}
          onRequestDelete={setDeleteTarget}
          onNameCommit={commitName}
          onHandsCommit={commitHands}
          onHandsAdjust={adjustHands}
          onCurrentCommit={commitCurrentChips}
        />
      </main>

      <StatsFooter
        players={room.players}
        config={room.config}
        displayMode={displayMode}
      />

      <AddPlayerDialog
        open={addPlayerOpen}
        onOpenChange={setAddPlayerOpen}
        onSubmit={handleAddPlayer}
      />

      <DeletePlayerDialog
        open={!!deleteTarget}
        playerName={deleteTarget?.name ?? ""}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeletePlayer}
      />

      <CreateRoomDialog
        open={createConfirmOpen}
        isLoading={creatingRoom}
        onCancel={() => setCreateConfirmOpen(false)}
        onConfirm={handleCreateRoom}
      />

      <SettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        chipsPerHand={room.config.chipsPerHand}
        chipValue={room.config.chipValue}
        onSave={handleSettingsSave}
      />

      <HistorySheet
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        entries={room.history}
      />

      <QrCodeDialog open={qrOpen} onOpenChange={setQrOpen} link={shareLink} />
    </div>
  );
}
