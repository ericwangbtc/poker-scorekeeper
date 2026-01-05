"use client";

import { useCallback, useEffect, useState, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DisplayMode, Player, RoomConfig } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PlayerTableProps {
  players: Player[];
  config: RoomConfig;
  displayMode: DisplayMode;
  onAddPlayer: () => void;
  onRequestDelete: (player: Player) => void;
  onNameCommit: (player: Player, name: string) => Promise<void>;
  onHandsCommit: (player: Player, hands: number) => Promise<void>;
  onHandsAdjust: (player: Player, delta: number) => Promise<void>;
  onCurrentCommit: (player: Player, chips: number) => Promise<void>;
}

const stripTrailingZeros = (value: number) => {
  if (Number.isInteger(value)) return value.toString();
  return value.toFixed(2).replace(/\.?0+$/, "");
};

export function PlayerTable({
  players,
  config,
  displayMode,
  onAddPlayer,
  onRequestDelete,
  onNameCommit,
  onHandsCommit,
  onHandsAdjust,
  onCurrentCommit,
}: PlayerTableProps) {
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
      if (!Number.isFinite(numeric)) return null;
      if (displayMode === "cash") {
        if (config.chipValue <= 0) return null;
        return numeric / config.chipValue;
      }
      return numeric;
    },
    [config.chipValue, displayMode]
  );

  const hasPlayers = players.length > 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full table-fixed text-sm">
          <colgroup>
            <col className="w-[26%]" />
            <col className="w-[18%]" />
            <col className="w-[15%]" />
            <col className="w-[18%]" />
            <col className="w-[14%]" />
            <col className="w-[9%]" />
          </colgroup>
          <thead className="bg-muted text-[11px] font-medium uppercase text-muted-foreground">
            <tr>
              <th className="h-9 px-1.5 text-center">玩家</th>
              <th className="h-9 px-1.5 text-center">手数</th>
              <th className="h-9 px-1.5 text-center">买入</th>
              <th className="h-9 px-1.5 text-center">剩余</th>
              <th className="h-9 px-1.5 text-center">盈亏</th>
              <th className="h-9 px-1.5 text-center"></th>
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
            {!hasPlayers && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-sm text-muted-foreground"
                >
                  还没有玩家，点击下方按钮添加第一位玩家。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Button
        onClick={onAddPlayer}
        className="h-11 w-full gold-gradient font-semibold text-primary-foreground"
      >
        + 添加玩家
      </Button>
    </div>
  );
}

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

function PlayerRow({
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
}: PlayerRowProps) {
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
    if (trimmed === player.name) return;
    try {
      await onNameCommit(player, trimmed);
    } catch {
      setNameDraft(player.name);
    }
  };

  const commitHands = async () => {
    const numeric = Number(handsDraft);
    if (!Number.isFinite(numeric)) {
      setHandsDraft(player.hands.toString());
      return;
    }
    if (numeric === player.hands) return;
    try {
      await onHandsCommit(player, numeric);
    } catch {
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
    } catch {
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
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(15);
    }
    try {
      const next = player.hands + delta;
      setHandsDraft(next.toString());
      await onHandsAdjust(player, delta);
    } catch {
      setHandsDraft(player.hands.toString());
    }
  };

  const profitChips = player.currentChips - derivedBuyIn;
  const profitDisplay =
    Math.abs(profitChips) < 0.0001
      ? displayMode === "cash"
        ? "¥0"
        : "0"
      : displayMode === "cash"
      ? `${profitChips < 0 ? "-" : ""}¥${stripTrailingZeros(
          Math.abs(profitChips) * config.chipValue
        )}`
      : `${profitChips >= 0 ? "+" : "-"}${stripTrailingZeros(
          Math.abs(profitChips)
        )}`;

  return (
    <tr className="h-[60px] border-b border-border/50 last:border-0 even:bg-muted/30 hover:bg-subtle/50 focus-within:bg-primary/5">
      <td className="px-1.5 text-center">
        <Input
          type="text"
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          onBlur={commitName}
          onKeyDown={handleKeyDown(commitName, () => setNameDraft(player.name))}
          className="h-9 w-full border-transparent bg-transparent px-1 text-center text-sm font-medium focus:border-primary focus:bg-muted"
        />
      </td>
      <td className="px-1">
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => handleAdjustHands(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border/50 bg-background/50 text-sm text-muted-foreground hover:border-primary hover:bg-primary/10 hover:text-foreground active:scale-95 transition-all"
          >
            −
          </button>
          <Input
            type="number"
            inputMode="numeric"
            value={handsDraft}
            onChange={(e) => setHandsDraft(e.target.value)}
            onBlur={commitHands}
            onKeyDown={handleKeyDown(commitHands, () =>
              setHandsDraft(player.hands.toString())
            )}
            className="h-9 w-8 border-transparent bg-transparent px-0 text-center text-sm font-bold focus:border-primary focus:bg-muted"
          />
          <button
            type="button"
            onClick={() => handleAdjustHands(1)}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border/50 bg-background/50 text-sm text-muted-foreground hover:border-primary hover:bg-primary/10 hover:text-foreground active:scale-95 transition-all"
          >
            +
          </button>
        </div>
      </td>
      <td className="px-1.5 text-center">
        <span className="inline-flex h-7 items-center justify-center rounded bg-muted px-2 text-xs font-medium text-muted-foreground tabular-nums">
          {toCellLabel(derivedBuyIn)}
        </span>
      </td>
      <td className="px-1.5 text-center">
        <Input
          type="number"
          inputMode="decimal"
          placeholder="输入"
          value={currentDraft}
          onFocus={() => setIsEditingCurrent(true)}
          onChange={(e) => setCurrentDraft(e.target.value)}
          onBlur={commitCurrent}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") {
              setCurrentDraft(toInputValue(player.currentChips));
              setIsEditingCurrent(false);
              e.currentTarget.blur();
            }
          }}
          className="h-9 w-full border-transparent bg-muted/50 px-1.5 text-center text-sm font-semibold focus:border-primary focus:bg-card"
        />
      </td>
      <td
        className={cn(
          "px-1.5 text-center text-sm font-bold tabular-nums",
          profitChips > 0 && "text-profit",
          profitChips < 0 && "text-loss",
          profitChips === 0 && "text-muted-foreground"
        )}
      >
        {profitDisplay}
      </td>
      <td className="px-1 text-center">
        <button
          type="button"
          onClick={() => onDelete(player)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          ✕
        </button>
      </td>
    </tr>
  );
}
