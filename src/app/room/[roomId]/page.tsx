"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useRoomSubscription } from "@/hooks/use-room-subscription";
import {
  addPlayer,
  claimRoomHost,
  createRoom,
  deletePlayer,
  saveRoomSettings,
  updatePlayer,
} from "@/lib/room-service";
import { coalesceHandsAdjustedHistory, createHistoryEntry } from "@/lib/history";
import { DisplayMode, Player } from "@/lib/types";
import { toast } from "sonner";
import {
  generateHostPin,
  getOrCreateClientId,
  isHostClient,
  matchesHostPin,
} from "@/lib/host-access";

import { RoomHeader } from "@/components/room-header";
import { PlayerTable } from "@/components/player-table";
import { StatsFooter } from "@/components/stats-footer";
import { AddPlayerDialog } from "@/components/add-player-dialog";
import { DeletePlayerDialog } from "@/components/delete-player-dialog";
import { CreateRoomDialog } from "@/components/create-room-dialog";
import { SettingsSheet } from "@/components/settings-sheet";
import { HistorySheet } from "@/components/history-sheet";
import { QrCodeDialog } from "@/components/qr-code-dialog";
import { HostClaimDialog } from "@/components/host-claim-dialog";

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
  const [hostClaimOpen, setHostClaimOpen] = useState(false);
  const [claimingHost, setClaimingHost] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const roomRef = useRef(room);

  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  useEffect(() => {
    setClientId(getOrCreateClientId());
  }, []);

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

  const isHost = useMemo(
    () =>
      isHostClient({
        currentClientId: clientId,
        hostClientId: room?.hostClientId,
      }),
    [clientId, room?.hostClientId]
  );

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

  const handleAddPlayer = useCallback(
    async (name: string) => {
      if (!roomId || !roomRef.current) throw new Error("房间信息尚未加载");
      await addPlayer(roomId, roomRef.current.config, name);
    },
    [roomId]
  );

  const handleDeletePlayer = async () => {
    if (!roomId || !deleteTarget) return;
    try {
      await deletePlayer(roomId, deleteTarget.id, deleteTarget.name);
      setDeleteTarget(null);
      toast.success("玩家已删除");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "删除失败，请稍后再试。";
      toast.error(message);
    }
  };

  const commitHands = useCallback(
    async (player: Player, hands: number) => {
      const roomValue = roomRef.current;
      if (!roomId || !roomValue) throw new Error("房间信息尚未加载");
      if (!isHost) {
        toast.error("仅房主可修改手数");
        return;
      }
      const rounded = Math.round(hands);
      const updates: Partial<Player> = {
        hands: rounded,
        buyInChips: rounded * roomValue.config.chipsPerHand,
        buyInOverride: false,
      };
      const diff = rounded - player.hands;
      const historyEntry =
        diff === 0
          ? undefined
          : createHistoryEntry({
              type: "hands_adjusted",
              actorId: player.id,
              actorName: player.name,
              handsDelta: diff,
              handsTotal: rounded,
            });
      const latestHistoryEntry = roomValue.history[0];
      const mergedHistoryEntry =
        historyEntry && latestHistoryEntry
          ? coalesceHandsAdjustedHistory(
              latestHistoryEntry,
              historyEntry,
              10_000
            )
          : null;
      await updatePlayer(
        roomId,
        player.id,
        updates,
        mergedHistoryEntry ?? historyEntry
      );
    },
    [isHost, roomId]
  );

  const adjustHands = useCallback(
    async (player: Player, delta: number) => {
      await commitHands(player, player.hands + delta);
    },
    [commitHands]
  );

  const commitCurrentChips = useCallback(
    async (player: Player, chips: number) => {
      if (!roomId) throw new Error("房间信息尚未加载");
      await updatePlayer(roomId, player.id, {
        currentChips: Math.round(chips * 100) / 100,
      });
    },
    [roomId]
  );

  const commitName = useCallback(
    async (player: Player, name: string) => {
      if (!roomId) throw new Error("房间信息尚未加载");
      await updatePlayer(roomId, player.id, { name });
    },
    [roomId]
  );

  const handleSettingsSave = useCallback(
    async (values: {
      chipsPerHand: number;
      chipValue: number;
    }) => {
      const roomValue = roomRef.current;
      if (!roomId || !roomValue) throw new Error("房间信息尚未加载");
      await saveRoomSettings(
        roomId,
        values,
        roomValue.players,
        roomValue.config.chipsPerHand
      );
      toast.success("房间设置已更新");
    },
    [roomId]
  );

  const openAddPlayerDialog = useCallback(() => {
    setAddPlayerOpen(true);
  }, []);

  const handleCreateRoom = async () => {
    if (creatingRoom) return;
    try {
      setCreatingRoom(true);
      const nextClientId = getOrCreateClientId();
      const hostPin = generateHostPin();
      const newRoomId = await createRoom(undefined, {
        hostClientId: nextClientId ?? "",
        hostPin,
      });
      toast.success(`新房间房主 PIN：${hostPin}`);
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

  const handleRevealHostPin = () => {
    if (!room?.hostPin) {
      toast.error("当前房间未设置房主 PIN");
      return;
    }
    toast.success(`房主 PIN：${room.hostPin}`);
  };

  const handleClaimHost = async (pin: string) => {
    if (!room || !roomId) return;
    const nextClientId = getOrCreateClientId();
    if (!nextClientId) {
      toast.error("无法读取当前设备身份");
      return;
    }
    if (!matchesHostPin(pin, room.hostPin)) {
      toast.error("PIN 不正确");
      return;
    }
    try {
      setClaimingHost(true);
      await claimRoomHost(roomId, nextClientId);
      setHostClaimOpen(false);
      toast.success("已认领房主权限");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "认领失败，请稍后再试。";
      toast.error(message);
    } finally {
      setClaimingHost(false);
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
        isHost={isHost}
        onRevealHostPin={handleRevealHostPin}
        onClaimHost={() => setHostClaimOpen(true)}
        disabled={!room}
      />

      <main className="flex-1 overflow-y-auto px-3 pb-20 pt-3">
        <PlayerTable
          players={room.players}
          config={room.config}
          displayMode={displayMode}
          canEditHands={isHost}
          onAddPlayer={openAddPlayerDialog}
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

      <HostClaimDialog
        open={hostClaimOpen}
        submitting={claimingHost}
        onOpenChange={setHostClaimOpen}
        onSubmit={handleClaimHost}
      />
    </div>
  );
}
