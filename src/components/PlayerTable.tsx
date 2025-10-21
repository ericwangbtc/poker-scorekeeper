import clsx from "clsx";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DisplayMode, Player, RoomConfig } from "../types";
import { formatByDisplayMode } from "../utils/format";

interface PlayerTableProps {
  players: Player[];
  config: RoomConfig;
  displayMode: DisplayMode;
  onAddPlayer: (name: string) => Promise<void>;
  onRequestDelete: (player: Player) => void;
  onNameCommit: (player: Player, name: string) => Promise<void>;
  onHandsCommit: (player: Player, hands: number) => Promise<void>;
  onHandsAdjust: (player: Player, delta: number) => Promise<void>;
  onCurrentCommit: (player: Player, chips: number) => Promise<void>;
  onBuyInCommit: (player: Player, chips: number) => Promise<void>;
  onToggleBuyInMode: (player: Player, override: boolean) => Promise<void>;
}

const stripTrailingZeros = (value: number) => {
  if (Number.isInteger(value)) {
    return value.toString();
  }
  return value.toFixed(2).replace(/\.?0+$/, "");
};

const PlayerTable = ({
  players,
  config,
  displayMode,
  onAddPlayer,
  onRequestDelete,
  onNameCommit,
  onHandsCommit,
  onHandsAdjust,
  onCurrentCommit,
  onBuyInCommit,
  onToggleBuyInMode
}: PlayerTableProps) => {
  const [newPlayerName, setNewPlayerName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const chipValue = config.chipValue;

  const toDisplayValue = useCallback(
    (chips: number) => {
      if (displayMode === "cash") {
        return stripTrailingZeros(chips * chipValue);
      }
      return stripTrailingZeros(chips);
    },
    [chipValue, displayMode]
  );

  const parseToChips = useCallback(
    (input: string) => {
      const numeric = Number(input);
      if (!Number.isFinite(numeric)) {
        return null;
      }
      if (displayMode === "cash") {
        if (chipValue <= 0) {
          return null;
        }
        return numeric / chipValue;
      }
      return numeric;
    },
    [chipValue, displayMode]
  );

  const handleAddPlayer = async () => {
    const trimmed = newPlayerName.trim();
    if (trimmed.length === 0 || isAdding) {
      return;
    }
    try {
      setIsAdding(true);
      await onAddPlayer(trimmed);
      setNewPlayerName("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "添加玩家失败，请重试。";
      alert(message);
    } finally {
      setIsAdding(false);
    }
  };

  const addDisabled = useMemo(
    () => newPlayerName.trim().length === 0 || isAdding,
    [isAdding, newPlayerName]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="hidden bg-slate-50 px-6 py-3 text-xs font-medium uppercase tracking-wide text-slate-500 md:grid md:grid-cols-[1.5fr,1fr,1fr,1fr,1fr,56px] md:gap-4">
          <div>姓名</div>
          <div>手数</div>
          <div>买入</div>
          <div>当前</div>
          <div>盈亏</div>
          <div className="text-right">操作</div>
        </div>

        <div className="divide-y divide-slate-200">
          {players.map((player) => (
            <PlayerRow
              key={player.id}
              player={player}
              config={config}
              displayMode={displayMode}
              toDisplayValue={toDisplayValue}
              parseToChips={parseToChips}
              onNameCommit={onNameCommit}
              onHandsCommit={onHandsCommit}
              onHandsAdjust={onHandsAdjust}
              onCurrentCommit={onCurrentCommit}
              onBuyInCommit={onBuyInCommit}
              onToggleBuyInMode={onToggleBuyInMode}
              onDelete={onRequestDelete}
            />
          ))}

          {players.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-500 md:px-6">
              还没有玩家，添加第一位玩家开始记录吧。
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-indigo-400/50 bg-indigo-50 px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:gap-4 sm:px-6">
        <input
          type="text"
          placeholder="玩家姓名"
          value={newPlayerName}
          onChange={(event) => setNewPlayerName(event.target.value)}
          className="w-full rounded-xl border border-indigo-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        />
        <button
          type="button"
          onClick={handleAddPlayer}
          disabled={addDisabled}
          className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:cursor-not-allowed disabled:bg-indigo-400/60"
        >
          {isAdding ? "添加中..." : "+ 添加玩家"}
        </button>
      </div>
    </div>
  );
};

interface PlayerRowProps {
  player: Player;
  config: RoomConfig;
  displayMode: DisplayMode;
  toDisplayValue: (chips: number) => string;
  parseToChips: (value: string) => number | null;
  onNameCommit: (player: Player, name: string) => Promise<void>;
  onHandsCommit: (player: Player, hands: number) => Promise<void>;
  onHandsAdjust: (player: Player, delta: number) => Promise<void>;
  onCurrentCommit: (player: Player, chips: number) => Promise<void>;
  onBuyInCommit: (player: Player, chips: number) => Promise<void>;
  onToggleBuyInMode: (player: Player, override: boolean) => Promise<void>;
  onDelete: (player: Player) => void;
}

const PlayerRow = ({
  player,
  config,
  displayMode,
  toDisplayValue,
  parseToChips,
  onNameCommit,
  onHandsCommit,
  onHandsAdjust,
  onCurrentCommit,
  onBuyInCommit,
  onToggleBuyInMode,
  onDelete
}: PlayerRowProps) => {
  const [nameDraft, setNameDraft] = useState(player.name);
  const [handsDraft, setHandsDraft] = useState(player.hands.toString());
  const [currentDraft, setCurrentDraft] = useState(
    toDisplayValue(player.currentChips)
  );
  const [buyInDraft, setBuyInDraft] = useState(
    toDisplayValue(player.buyInChips)
  );

  useEffect(() => {
    setNameDraft(player.name);
  }, [player.name]);

  useEffect(() => {
    setHandsDraft(player.hands.toString());
  }, [player.hands]);

  useEffect(() => {
    setCurrentDraft(toDisplayValue(player.currentChips));
  }, [player.currentChips, toDisplayValue]);

  useEffect(() => {
    setBuyInDraft(toDisplayValue(player.buyInChips));
  }, [player.buyInChips, toDisplayValue]);

  const commitName = async () => {
    const trimmed = nameDraft.trim();
    if (trimmed.length === 0) {
      setNameDraft(player.name);
      return;
    }
    if (trimmed === player.name) {
      return;
    }
    try {
      await onNameCommit(player, trimmed);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "更新姓名失败，请重试。";
      alert(message);
      setNameDraft(player.name);
    }
  };

  const commitHands = async () => {
    const numeric = Number(handsDraft);
    if (!Number.isFinite(numeric)) {
      setHandsDraft(player.hands.toString());
      return;
    }
    if (numeric === player.hands) {
      return;
    }
    try {
      await onHandsCommit(player, numeric);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "更新手数失败，请重试。";
      alert(message);
      setHandsDraft(player.hands.toString());
    }
  };

  const commitCurrent = async () => {
    const chips = parseToChips(currentDraft);
    if (chips === null) {
      setCurrentDraft(toDisplayValue(player.currentChips));
      return;
    }
    if (Math.abs(chips - player.currentChips) < 0.0001) {
      return;
    }
    try {
      await onCurrentCommit(player, chips);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "更新当前筹码失败，请重试。";
      alert(message);
      setCurrentDraft(toDisplayValue(player.currentChips));
    }
  };

  const commitBuyIn = async () => {
    const chips = parseToChips(buyInDraft);
    if (chips === null) {
      setBuyInDraft(toDisplayValue(player.buyInChips));
      return;
    }
    if (Math.abs(chips - player.buyInChips) < 0.0001) {
      return;
    }
    try {
      await onBuyInCommit(player, chips);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "更新买入失败，请重试。";
      alert(message);
      setBuyInDraft(toDisplayValue(player.buyInChips));
    }
  };

  const profitChips = player.currentChips - player.buyInChips;
  const profitLabel = formatByDisplayMode(
    Math.abs(profitChips),
    config.chipValue,
    displayMode
  );

  const handleKeyDown =
    (commit: () => Promise<void> | void, reset: () => void) =>
    async (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.currentTarget.blur();
        await commit();
      }
      if (event.key === "Escape") {
        reset();
        event.currentTarget.blur();
      }
    };

  const handleAdjustHands = async (delta: number) => {
    try {
      const next = player.hands + delta;
      setHandsDraft(next.toString());
      await onHandsAdjust(player, delta);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "更新手数失败，请重试。";
      alert(message);
      setHandsDraft(player.hands.toString());
    }
  };

  const handleToggleBuyIn = async () => {
    const nextState = !player.buyInOverride;
    try {
      await onToggleBuyInMode(player, nextState);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "更新买入模式失败，请重试。";
      alert(message);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 px-4 py-5 text-sm text-slate-700 md:grid-cols-[1.5fr,1fr,1fr,1fr,1fr,56px] md:items-center md:gap-4 md:px-6 md:py-4 md:text-base">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase text-slate-400 md:hidden">
          姓名
        </span>
        <input
          type="text"
          value={nameDraft}
          onChange={(event) => setNameDraft(event.target.value)}
          onBlur={commitName}
          onKeyDown={handleKeyDown(commitName, () =>
            setNameDraft(player.name)
          )}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 md:text-base"
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase text-slate-400 md:hidden">
          手数
        </span>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-2 py-2">
          <button
            type="button"
            onClick={() => handleAdjustHands(-1)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-base text-slate-700 transition hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            −
          </button>
          <input
            type="number"
            inputMode="numeric"
            value={handsDraft}
            onChange={(event) => setHandsDraft(event.target.value)}
            onBlur={commitHands}
            onKeyDown={handleKeyDown(commitHands, () =>
              setHandsDraft(player.hands.toString())
            )}
            className="w-full rounded-lg border-none bg-transparent text-center text-base outline-none"
          />
          <button
            type="button"
            onClick={() => handleAdjustHands(1)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-base text-slate-700 transition hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase text-slate-400 md:hidden">
          买入
        </span>
        <input
          type="number"
          inputMode="decimal"
          value={buyInDraft}
          onChange={(event) => setBuyInDraft(event.target.value)}
          onBlur={commitBuyIn}
          onKeyDown={handleKeyDown(commitBuyIn, () =>
            setBuyInDraft(toDisplayValue(player.buyInChips))
          )}
          disabled={!player.buyInOverride}
          className={clsx(
            "rounded-xl border px-3 py-2 text-sm outline-none transition md:text-base",
            player.buyInOverride
              ? "border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
              : "border-dashed border-slate-300 bg-slate-100 text-slate-500"
          )}
        />
        <button
          type="button"
          onClick={handleToggleBuyIn}
          className="w-max rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-500 transition hover:border-indigo-400 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        >
          {player.buyInOverride ? "改为自动" : "启用手动"}
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase text-slate-400 md:hidden">
          当前
        </span>
        <input
          type="number"
          inputMode="decimal"
          value={currentDraft}
          onChange={(event) => setCurrentDraft(event.target.value)}
          onBlur={commitCurrent}
          onKeyDown={handleKeyDown(commitCurrent, () =>
            setCurrentDraft(toDisplayValue(player.currentChips))
          )}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 md:text-base"
        />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase text-slate-400 md:hidden">
          盈亏
        </span>
        <span
          className={clsx(
            "rounded-xl border px-3 py-2 text-sm font-semibold md:text-base",
            profitChips === 0
              ? "border-slate-200 bg-slate-100 text-slate-500"
              : profitChips > 0
              ? "border-emerald-200 bg-emerald-50 text-emerald-600"
              : "border-red-200 bg-red-50 text-red-600"
          )}
        >
          {profitChips >= 0 ? "+" : "-"}
          {profitLabel.replace(" 筹码", "")}
          {displayMode === "chip" ? " 筹码" : ""}
        </span>
      </div>
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => onDelete(player)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
          aria-label={`删除玩家 ${player.name}`}
        >
          🗑
        </button>
      </div>
    </div>
  );
};

export default PlayerTable;
