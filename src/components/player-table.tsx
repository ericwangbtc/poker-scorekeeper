"use client";

import {
  memo,
  useCallback,
  useState,
  useRef,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DisplayMode, Player, RoomConfig } from "@/lib/types";
import {
  arePlayerRowPropsEqual,
  type PlayerRowMemoProps,
} from "@/lib/player-row-memo";
import { cn } from "@/lib/utils";

interface PlayerTableProps {
  players: Player[];
  config: RoomConfig;
  displayMode: DisplayMode;
  canEditHands: boolean;
  onAddPlayer: (event: MouseEvent<HTMLButtonElement>) => void;
  onRequestDelete: (player: Player, trigger: HTMLButtonElement) => void;
  onPlayerHistory: (player: Player, trigger: HTMLButtonElement) => void;
  onHandsCommit: (player: Player, hands: number) => Promise<void>;
  onHandsAdjust: (player: Player, delta: number) => Promise<void>;
  onCurrentCommit: (player: Player, chips: number) => Promise<void>;
}

function keepHandInputFocused(event: MouseEvent<HTMLButtonElement>) {
  const active = document.activeElement;
  if (active instanceof HTMLInputElement && event.currentTarget.parentElement?.contains(active)) {
    event.preventDefault();
  }
}

const stripTrailingZeros = (value: number) => {
  if (Number.isInteger(value)) return value.toString();
  return value.toFixed(2).replace(/\.?0+$/, "");
};

export function PlayerTable({
  players,
  config,
  displayMode,
  canEditHands,
  onAddPlayer,
  onRequestDelete,
  onPlayerHistory,
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
      if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(input.trim())) return null;
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
      <div className="@container min-w-80 rounded-xl border border-border bg-card">
        <table className="w-full min-w-80 table-fixed text-sm">
          <colgroup>
            <col />
            <col className="w-24 @[30rem]:w-28" />
            <col className="w-[max(3rem,15cqw)]" />
            <col className="w-[max(3rem,18cqw)]" />
            <col className="w-[max(3rem,14cqw)]" />
            <col className="w-10" />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-muted text-[11px] font-medium uppercase text-muted-foreground">
            <tr>
              <th className="h-8 px-1.5 text-center">玩家</th>
              <th className="h-8 px-1.5 text-center">手数</th>
              <th className="h-8 px-1.5 text-center">买入</th>
              <th className="h-8 px-1.5 text-center">剩余</th>
              <th className="h-8 px-1.5 text-center">盈亏</th>
              <th className="h-8 px-1.5 text-center"></th>
            </tr>
          </thead>
          <tbody>
            {players.map((player) => (
              <PlayerRow
                key={player.id}
                player={player}
                config={config}
                displayMode={displayMode}
                canEditHands={canEditHands}
                toInputValue={toInputValue}
                toCellLabel={toCellLabel}
                parseToChips={parseToChips}
                onPlayerHistory={onPlayerHistory}
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

type PlayerRowProps = PlayerRowMemoProps;

const PlayerRow = memo(function PlayerRow({
  player,
  config,
  displayMode,
  canEditHands,
  toInputValue,
  toCellLabel,
  parseToChips,
  onPlayerHistory,
  onHandsCommit,
  onHandsAdjust,
  onCurrentCommit,
  onDelete,
}: PlayerRowProps) {
  const hands = useCellEdit(String(player.hands));
  const current = useCellEdit(toInputValue(player.currentChips), `${displayMode}:${config.chipValue}`);

  const commitHands = () => {
    if (!canEditHands || hands.draft === null || !hands.draft.trim()) return;
    const value = Number(hands.draft);
    if (!/^[+-]?\d+$/.test(hands.draft.trim()) || !Number.isSafeInteger(value)) {
      hands.setError("请输入整数手数。");
      return;
    }
    if (value === player.hands) {
      hands.cancel();
      return;
    }
    void hands.save(() => onHandsCommit(player, value));
  };

  const commitCurrent = () => {
    if (current.draft === null || !current.draft.trim()) return;
    const chips = parseToChips(current.draft);
    if (chips === null || !Number.isFinite(chips)) {
      current.setError("请输入有效数字。");
      return;
    }
    if (Math.abs(chips - player.currentChips) < 0.0001) {
      current.cancel();
      return;
    }
    void current.save(() => onCurrentCommit(player, chips));
  };

  const adjustHands = (delta: number) => {
    if (!canEditHands) return;
    const draft = hands.draft?.trim();
    if (draft) {
      const total = Number(draft) + delta;
      if (!/^[+-]?\d+$/.test(draft) || !Number.isSafeInteger(total)) {
        hands.setError("请输入有效的整数手数。");
        return;
      }
      hands.change(String(total));
      void hands.save(() => onHandsCommit(player, total));
    } else {
      void hands.save(() => onHandsAdjust(player, delta));
    }
    navigator.vibrate?.(15);
  };

  const derivedBuyIn = player.buyInOverride
    ? player.buyInChips
    : player.hands * config.chipsPerHand;

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
    <tr className="h-[44px] border-b border-border/50 last:border-0 even:bg-muted/30 hover:bg-subtle/50 focus-within:bg-primary/5">
      <td className="px-1.5 text-center">
        <button
          type="button"
          onClick={(event) => onPlayerHistory(player, event.currentTarget)}
          aria-label={`查看 ${player.name} 的筹码变更记录`}
          aria-haspopup="dialog"
          className="h-9 w-full cursor-pointer truncate rounded-md px-1 text-center text-sm font-medium underline decoration-muted-foreground/50 underline-offset-4 hover:bg-muted hover:decoration-current focus-visible:outline-2 focus-visible:outline-primary"
        >
          {player.name}
        </button>
      </td>
      <td className="px-1">
        {canEditHands ? (
          <>
            <div className="flex items-center justify-center gap-0.5">
              <Button variant="outline" size="icon" aria-label={`给 ${player.name} 减少一手`}
                disabled={hands.pending}
                onMouseDown={keepHandInputFocused}
                onClick={() => adjustHands(-1)} className="size-6 shrink-0">
                −
              </Button>
              <Input
                type="text"
                inputMode="numeric"
                aria-label={`${player.name} 的手数`}
                aria-invalid={!!hands.error}
                value={hands.value}
                readOnly={hands.pending}
                onChange={(event) => hands.change(event.target.value)}
                onBlur={hands.blur(commitHands)}
                onKeyDown={hands.keyDown}
                className="h-8 w-8 shrink-0 border-transparent bg-transparent px-0 text-center font-bold @[30rem]:w-10"
              />
              <Button variant="outline" size="icon" aria-label={`给 ${player.name} 增加一手`}
                disabled={hands.pending}
                onMouseDown={keepHandInputFocused}
                onClick={() => adjustHands(1)} className="size-6 shrink-0">
                +
              </Button>
            </div>
            <CellStatus edit={hands} onRetry={hands.draft !== null ? commitHands : undefined} />
          </>
        ) : (
          <span className="block text-center font-semibold">{player.hands}</span>
        )}
      </td>
      <td className="px-1.5 text-center">
        <span className="inline-block max-w-full rounded bg-muted px-1 py-1.5 text-xs font-medium text-muted-foreground tabular-nums [overflow-wrap:anywhere] @[30rem]:px-2">
          {toCellLabel(derivedBuyIn)}
        </span>
      </td>
      <td className="px-1.5 text-center">
        <Input
          type="text"
          inputMode="decimal"
          aria-label={`${player.name} 的剩余${displayMode === "cash" ? "金额" : "筹码"}`}
          aria-invalid={!!current.error}
          placeholder="输入"
          value={current.value}
          readOnly={current.pending}
          onFocus={() => {
            if (!current.pending && current.draft === null && current.value === "0") {
              current.change("");
            }
          }}
          onChange={(event) => current.change(event.target.value)}
          onBlur={current.blur(commitCurrent)}
          onKeyDown={current.keyDown}
          className="h-9 w-full border-transparent bg-muted/50 px-1.5 text-center font-semibold focus:border-primary focus:bg-card"
        />
        <CellStatus edit={current} onRetry={commitCurrent} />
      </td>
      <td
        className={cn(
          "px-1.5 text-center text-sm font-bold tabular-nums [overflow-wrap:anywhere]",
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
          aria-label={`删除 ${player.name}`}
          onClick={(event) => onDelete(player, event.currentTarget)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          ✕
        </button>
      </td>
    </tr>
  );
}, arePlayerRowPropsEqual);

function useCellEdit(serverValue: string, unit?: string) {
  const [input, setDraft] = useState<{ value: string; unit?: string } | null>(null);
  const draft = input?.unit === unit ? input?.value ?? null : null;
  const [status, setStatus] = useState<"idle" | "saving" | "failed">("idle");
  const [error, setError] = useState<string | null>(null);
  const saving = useRef(false);
  const skipBlur = useRef(false);

  const cancel = () => {
    setDraft(null);
    setStatus("idle");
    setError(null);
  };

  return {
    draft,
    value: draft ?? serverValue,
    pending: status === "saving",
    status,
    error: input && draft === null ? null : error,
    setError,
    cancel,
    change(value: string) {
      setDraft({ value, unit });
      setStatus("idle");
      setError(null);
    },
    async save(commit: () => Promise<void>) {
      if (saving.current) return;
      saving.current = true;
      setStatus("saving");
      setError(null);
      try {
        await commit();
        setDraft(null);
        setStatus("idle");
      } catch (err) {
        setStatus("failed");
        setError(err instanceof Error ? err.message : "保存失败，请重试。");
      } finally {
        saving.current = false;
      }
    },
    blur(commit: () => void) {
      return () => {
        if (skipBlur.current) {
          skipBlur.current = false;
          return;
        }
        if (draft !== null && !draft.trim()) {
          cancel();
          return;
        }
        commit();
      };
    },
    keyDown(event: KeyboardEvent<HTMLInputElement>) {
      if (event.nativeEvent.isComposing || saving.current) return;
      if (event.key === "Escape") {
        event.preventDefault();
        skipBlur.current = true;
        cancel();
        event.currentTarget.blur();
      }
      if (event.key === "Enter") {
        event.preventDefault();
        event.currentTarget.blur();
      }
    },
  };
}

function CellStatus({
  edit,
  onRetry,
}: {
  edit: ReturnType<typeof useCellEdit>;
  onRetry?: () => void;
}) {
  return (
    <div className="text-center text-[11px] leading-tight [overflow-wrap:anywhere]">
      <p role="status" className={cn(edit.error ? "text-destructive" : "text-muted-foreground")}>
        {edit.error ?? (edit.pending ? "保存中…" : "")}
      </p>
      {edit.error && edit.status === "failed" && onRetry && (
        <button type="button" onClick={onRetry} className="py-1 text-primary underline">
          重试
        </button>
      )}
    </div>
  );
}
