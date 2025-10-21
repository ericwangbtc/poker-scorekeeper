import { DisplayMode, Player, RoomConfig } from "../types";
import { formatByDisplayMode } from "../utils/format";
import { calculateTotals } from "../utils/stats";

interface StatsSummaryProps {
  players: Player[];
  config: RoomConfig;
  displayMode: DisplayMode;
}

const StatsSummary = ({
  players,
  config,
  displayMode
}: StatsSummaryProps) => {
  const totals = calculateTotals(players);
  const totalBuyInLabel = formatByDisplayMode(
    totals.totalBuyIn,
    config.chipValue,
    displayMode
  );
  const totalCurrentLabel = formatByDisplayMode(
    totals.totalCurrent,
    config.chipValue,
    displayMode
  );
  const deltaLabel = formatByDisplayMode(
    Math.abs(totals.delta),
    config.chipValue,
    displayMode
  );

  const balanceStatus = totals.delta === 0 ? "balanced" : totals.delta > 0 ? "over" : "short";

  const hint =
    balanceStatus === "balanced"
      ? "✅ 账目平衡，一切正常。"
      : balanceStatus === "over"
      ? `⚠️ 账目不平（疑似有人多算了${deltaLabel}）。`
      : `⚠️ 账目不平（疑似有人少算了${deltaLabel}）。`;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">统计信息</h2>
        <span className="text-xs uppercase tracking-wide text-slate-400">
          实时更新
        </span>
      </header>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="总买入" value={totalBuyInLabel} />
        <Stat label="总剩余" value={totalCurrentLabel} />
        <Stat
          label="差额"
          value={`${totals.delta >= 0 ? "+" : "-"}${deltaLabel.replace(" 筹码", "")}${
            displayMode === "chip" ? " 筹码" : ""
          }`}
        />
      </div>
      <p
        className={`mt-4 rounded-xl px-4 py-3 text-sm ${
          balanceStatus === "balanced"
            ? "bg-emerald-50 text-emerald-600"
            : "bg-amber-50 text-amber-700"
        }`}
      >
        {hint}
      </p>
    </section>
  );
};

interface StatProps {
  label: string;
  value: string;
}

const Stat = ({ label, value }: StatProps) => (
  <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-600">
    <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
  </div>
);

export default StatsSummary;
