"use client";

import { Badge } from "@/components/ui/badge";
import { DisplayMode, Player, RoomConfig } from "@/lib/types";
import { calculateTotals } from "@/lib/stats";
import { cn } from "@/lib/utils";

interface StatsFooterProps {
  players: Player[];
  config: RoomConfig;
  displayMode: DisplayMode;
}

const stripTrailingZeros = (value: number) => {
  if (Number.isInteger(value)) return value.toString();
  return value.toFixed(2).replace(/\.?0+$/, "");
};

const formatTotal = (
  chips: number,
  displayMode: DisplayMode,
  chipValue: number
) => {
  if (displayMode === "cash") {
    return `¥${stripTrailingZeros(chips * chipValue)}`;
  }
  return stripTrailingZeros(chips);
};

const formatDelta = (
  chips: number,
  displayMode: DisplayMode,
  chipValue: number
) => {
  if (Math.abs(chips) < 0.0001) return "0";
  if (displayMode === "cash") {
    const cash = stripTrailingZeros(Math.abs(chips) * chipValue);
    return `${chips < 0 ? "-" : ""}¥${cash}`;
  }
  const chipValueLabel = stripTrailingZeros(Math.abs(chips));
  return `${chips >= 0 ? "+" : "-"}${chipValueLabel}`;
};

export function StatsFooter({
  players,
  config,
  displayMode,
}: StatsFooterProps) {
  const totals = calculateTotals(players, config.chipsPerHand);
  const totalBuyInLabel = formatTotal(
    totals.totalBuyIn,
    displayMode,
    config.chipValue
  );
  const totalCurrentLabel = formatTotal(
    totals.totalCurrent,
    displayMode,
    config.chipValue
  );
  const deltaLabel = formatDelta(totals.delta, displayMode, config.chipValue);

  const discrepancyLabel =
    displayMode === "cash"
      ? `¥${stripTrailingZeros(Math.abs(totals.delta) * config.chipValue)}`
      : stripTrailingZeros(Math.abs(totals.delta));

  const statusText = totals.isBalanced
    ? "✓ 账目平衡"
    : totals.delta > 0
    ? `多 ${discrepancyLabel}`
    : `少 ${discrepancyLabel}`;

  return (
    <footer className="fixed bottom-0 inset-x-0 z-20 border-t border-border/50 bg-elevated/80 backdrop-blur-xl safe-area-bottom supports-[backdrop-filter]:bg-elevated/60">
      <div className="flex h-14 items-center justify-between px-3">
        <div className="grid grid-cols-3 gap-2 flex-1">
          <StatCell label="总买入" value={totalBuyInLabel} />
          <StatCell label="总剩余" value={totalCurrentLabel} />
          <StatCell
            label="差额"
            value={deltaLabel}
            className={cn(
              totals.delta > 0 && "text-profit",
              totals.delta < 0 && "text-loss"
            )}
          />
        </div>
        <Badge
          variant="outline"
          className={cn(
            "ml-3 text-[10px]",
            totals.isBalanced
              ? "border-profit/30 text-profit bg-profit/10"
              : "border-loss/30 text-loss bg-loss/10"
          )}
        >
          {statusText}
        </Badge>
      </div>
    </footer>
  );
}

interface StatCellProps {
  label: string;
  value: string;
  className?: string;
}

function StatCell({ label, value, className }: StatCellProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg bg-muted/50 py-1.5">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className={cn("text-sm font-semibold text-foreground", className)}>
        {value}
      </span>
    </div>
  );
}
