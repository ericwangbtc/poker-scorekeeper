import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { DisplayMode, Player, RoomConfig } from "../types";

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
  onCurrentCommit
}: PlayerTableProps) => {
  const [isAdding, setIsAdding] = useState(false);

  const toInputValue = useCallback(
    (chips: number) => {
      if (displayMode === "cash") {
        return stripTrailingZeros(chips * config.chipValue);
      }
      return stripTrailingZeros(chips);
    },
    [config.chipValue, displayMode]
  );

  const toCellLabel = useCallback(
    (chips: number) => {
      if (displayMode === "cash") {
        const cashValue = chips * config.chipValue;
        return `¥${stripTrailingZeros(cashValue)}`;
      }
      return stripTrailingZeros(chips);
    },
    [config.chipValue, displayMode]
  );

  const parseToChips = useCallback(
    (input: string) => {
      const numeric = Number(input);
      if (!Number.isFinite(numeric)) {
        return null;
      }
      if (displayMode === "cash") {
        if (config.chipValue <= 0) {
          return null;
        }
        return numeric / config.chipValue;
      }
      return numeric;
    },
    [config.chipValue, displayMode]
  );

  const handleAddPlayer = async () => {
    if (isAdding) {
      return;
    }
    if (typeof window === "undefined") {
      return;
    }
    const name = window.prompt("输入玩家姓名");
    const trimmed = name?.trim() ?? "";
    if (!trimmed) {
      return;
    }
    try {
      setIsAdding(true);
      await onAddPlayer(trimmed);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "添加玩家失败，请重试。";
      alert(message);
    } finally {
      setIsAdding(false);
    }
  };

  const hasPlayers = players.length > 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full table-fixed border-collapse text-[14px] leading-tight text-slate-800">
          <thead className="sticky top-0 z-10 bg-slate-100 text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th scope="col" className="w-[140px] px-3 py-2 text-left">
                姓名
              </th>
              <th scope="col" className="w-[110px] px-2 py-2 text-center">
                手数
              </th>
              <th scope="col" className="w-[110px] px-2 py-2 text-right">
                买入
              </th>
              <th scope="col" className="w-[120px] px-2 py-2 text-right">
                当前
              </th>
              <th scope="col" className="w-[110px] px-2 py-2 text-right">
                盈亏
              </th>
              <th scope="col" className="w-[60px] px-2 py-2 text-center">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {players.map((player) => (
              <PlayerRow
                key={player.id}
                player={player}
                config={config}
                displayMode={displayMode}
                toInputValue={toInputValue}
                toCellLabel={toCellLabel}
                parseToChips={parseToChips}
                onNameCommit={onNameCommit}
                onHandsCommit={onHandsCommit}
                onHandsAdjust={onHandsAdjust}
                onCurrentCommit={onCurrentCommit}
                onDelete={onRequestDelete}
              />
            ))}
            {!hasPlayers ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-sm text-slate-500"
                >
                  还没有玩家，点击下方按钮添加第一位玩家。
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={handleAddPlayer}
        disabled={isAdding}
        className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-indigo-500 text-sm font-semibold text-white transition hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:cursor-not-allowed disabled:bg-indigo-400/60"
      >
        {isAdding ? "添加中..." : "+ 添加玩家"}
      </button>
    </div>
  );
};

interface PlayerRowProps {
  player: Player;
  config: RoomConfig;
  displayMode: DisplayMode;
  toInputValue: (chips: number) => string;
  toCellLabel: (chips: number) => string;
  parseToChips: (value: string) => number | null;
  onNameCommit: (player: Player, name: string) => Promise<void>;
  onHandsCommit: (player: Player, hands: number) => Promise<void>;
  onHandsAdjust: (player: Player, delta: number) => Promise<void>;
  onCurrentCommit: (player: Player, chips: number) => Promise<void>;
  onDelete: (player: Player) => void;
}

const PlayerRow = ({
  player,
  config,
  displayMode,
  toInputValue,
  toCellLabel,
  parseToChips,
  onNameCommit,
  onHandsCommit,
  onHandsAdjust,
  onCurrentCommit,
  onDelete
}: PlayerRowProps) => {
  const [nameDraft, setNameDraft] = useState(player.name);
  const [handsDraft, setHandsDraft] = useState(player.hands.toString());
  const [currentDraft, setCurrentDraft] = useState(
    toInputValue(player.currentChips)
  );
  const [isEditingCurrent, setIsEditingCurrent] = useState(false);
  const currentInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setNameDraft(player.name);
  }, [player.name]);

  useEffect(() => {
    setHandsDraft(player.hands.toString());
  }, [player.hands]);

  useEffect(() => {
    if (!isEditingCurrent) {
      setCurrentDraft(toInputValue(player.currentChips));
    }
  }, [isEditingCurrent, player.currentChips, toInputValue]);

  useEffect(() => {
    if (isEditingCurrent && currentInputRef.current) {
      currentInputRef.current.focus();
      currentInputRef.current.select();
    }
  }, [isEditingCurrent]);

  const derivedBuyIn = player.buyInOverride
    ? player.buyInChips
    : player.hands * config.chipsPerHand;

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
      setCurrentDraft(toInputValue(player.currentChips));
      setIsEditingCurrent(false);
      return;
    }
    if (Math.abs(chips - player.currentChips) < 0.0001) {
      setIsEditingCurrent(false);
      return;
    }
    try {
      await onCurrentCommit(player, chips);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "更新当前筹码失败，请重试。";
      alert(message);
      setCurrentDraft(toInputValue(player.currentChips));
    } finally {
      setIsEditingCurrent(false);
    }
  };

  const handleKeyDown =
    (commit: () => Promise<void> | void, reset: () => void) =>
    async (event: KeyboardEvent<HTMLInputElement>) => {
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

  const handleCurrentDisplayClick = () => {
    setIsEditingCurrent(true);
  };

  const handleCurrentCancel = () => {
    setCurrentDraft(toInputValue(player.currentChips));
    setIsEditingCurrent(false);
  };

  const profitChips = player.currentChips - derivedBuyIn;
  const profitDisplay =
    profitChips === 0
      ? "0"
      : displayMode === "cash"
      ? `${profitChips < 0 ? "-" : ""}¥${stripTrailingZeros(
          Math.abs(profitChips) * config.chipValue
        )}`
      : `${profitChips >= 0 ? "+" : "-"}${stripTrailingZeros(
          Math.abs(profitChips)
        )}`;

  const profitColor =
    profitChips === 0
      ? "text-slate-500"
      : profitChips > 0
      ? "text-emerald-600"
      : "text-red-600";

  return (
    <tr
      className={clsx(
        "h-11 border-b border-slate-200 align-middle text-[14px] odd:bg-white even:bg-slate-50",
        "focus-within:bg-indigo-50 focus-within:text-slate-900 focus-within:ring-1 focus-within:ring-indigo-200"
      )}
    >
      <td className="px-3">
        <input
          type="text"
          value={nameDraft}
          onChange={(event) => setNameDraft(event.target.value)}
          onBlur={commitName}
          onKeyDown={handleKeyDown(commitName, () =>
            setNameDraft(player.name)
          )}
          className="h-9 w-full rounded border border-transparent px-2 text-[14px] font-medium text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-0"
        />
      </td>
      <td className="px-2">
        <div className="flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={() => handleAdjustHands(-1)}
            className="inline-flex h-5 w-5 items-center justify-center rounded border border-slate-300 text-[13px] text-slate-600 transition hover:border-slate-400 hover:text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-200"
            aria-label={`减少 ${player.name} 的手数`}
          >
            −
          </button>
          <input
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            value={handsDraft}
            onChange={(event) => setHandsDraft(event.target.value)}
            onBlur={commitHands}
            onKeyDown={handleKeyDown(commitHands, () =>
              setHandsDraft(player.hands.toString())
            )}
            className="h-8 w-14 rounded border border-transparent bg-transparent text-center text-[14px] font-semibold text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-0"
          />
          <button
            type="button"
            onClick={() => handleAdjustHands(1)}
            className="inline-flex h-5 w-5 items-center justify-center rounded border border-slate-300 text-[13px] text-slate-600 transition hover:border-slate-400 hover:text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-200"
            aria-label={`增加 ${player.name} 的手数`}
          >
            +
          </button>
        </div>
      </td>
      <td className="px-2">
        <span className="inline-flex h-8 w-full items-center justify-end rounded bg-slate-100 px-2 text-[13px] font-medium text-slate-600">
          {toCellLabel(derivedBuyIn)}
        </span>
      </td>
      <td className="px-2 text-right">
        {isEditingCurrent ? (
          <input
            ref={currentInputRef}
            type="number"
            inputMode="decimal"
            value={currentDraft}
            onChange={(event) => setCurrentDraft(event.target.value)}
            onBlur={commitCurrent}
            onKeyDown={async (event) => {
              if (event.key === "Enter") {
                event.currentTarget.blur();
                await commitCurrent();
              }
              if (event.key === "Escape") {
                handleCurrentCancel();
              }
            }}
            className="h-8 w-full rounded border border-indigo-300 bg-white px-2 text-right text-[14px] font-semibold outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200"
          />
        ) : (
          <button
            type="button"
            onClick={handleCurrentDisplayClick}
            className="inline-flex h-8 w-full items-center justify-end rounded border border-transparent px-2 text-right text-[14px] font-semibold text-slate-800 transition hover:border-indigo-200 hover:bg-indigo-50 focus:outline-none focus:ring-1 focus:ring-indigo-200"
          >
            {toCellLabel(player.currentChips)}
          </button>
        )}
      </td>
      <td className={clsx("px-2 text-right text-[14px] font-semibold", profitColor)}>
        {profitDisplay}
      </td>
      <td className="px-2 text-center">
        <button
          type="button"
          onClick={() => onDelete(player)}
          className="inline-flex h-5 w-5 items-center justify-center rounded border border-slate-300 text-[16px] text-slate-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-500 focus:outline-none focus:ring-1 focus:ring-red-200"
          aria-label={`删除玩家 ${player.name}`}
        >
          🗑
        </button>
      </td>
    </tr>
  );
};

export default PlayerTable;
