import clsx from "clsx";
import { HistoryEntry } from "../types";

interface HistoryPanelProps {
  open: boolean;
  entries: HistoryEntry[];
  onClose: () => void;
}

const formatTimestamp = (timestamp: number) => {
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).format(new Date(timestamp));
  } catch (error) {
    return new Date(timestamp).toLocaleTimeString();
  }
};

const HistoryPanel = ({ open, entries, onClose }: HistoryPanelProps) => {
  return (
    <div
      className={clsx(
        "pointer-events-none fixed bottom-24 right-6 z-40 w-[320px] max-w-[calc(100vw-32px)] transform transition-all duration-200",
        open ? "pointer-events-auto translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      )}
      aria-hidden={!open}
    >
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2">
          <p className="text-sm font-semibold text-slate-800">历史记录</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 transition hover:bg-white hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            aria-label="关闭历史记录"
          >
            ✕
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto px-4 py-3">
          {entries.length === 0 ? (
            <p className="text-xs text-slate-400">暂无历史记录。</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm text-slate-700">
              {entries.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <p className="text-[13px] font-medium text-slate-900">
                    {entry.message}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {formatTimestamp(entry.timestamp)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryPanel;
