import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CreateRoomConfirmDialog from "../components/CreateRoomConfirmDialog";
import DisplayModeToggle from "../components/DisplayModeToggle";
import DeletePlayerDialog from "../components/DeletePlayerDialog";
import HistoryPanel from "../components/HistoryPanel";
import PlayerTable from "../components/PlayerTable";
import QRCodeModal from "../components/QRCodeModal";
import SettingsPanel from "../components/SettingsPanel";
import StatsSummary from "../components/StatsSummary";
import Toast from "../components/Toast";
import { useRoomSubscription } from "../hooks/useRoomSubscription";
import {
  addPlayer,
  createRoom,
  deletePlayer,
  updatePlayer,
  updateRoomConfig
} from "../services/roomService";
import { DisplayMode, HistoryEntry, Player } from "../types";
import { formatCash, formatChips } from "../utils/format";

const MAX_HISTORY_ENTRIES = 30;

const RoomPage = () => {
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();
  const { room, loading, error } = useRoomSubscription(roomId);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Player | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [createConfirmOpen, setCreateConfirmOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const previousPlayersRef = useRef<Record<string, Player>>({});
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (!loading && !room && error && error.includes("不存在")) {
      navigate("/404", { replace: true });
    }
  }, [error, loading, navigate, room]);

  useEffect(() => {
    previousPlayersRef.current = {};
    hasInitializedRef.current = false;
    setHistoryEntries([]);
    setHistoryOpen(false);
  }, [roomId]);

  useEffect(() => {
    if (!room) {
      previousPlayersRef.current = {};
      hasInitializedRef.current = false;
      setHistoryEntries([]);
      return;
    }

    const prevPlayers = previousPlayersRef.current;
    const currentPlayers = room.players.reduce<Record<string, Player>>(
      (acc, player) => {
        acc[player.id] = player;
        return acc;
      },
      {}
    );

    const isInitialSync = !hasInitializedRef.current;
    const nextEntries: HistoryEntry[] = [];

    room.players.forEach((player) => {
      const prev = prevPlayers[player.id];
      const now = Date.now();
      if (!prev) {
        nextEntries.push({
          id: `${now}-${player.id}`,
          message: `${player.name} 加入了房间`,
          timestamp: now
        });
        return;
      }

      if (isInitialSync) {
        return;
      }

      if (player.hands !== prev.hands) {
        const diff = player.hands - prev.hands;
        const absDiff = Math.abs(diff);
        const isSingleHand = absDiff === 1;
        const diffLabel = diff > 0 ? "增加" : "减少";
        const currentLabel = isSingleHand ? `（当前 ${player.hands} 手）` : "";
        const entry: HistoryEntry = {
          id: `${now}-${player.id}-${diff > 0 ? "inc" : "dec"}`,
          message: `${player.name} ${diffLabel}了 ${absDiff} 手${currentLabel}`,
          timestamp: now
        };
        nextEntries.push(entry);
      }
    });

    if (nextEntries.length > 0) {
      setHistoryEntries((previous) => {
        const merged = [...nextEntries, ...previous];
        return merged.slice(0, MAX_HISTORY_ENTRIES);
      });
    }

    previousPlayersRef.current = currentPlayers;
    hasInitializedRef.current = true;
  }, [room]);

  const shareLink = useMemo(() => {
    if (!roomId || typeof window === "undefined") {
      return "";
    }
    const { origin } = window.location;
    return `${origin}/room/${roomId}`;
  }, [roomId]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 2200);
  };

  const handleShare = async () => {
    if (!shareLink) {
      return;
    }
    try {
      await navigator.clipboard.writeText(shareLink);
      showToast("房间链接已复制到剪贴板");
    } catch {
      showToast("复制失败，请手动复制链接");
    }
  };

  const handleAddPlayer = async (name: string) => {
    if (!roomId || !room) {
      throw new Error("房间信息尚未加载");
    }
    await addPlayer(roomId, room.config, name);
  };

  const createRoomAndNavigate = async () => {
    if (creatingRoom) {
      return;
    }
    try {
      setCreatingRoom(true);
      const newRoomId = await createRoom();
      navigate(`/room/${newRoomId}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "创建新房间失败，请稍后再试。";
      showToast(message);
    } finally {
      setCreatingRoom(false);
    }
  };

  const handleCreateRoomRequest = () => {
    if (creatingRoom) {
      return;
    }
    setCreateConfirmOpen(true);
  };

  const handleConfirmCreateRoom = async () => {
    if (creatingRoom) {
      return;
    }
    try {
      await createRoomAndNavigate();
    } finally {
      setCreateConfirmOpen(false);
    }
  };

  const commitHands = async (player: Player, hands: number) => {
    if (!roomId || !room) {
      throw new Error("房间信息尚未加载");
    }
    const rounded = Math.round(hands);
    const updates: Partial<Player> = {
      hands: rounded,
      buyInChips: rounded * room.config.chipsPerHand,
      buyInOverride: false
    };
    await updatePlayer(roomId, player.id, updates);
  };

  const adjustHands = async (player: Player, delta: number) => {
    await commitHands(player, player.hands + delta);
  };

  const commitCurrentChips = async (player: Player, chips: number) => {
    if (!roomId) {
      throw new Error("房间信息尚未加载");
    }
    await updatePlayer(roomId, player.id, {
      currentChips: Math.round(chips * 100) / 100
    });
  };

  const commitName = async (player: Player, name: string) => {
    if (!roomId) {
      throw new Error("房间信息尚未加载");
    }
    await updatePlayer(roomId, player.id, { name });
  };

  const handleDelete = async () => {
    if (!roomId || !deleteTarget) {
      return;
    }
    try {
      await deletePlayer(roomId, deleteTarget.id);
      setDeleteTarget(null);
      showToast("玩家已删除");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "删除失败，请稍后再试。";
      alert(message);
    }
  };

  const handleDisplayModeChange = async (mode: DisplayMode) => {
    if (!roomId) {
      return;
    }
    await updateRoomConfig(roomId, { displayMode: mode });
  };

  const handleSettingsSave = async (values: {
    chipsPerHand: number;
    chipValue: number;
  }) => {
    if (!roomId || !room) {
      throw new Error("房间信息尚未加载");
    }
    const { chipsPerHand, chipValue } = values;
    const updates: Promise<unknown>[] = [
      updateRoomConfig(roomId, {
        chipsPerHand,
        chipValue
      })
    ];

    if (chipsPerHand !== room.config.chipsPerHand) {
      room.players
        .filter((player) => !player.buyInOverride)
        .forEach((player) => {
          updates.push(
            updatePlayer(roomId, player.id, {
              buyInChips: player.hands * chipsPerHand
            })
          );
        });
    }

    await Promise.all(updates);
    showToast("房间设置已更新");
  };

  const hintMessage = useMemo(() => {
    if (!room) {
      return null;
    }
    const { chipsPerHand, chipValue } = room.config;
    return `每手筹码：${formatChips(chipsPerHand)} · 人民币：${formatCash(
      chipsPerHand,
      chipValue
    )}`;
  }, [room]);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-slate-100">
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-3 pb-24 pt-4 sm:px-6">
          <header className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 px-6 py-4 text-white shadow-xl shadow-slate-900/25">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col items-center gap-3 text-center">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">
                  <span role="img" aria-label="dice">
                    🎲
                  </span>
                  德州扑克记分板
                </span>
                <div className="flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-between">
                  <h1 className="text-2xl font-semibold text-white text-center sm:text-left sm:text-3xl">
                    房间 {roomId}
                  </h1>
                  <button
                    type="button"
                    onClick={handleCreateRoomRequest}
                    disabled={creatingRoom}
                    className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-5 py-2 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-indigo-500/30 transition-transform duration-150 hover:-translate-y-0.5 hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:bg-indigo-500/60 disabled:shadow-none"
                  >
                    {creatingRoom ? "创建中..." : "新建房间"}
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-center text-xs text-slate-200 sm:text-left sm:text-sm">
                  {hintMessage ?? "实时同步中..."}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
                  <DisplayModeToggle
                    mode={room?.config.displayMode ?? "chip"}
                    onChange={handleDisplayModeChange}
                    disabled={!room}
                  />
                  <button
                    type="button"
                    onClick={handleShare}
                    disabled={!room}
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 px-2 py-2 text-xs font-medium text-white/90 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    分享链接
                  </button>
                  <button
                    type="button"
                    onClick={() => setQrOpen(true)}
                    disabled={!room}
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 px-2 py-2 text-xs font-medium text-white/90 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    二维码
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettingsOpen(true)}
                    disabled={!room}
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 px-2 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    设置
                  </button>
                </div>
              </div>
            </div>
          </header>

          <main className="mt-4 flex-1">
            {loading ? (
              <div className="flex h-full min-h-[240px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm text-slate-500">
                正在加载房间数据...
              </div>
            ) : error && !room ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center text-sm text-red-600">
                {error}
              </div>
            ) : room ? (
              <PlayerTable
                players={room.players}
                config={room.config}
                displayMode={room.config.displayMode}
                onAddPlayer={handleAddPlayer}
                onRequestDelete={setDeleteTarget}
                onNameCommit={commitName}
                onHandsCommit={commitHands}
                onHandsAdjust={adjustHands}
                onCurrentCommit={commitCurrentChips}
              />
            ) : null}
          </main>
        </div>
      </div>
      {room ? (
        <div className="flex-shrink-0 bg-slate-100/80 backdrop-blur">
          <div className="mx-auto w-full max-w-5xl">
            <StatsSummary
              players={room.players}
              config={room.config}
              displayMode={room.config.displayMode}
            />
          </div>
        </div>
      ) : null}

      {room ? (
        <SettingsPanel
          open={settingsOpen}
          chipsPerHand={room.config.chipsPerHand}
          chipValue={room.config.chipValue}
          onClose={() => setSettingsOpen(false)}
          onSave={handleSettingsSave}
        />
      ) : null}

      <CreateRoomConfirmDialog
        open={createConfirmOpen}
        isLoading={creatingRoom}
        onCancel={() => setCreateConfirmOpen(false)}
        onConfirm={handleConfirmCreateRoom}
      />

      <DeletePlayerDialog
        open={Boolean(deleteTarget)}
        playerName={deleteTarget?.name ?? ""}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <QRCodeModal open={qrOpen} link={shareLink} onClose={() => setQrOpen(false)} />

      <Toast open={Boolean(toastMessage)} message={toastMessage} />

      <button
        type="button"
        onClick={() => setHistoryOpen((open) => !open)}
        className="fixed bottom-16 right-6 z-30 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-2xl shadow-slate-900/30 transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-white/40"
      >
        {historyOpen ? "隐藏历史" : "历史记录"}
      </button>

      <HistoryPanel
        open={historyOpen}
        entries={historyEntries}
        onClose={() => setHistoryOpen(false)}
      />
    </div>
  );
};

export default RoomPage;
