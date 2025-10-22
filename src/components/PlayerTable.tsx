import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
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
  onCurrentCommit,
}: PlayerTableProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isAddFormVisible, setIsAddFormVisible] = useState(false);
  const [addNameDraft, setAddNameDraft] = useState("");
  const addInputRef = useRef<HTMLInputElement | null>(null);

  const toInputValue = useCallback(
    (chips: number) => {
      if (Math.abs(chips) < 0.0001) {
        return "";
      }
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

  useEffect(() => {
    if (isAddFormVisible && addInputRef.current) {
      addInputRef.current.focus();
      addInputRef.current.select();
    }
  }, [isAddFormVisible]);

  const resetAddForm = () => {
    setAddNameDraft("");
    setIsAddFormVisible(false);
  };

  const handleAddSubmit = async (event?: FormEvent) => {
    if (event) {
      event.preventDefault();
    }
    if (isAdding) {
      return;
    }
    const trimmed = addNameDraft.trim();
    if (!trimmed) {
      return;
    }
    try {
      setIsAdding(true);
      await onAddPlayer(trimmed);
      resetAddForm();
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
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full table-fixed border-collapse text-[14px] leading-tight text-slate-800">
          <thead className="sticky top-0 z-10 bg-slate-100 text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th scope="col" className="w-[28%] px-2 py-2 text-center">
                姓名
              </th>
              <th scope="col" className="w-[11%] px-2 py-2 text-center">
                手数
              </th>
              <th scope="col" className="w-[14%] px-2 py-2 text-center">
                买入
              </th>
              <th scope="col" className="w-[14%] px-2 py-2 text-center">
                剩余码量
              </th>
              <th scope="col" className="w-[15%] px-2 py-2 text-center">
                盈亏
              </th>
              <th scope="col" className="w-[18%] px-2 py-2 text-center">
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

      {isAddFormVisible ? (
        <form
          onSubmit={handleAddSubmit}
          className="flex w-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
        >
          <div className="flex-1">
            <input
              ref={addInputRef}
              type="text"
              value={addNameDraft}
              onChange={(event) => setAddNameDraft(event.target.value)}
              placeholder="输入玩家姓名"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div className="flex justify-end gap-2 sm:justify-start">
            <button
              type="button"
              onClick={resetAddForm}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isAdding || addNameDraft.trim().length === 0}
              className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:cursor-not-allowed disabled:bg-indigo-400/60"
            >
              {isAdding ? "添加中..." : "确认添加"}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setIsAddFormVisible(true)}
          className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-indigo-500 text-sm font-semibold text-white transition hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          + 添加玩家
        </button>
      )}
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
  onDelete,
}: PlayerRowProps) => {
  const [nameDraft, setNameDraft] = useState(player.name);
  const [handsDraft, setHandsDraft] = useState(player.hands.toString());
  const [currentDraft, setCurrentDraft] = useState(
    toInputValue(player.currentChips)
  );
  const [isEditingCurrent, setIsEditingCurrent] = useState(false);

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
        err instanceof Error ? err.message : "更新剩余码量失败，请重试。";
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

  const handleCurrentCancel = () => {
    setCurrentDraft(toInputValue(player.currentChips));
    setIsEditingCurrent(false);
  };

  const profitChips = player.currentChips - derivedBuyIn;
  const profitDisplay =
    Math.abs(profitChips) < 0.0001
      ? ""
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
      <td className="w-[32%] px-3 text-center">
        <input
          type="text"
          value={nameDraft}
          onChange={(event) => setNameDraft(event.target.value)}
          onBlur={commitName}
          onKeyDown={handleKeyDown(commitName, () => setNameDraft(player.name))}
          className="h-9 w-full rounded border border-transparent px-1 text-center text-[12px] font-medium text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-0"
        />
      </td>
      <td className="w-[16%] px-2">
        <div className="flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={() => handleAdjustHands(-1)}
            className="inline-flex h-5 w-5 items-center justify-center rounded border border-slate-300 text-[12px] text-slate-600 transition hover:border-slate-400 hover:text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-200"
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
            className="h-8 w-5 rounded border border-transparent bg-transparent text-center text-[12px] font-semibold text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-0"
          />
          <button
            type="button"
            onClick={() => handleAdjustHands(1)}
            className="inline-flex h-5 w-5 items-center justify-center rounded border border-slate-300 text-[12px] text-slate-600 transition hover:border-slate-400 hover:text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-200"
            aria-label={`增加 ${player.name} 的手数`}
          >
            +
          </button>
        </div>
      </td>
      <td className="w-[13%] px-2 text-center">
        <span className="inline-flex h-8 min-w-[40px] items-center justify-center rounded bg-slate-100 px-2 text-[12px] font-medium text-slate-600">
          {toCellLabel(derivedBuyIn)}
        </span>
      </td>
      <td className="w-[18%] px-2 text-center">
        <input
          type="number"
          inputMode="decimal"
          value={currentDraft}
          onFocus={() => setIsEditingCurrent(true)}
          onChange={(event) => setCurrentDraft(event.target.value)}
          onBlur={commitCurrent}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
            if (event.key === "Escape") {
              handleCurrentCancel();
              event.currentTarget.blur();
            }
          }}
          className="h-8 w-16 rounded border border-transparent bg-white px-2 text-center text-[12px] font-semibold text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200"
        />
      </td>
      <td
        className={clsx(
          "w-[11%] px-2 text-center text-[12px] font-semibold",
          profitColor
        )}
      >
        {profitDisplay}
      </td>
      <td className="w-[10%] px-2 text-center">
        <button
          type="button"
          onClick={() => onDelete(player)}
          className="inline-flex h-5 w-5 items-center justify-center rounded border border-slate-300 text-[14px] text-slate-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-500 focus:outline-none focus:ring-1 focus:ring-red-200"
          aria-label={`删除玩家 ${player.name}`}
        >
          🗑
        </button>
      </td>
    </tr>
  );
};

export default PlayerTable;
