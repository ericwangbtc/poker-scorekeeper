import clsx from "clsx";
import { DisplayMode, Player, RoomConfig } from "../types";
import { calculateTotals } from "../utils/stats";

interface StatsSummaryProps {
  players: Player[];
  config: RoomConfig;
  displayMode: DisplayMode;
}

const stripTrailingZeros = (value: number) => {
  if (Number.isInteger(value)) {
    return value.toString();
  }
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
  if (Math.abs(chips) < 0.0001) {
    return "0";
  }
  if (displayMode === "cash") {
    const cash = stripTrailingZeros(Math.abs(chips) * chipValue);
    return `${chips < 0 ? "-" : ""}¥${cash}`;
  }
  const chipValueLabel = stripTrailingZeros(Math.abs(chips));
  return `${chips >= 0 ? "+" : "-"}${chipValueLabel}`;
};

const StatsSummary = ({
  players,
  config,
  displayMode
}: StatsSummaryProps) => {
  const totals = calculateTotals(players, config.chipsPerHand);
  const totalBuyInLabel = formatTotal(totals.totalBuyIn, displayMode, config.chipValue);
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

  const statusText =
    Math.abs(totals.delta) < 0.0001
      ? "✅ 账目平衡"
      : totals.delta > 0
      ? `⚠️ 疑似多算${discrepancyLabel}`
      : `⚠️ 疑似少算${discrepancyLabel}`;

  const statusClass = clsx(
    "rounded-full px-3 py-1 text-[12px] font-medium",
    Math.abs(totals.delta) < 0.0001
      ? "bg-emerald-50 text-emerald-600"
      : "bg-amber-50 text-amber-700"
  );

  return (
    <footer className="flex h-[60px] w-full items-center gap-3 border-t border-slate-200 bg-white px-4 text-[13px] text-slate-700 shadow-[0_-4px_12px_rgba(15,23,42,0.08)] sm:px-6">
      <div className="grid flex-1 grid-cols-3 gap-2 text-center">
        <Stat label="总买入" value={totalBuyInLabel} />
        <Stat label="总剩余" value={totalCurrentLabel} />
        <Stat label="差额" value={deltaLabel} />
      </div>
      <span className={statusClass}>{statusText}</span>
    </footer>
  );
};

interface StatProps {
  label: string;
  value: string;
}

const Stat = ({ label, value }: StatProps) => (
  <div className="flex h-full flex-col items-center justify-center rounded-lg bg-slate-50 px-2 text-[12px] font-medium text-slate-600">
    <span className="text-[11px] uppercase tracking-wide text-slate-400">
      {label}
    </span>
    <span className="mt-1 text-[15px] font-semibold text-slate-900">
      {value}
    </span>
  </div>
);

export default StatsSummary;
