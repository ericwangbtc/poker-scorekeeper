"use client";

import {
  memo,
  useState,
  useRef,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Player, RoomConfig } from "@/lib/types";
import {
  arePlayerRowPropsEqual,
  type PlayerRowMemoProps,
} from "@/lib/player-row-memo";
import { cn } from "@/lib/utils";

interface PlayerTableProps {
  players: Player[];
  config: RoomConfig;
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

function parseChipInput(input: string) {
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(input.trim())) return null;
  const numeric = Number(input);
  return Number.isFinite(numeric) ? numeric : null;
}

export function PlayerTable({
  players,
  config,
  canEditHands,
  onAddPlayer,
  onRequestDelete,
  onPlayerHistory,
  onHandsCommit,
  onHandsAdjust,
  onCurrentCommit,
}: PlayerTableProps) {
  const toInputValue = stripTrailingZeros;
  const toCellLabel = stripTrailingZeros;
  const parseToChips = parseChipInput;

  const hasPlayers = players.length > 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="@container min-w-0 rounded-xl border border-border bg-card">
        <table className="w-full table-fixed text-xs @[26rem]:text-sm">
          <colgroup>
            <col className={canEditHands ? "w-[24%]" : "w-[28%]"} />
            <col className={canEditHands ? "w-[15%] @[26rem]:w-24" : "w-[10%]"} />
            <col className={canEditHands ? "w-[15%]" : "w-[18%]"} />
            <col className={canEditHands ? "w-[20%]" : "w-[22%]"} />
            <col className={canEditHands ? "w-[19%]" : "w-[22%]"} />
            {canEditHands && <col className="w-[7%]" />}
          </colgroup>
          <thead className="sticky top-0 z-10 bg-muted text-[11px] font-medium uppercase text-muted-foreground">
            <tr>
              <th className="h-8 px-1 text-center">玩家</th>
              <th className="h-8 px-1 text-center">手数</th>
              <th className="h-8 px-1 text-center">买入</th>
              <th className="h-8 px-1 text-center">剩余</th>
              <th className="h-8 px-1 text-center">盈亏</th>
              {canEditHands && <th className="h-8 px-0 text-center"></th>}
            </tr>
          </thead>
          <tbody>
            {players.map((player) => (
              <PlayerRow
                key={player.id}
                player={player}
                config={config}
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
                  colSpan={canEditHands ? 6 : 5}
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
  const current = useCellEdit(toInputValue(player.currentChips));

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
  const profitDisplay = Math.abs(profitChips) < 0.0001
    ? "0"
    : `${profitChips >= 0 ? "+" : "-"}${stripTrailingZeros(Math.abs(profitChips))}`;

  return (
    <tr className="h-[44px] border-b border-border/50 last:border-0 even:bg-muted/30 hover:bg-subtle/50 focus-within:bg-primary/5">
      <td className="px-0.5 text-center">
        <button
          type="button"
          onClick={(event) => onPlayerHistory(player, event.currentTarget)}
          aria-label={`查看 ${player.name} 的筹码变更记录`}
          aria-haspopup="dialog"
          className="min-h-9 w-full cursor-pointer rounded-md px-1 py-1 text-center whitespace-normal [overflow-wrap:anywhere] text-xs @[26rem]:text-sm font-medium underline decoration-muted-foreground/50 underline-offset-4 hover:bg-muted hover:decoration-current focus-visible:outline-2 focus-visible:outline-primary"
        >
          {player.name}
        </button>
      </td>
      <td className="px-0.5">
        {canEditHands ? (
          <>
            <div className="grid grid-cols-2 items-center justify-items-center gap-0.5 @[26rem]:flex @[26rem]:justify-center">
              <Button variant="outline" size="icon" aria-label={`给 ${player.name} 减少一手`}
                disabled={hands.pending}
                onMouseDown={keepHandInputFocused}
                onClick={() => adjustHands(-1)} className="h-7 w-full min-w-0 shrink-0 @[26rem]:size-6">
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
                className="order-first col-span-2 h-8 w-full min-w-0 border-transparent @[26rem]:order-none @[26rem]:w-8 bg-transparent px-0 text-center font-bold"
              />
              <Button variant="outline" size="icon" aria-label={`给 ${player.name} 增加一手`}
                disabled={hands.pending}
                onMouseDown={keepHandInputFocused}
                onClick={() => adjustHands(1)} className="h-7 w-full min-w-0 shrink-0 @[26rem]:size-6">
                +
              </Button>
            </div>
            <CellStatus edit={hands} onRetry={hands.draft !== null ? commitHands : undefined} />
          </>
        ) : (
          <span className="block text-center font-semibold">{player.hands}</span>
        )}
      </td>
      <td className="px-0.5 text-center">
        <span className="inline-block max-w-full rounded bg-muted px-1 py-1.5 text-xs font-medium text-muted-foreground tabular-nums whitespace-nowrap @[30rem]:px-2">
          {toCellLabel(derivedBuyIn)}
        </span>
      </td>
      <td className="px-0.5 text-center">
        <Input
          type="text"
          inputMode="decimal"
          aria-label={`${player.name} 的剩余筹码`}
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
          className="h-9 w-full border-transparent bg-muted/50 px-0.5 text-center text-sm font-medium focus:border-primary focus:bg-card focus:text-base md:focus:text-sm"
        />
        <CellStatus edit={current} onRetry={commitCurrent} />
      </td>
      <td
        className={cn(
          "px-0.5 text-center text-xs @[26rem]:text-sm font-bold tabular-nums whitespace-nowrap",
          profitChips > 0 && "text-profit",
          profitChips < 0 && "text-loss",
          profitChips === 0 && "text-muted-foreground"
        )}
      >
        {profitDisplay}
      </td>
      {canEditHands && (
        <td className="px-0 text-center">
          <button
            type="button"
            aria-label={`删除 ${player.name}`}
            onClick={(event) => onDelete(player, event.currentTarget)}
            className="flex h-9 w-full items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            ✕
          </button>
        </td>
      )}
    </tr>
  );
}, arePlayerRowPropsEqual);

function useCellEdit(serverValue: string) {
  const [draft, setDraft] = useState<string | null>(null);
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
    error,
    setError,
    cancel,
    change(value: string) {
      setDraft(value);
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
