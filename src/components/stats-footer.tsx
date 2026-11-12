"use client";

import { Player, RoomConfig } from "@/lib/types";
import { calculateTotals } from "@/lib/stats";
import { cn } from "@/lib/utils";

interface StatsFooterProps {
  players: Player[];
  config: RoomConfig;
}

const stripTrailingZeros = (value: number) => {
  if (Number.isInteger(value)) return value.toString();
  return value.toFixed(2).replace(/\.?0+$/, "");
};

export function StatsFooter({
  players,
  config,
}: StatsFooterProps) {
  const totals = calculateTotals(players, config.chipsPerHand);
  const totalBuyInLabel = stripTrailingZeros(totals.totalBuyIn);
  const totalCurrentLabel = stripTrailingZeros(totals.totalCurrent);
  const difference = stripTrailingZeros(Math.abs(totals.delta));
  const statusText = totals.isBalanced
    ? "✓ 账目平衡"
    : `${totals.delta > 0 ? "多出" : "缺少"} ${difference} 筹码`;

  return (
    <footer className="z-20 shrink-0 border-t border-border bg-elevated safe-area-bottom">
      <div className="grid grid-cols-[1fr_1fr_1.4fr] items-stretch gap-2 px-3 py-2">
        <StatCell label="总买入" value={totalBuyInLabel} />
        <StatCell label="总剩余" value={totalCurrentLabel} />
        <StatCell
          label="对账"
          value={statusText}
          className={totals.isBalanced ? "text-profit" : "text-loss"}
        />
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
    <div className="flex flex-col items-center justify-center rounded-lg bg-muted/50 px-1 py-1.5 text-center">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className={cn("text-sm font-semibold text-foreground [overflow-wrap:anywhere] min-w-0 max-w-full", className)}>
        {value}
      </span>
    </div>
  );
}
