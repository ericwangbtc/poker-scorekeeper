import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DisplayModeToggle from "../components/DisplayModeToggle";
import DeletePlayerDialog from "../components/DeletePlayerDialog";
import PlayerTable from "../components/PlayerTable";
import QRCodeModal from "../components/QRCodeModal";
import SettingsPanel from "../components/SettingsPanel";
import StatsSummary from "../components/StatsSummary";
import Toast from "../components/Toast";
import { useRoomSubscription } from "../hooks/useRoomSubscription";
import {
  addPlayer,
  deletePlayer,
  updatePlayer,
  updateRoomConfig
} from "../services/roomService";
import { DisplayMode, Player } from "../types";
import { formatByDisplayMode } from "../utils/format";

const RoomPage = () => {
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();
  const { room, loading, error } = useRoomSubscription(roomId);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Player | null>(null);
  const [qrOpen, setQrOpen] = useState(false);

  useEffect(() => {
    if (!loading && !room && error && error.includes("不存在")) {
      navigate("/404", { replace: true });
    }
  }, [error, loading, navigate, room]);

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

  const commitHands = async (player: Player, hands: number) => {
    if (!roomId || !room) {
      throw new Error("房间信息尚未加载");
    }
    const rounded = Math.round(hands);
    const updates: Partial<Player> = { hands: rounded };
    if (!player.buyInOverride) {
      updates.buyInChips = rounded * room.config.chipsPerHand;
    }
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

  const commitBuyIn = async (player: Player, chips: number) => {
    if (!roomId) {
      throw new Error("房间信息尚未加载");
    }
    await updatePlayer(roomId, player.id, {
      buyInChips: Math.round(chips * 100) / 100,
      buyInOverride: true
    });
  };

  const toggleBuyInMode = async (player: Player, override: boolean) => {
    if (!roomId || !room) {
      throw new Error("房间信息尚未加载");
    }
    const updates: Partial<Player> = {
      buyInOverride: override
    };
    if (!override) {
      updates.buyInChips = player.hands * room.config.chipsPerHand;
    }
    await updatePlayer(roomId, player.id, updates);
  };

  const commitName = async (player: Player, name: string) => {
    if (!roomId) {
      throw new Error("房间信息尚未加载");
    }
    await updatePlayer(roomId, player.id, {
      name
    });
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
    const totalValue = room.players.reduce((sum, player) => {
      return sum + player.currentChips;
    }, 0);
    return `当前总筹码：${formatByDisplayMode(
      totalValue,
      room.config.chipValue,
      room.config.displayMode
    )}`;
  }, [room]);

  return (
    <div className="min-h-full bg-slate-100">
      <div className="mx-auto flex min-h-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10">
        <header className="flex flex-col items-start gap-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 px-6 py-8 text-white shadow-lg sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              <span role="img" aria-label="dice">
                🎲
              </span>
              德州扑克记分板
            </div>
            <div className="mt-3 flex items-center gap-3">
              <h1 className="text-2xl font-semibold sm:text-3xl">
                房间: {roomId}
              </h1>
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium transition hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                分享
              </button>
              <button
                type="button"
                onClick={() => setQrOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium transition hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                二维码
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-200">
              {hintMessage ?? "实时同步中..."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <DisplayModeToggle
              mode={room?.config.displayMode ?? "chip"}
              onChange={handleDisplayModeChange}
              disabled={!room}
            />
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              设置
            </button>
          </div>
        </header>

        {loading ? (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-16 text-slate-500">
            正在加载房间数据...
          </div>
        ) : error && !room ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center text-sm text-red-600">
            {error}
          </div>
        ) : room ? (
          <>
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
              onBuyInCommit={commitBuyIn}
              onToggleBuyInMode={toggleBuyInMode}
            />
            <StatsSummary
              players={room.players}
              config={room.config}
              displayMode={room.config.displayMode}
            />
          </>
        ) : null}
      </div>

      {room ? (
        <SettingsPanel
          open={settingsOpen}
          chipsPerHand={room.config.chipsPerHand}
          chipValue={room.config.chipValue}
          onClose={() => setSettingsOpen(false)}
          onSave={handleSettingsSave}
        />
      ) : null}

      <DeletePlayerDialog
        open={Boolean(deleteTarget)}
        playerName={deleteTarget?.name ?? ""}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <QRCodeModal open={qrOpen} link={shareLink} onClose={() => setQrOpen(false)} />

      <Toast open={Boolean(toastMessage)} message={toastMessage} />
    </div>
  );
};

export default RoomPage;
